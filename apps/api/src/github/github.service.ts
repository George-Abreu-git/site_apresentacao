import { Inject, Injectable, Logger } from '@nestjs/common';
import type { DadosDoGithub, DadosVivosDoGithub } from '@site-apresentacao/shared';
import { CacheComValidade } from './cache-com-validade.js';
import { type ConfiguracaoDoGithub, GITHUB_CONFIGURACAO } from './configuracao-do-github.js';
import { GithubCliente } from './github-cliente.js';
import { extrairRepositorioDoGithub, type RepositorioNoGithub } from './repositorio-do-github.js';

/**
 * Regras do domínio "github": dados vivos de um repositório, com cache e plano B.
 *
 * - **Cache**: cada repositório é consultado no máximo uma vez por período de validade
 *   (GITHUB_CACHE_TTL_SEGUNDOS), para não estourar o limite da API do GitHub.
 * - **Plano B (fallback)**: se o GitHub falhar, devolve `{ disponivel: false }` em vez de
 *   erro. Assim /api/projetos sempre responde, ao menos com os dados curados (RF-06).
 */
@Injectable()
export class GithubService {
  // O contexto (nome da classe) aparece no log: "[GithubService] ...".
  private readonly logger = new Logger(GithubService.name);
  private readonly cache: CacheComValidade<DadosDoGithub>;

  constructor(
    private readonly cliente: GithubCliente,
    @Inject(GITHUB_CONFIGURACAO) configuracao: ConfiguracaoDoGithub,
  ) {
    this.cache = new CacheComValidade(configuracao.validadeDoCacheEmMs);
  }

  /**
   * Dados vivos do repositório indicado no campo `repositorio` de um projeto.
   *
   * @returns `undefined` se o endereço não é do GitHub (o projeto fica só com os dados curados);
   *   `{ disponivel: true, ... }` com os dados; ou `{ disponivel: false }` se o GitHub falhou.
   *   Nunca lança erro.
   */
  async dadosVivos(enderecoDoRepositorio: string): Promise<DadosVivosDoGithub | undefined> {
    const repositorio = extrairRepositorioDoGithub(enderecoDoRepositorio);
    if (repositorio === null) {
      return undefined;
    }

    const dados = await this.buscarComCache(repositorio);
    return dados === null ? { disponivel: false } : { disponivel: true, ...dados };
  }

  /** Os dados do cache ou, se não houver, do GitHub. `null` quando o GitHub falhou. */
  private async buscarComCache(repositorio: RepositorioNoGithub): Promise<DadosDoGithub | null> {
    // O GitHub não diferencia maiúsculas nos nomes: "Dono/Repo" e "dono/repo" são o mesmo.
    const chave = `${repositorio.dono}/${repositorio.nome}`.toLowerCase();

    const guardado = this.cache.obter(chave);
    if (guardado !== undefined) {
      return guardado;
    }

    try {
      const dados = await this.cliente.buscarRepositorio(repositorio);
      this.cache.guardar(chave, dados);
      return dados;
    } catch (erro) {
      // A falha não vai para o cache: assim que o GitHub voltar, a próxima requisição já
      // traz os dados. A mensagem vem do GithubCliente, que nunca inclui o token.
      this.logger.warn(
        `Dados vivos do GitHub ausentes para ${repositorio.dono}/${repositorio.nome}: ${(erro as Error).message}`,
      );
      return null;
    }
  }
}
