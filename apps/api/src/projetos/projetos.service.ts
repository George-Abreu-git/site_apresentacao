import { Inject, Injectable } from '@nestjs/common';
import type { Projeto } from '@site-apresentacao/shared';
import { GithubService } from '../github/github.service.js';
import type { ProjetoCurado } from './projeto-curado.js';
import { PROJETOS_CURADOS } from './projetos-curados.token.js';

/**
 * Regras do domínio "projetos": junta os projetos do arquivo curado (RF-06, item 1)
 * com os dados vivos do GitHub (RF-06, item 2).
 */
@Injectable()
export class ProjetosService {
  constructor(
    // A lista chega pronta e validada pelo provider do ProjetosModule (lida uma vez, na inicialização).
    @Inject(PROJETOS_CURADOS) private readonly projetos: ProjetoCurado[],
    // Vem do GithubModule, que o exporta; o Nest o encontra pelo tipo, como na T-010.
    private readonly github: GithubService,
  ) {}

  /** Todos os projetos, na ordem do arquivo curado, com os dados vivos quando houver. */
  async listar(): Promise<Projeto[]> {
    // Promise.all consulta os repositórios ao mesmo tempo (e não um depois do outro)
    // e devolve os resultados na ordem da lista, que é a ordem do arquivo curado.
    return Promise.all(this.projetos.map((projeto) => this.completar(projeto)));
  }

  private async completar(projeto: ProjetoCurado): Promise<Projeto> {
    // Cópia profunda: quem recebe o projeto pode alterá-lo sem mexer na lista guardada.
    const copia: Projeto = structuredClone(projeto);
    if (projeto.repositorio === undefined) {
      return copia;
    }

    const github = await this.github.dadosVivos(projeto.repositorio);
    // `undefined`: o repositório não é do GitHub, então o projeto fica só com os dados curados.
    return github === undefined ? copia : { ...copia, github };
  }
}
