import { Inject, Injectable } from '@nestjs/common';
import type { DadosDoGithub } from '@site-apresentacao/shared';
import { type ConfiguracaoDoGithub, GITHUB_CONFIGURACAO } from './configuracao-do-github.js';
import type { RepositorioNoGithub } from './repositorio-do-github.js';

const ENDERECO_DA_API_DO_GITHUB = 'https://api.github.com';

/** Versão da API REST do GitHub que este código conhece (o GitHub recomenda fixar). */
const VERSAO_DA_API_DO_GITHUB = '2022-11-28';

/**
 * Erro lançado quando não deu para obter os dados de um repositório: GitHub fora do ar,
 * lento demais, limite de requisições atingido, repositório inexistente ou resposta estranha.
 * Quem usa o cliente trata todos do mesmo jeito: segue só com os dados curados.
 */
export class GithubIndisponivelError extends Error {
  override name = 'GithubIndisponivelError';
}

/**
 * Fala com a API REST do GitHub. Só sabe fazer a requisição e traduzir a resposta;
 * cache e plano B (dados ausentes) ficam no GithubService.
 *
 * Usa o `fetch` que já vem no Node (sem biblioteca extra).
 */
@Injectable()
export class GithubCliente {
  constructor(@Inject(GITHUB_CONFIGURACAO) private readonly configuracao: ConfiguracaoDoGithub) {}

  /**
   * Busca linguagem principal, estrelas e último push de um repositório.
   *
   * @throws GithubIndisponivelError em qualquer falha. A mensagem nunca traz o token.
   */
  async buscarRepositorio({ dono, nome }: RepositorioNoGithub): Promise<DadosDoGithub> {
    const endereco = `${ENDERECO_DA_API_DO_GITHUB}/repos/${encodeURIComponent(dono)}/${encodeURIComponent(nome)}`;

    let resposta: Response;
    try {
      resposta = await fetch(endereco, {
        headers: this.cabecalhos(),
        // Cancela a requisição se o GitHub não responder a tempo.
        signal: AbortSignal.timeout(this.configuracao.tempoLimiteDaRequisicaoEmMs),
      });
    } catch (erro) {
      throw new GithubIndisponivelError(
        `não foi possível falar com o GitHub (${(erro as Error).message})`,
      );
    }

    if (!resposta.ok) {
      throw new GithubIndisponivelError(
        `GitHub respondeu ${resposta.status} (${motivoDoStatus(resposta.status)})`,
      );
    }

    return traduzirResposta(await resposta.json().catch(() => undefined));
  }

  private cabecalhos(): Record<string, string> {
    const cabecalhos: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': VERSAO_DA_API_DO_GITHUB,
      // O GitHub recusa requisições sem User-Agent.
      'User-Agent': 'site-apresentacao-api',
    };
    // O token vai só neste cabeçalho, direto para o GitHub. Nenhuma mensagem de erro
    // ou de log monta texto com os cabeçalhos, por isso ele nunca vaza (RNF-05).
    if (this.configuracao.token) {
      cabecalhos.Authorization = `Bearer ${this.configuracao.token}`;
    }
    return cabecalhos;
  }
}

function motivoDoStatus(status: number): string {
  // O GitHub usa 403 (e às vezes 429) quando o limite de requisições por hora acaba.
  if (status === 403 || status === 429) {
    return 'limite de requisições atingido';
  }
  if (status === 404) {
    return 'repositório não encontrado';
  }
  if (status === 401) {
    return 'token recusado';
  }
  return 'erro no GitHub';
}

/**
 * Confere os campos usados e os traduz para o formato do site.
 * A resposta vem de fora da API, então entra como `unknown` (como o arquivo curado na T-010).
 */
function traduzirResposta(corpo: unknown): DadosDoGithub {
  if (typeof corpo !== 'object' || corpo === null) {
    throw new GithubIndisponivelError('resposta do GitHub em formato inesperado');
  }

  const { language, stargazers_count, pushed_at } = corpo as Record<string, unknown>;
  const linguagemValida = language === null || typeof language === 'string';
  if (!linguagemValida || typeof stargazers_count !== 'number' || typeof pushed_at !== 'string') {
    throw new GithubIndisponivelError('resposta do GitHub em formato inesperado');
  }

  return {
    linguagem: language,
    estrelas: stargazers_count,
    // `pushed_at` (último envio de código) e não `updated_at`, que muda também com
    // alterações que não são código (ex.: descrição do repositório, estrelas).
    ultimaAtualizacao: pushed_at,
  };
}
