import { Inject, Injectable } from '@nestjs/common';
import type { Projeto } from '@site-apresentacao/shared';
import { PROJETOS_CURADOS } from './projetos-curados.token.js';

/**
 * Regras do domínio "projetos". Por enquanto só lista os projetos curados;
 * a T-011 junta aqui os dados vivos do GitHub.
 */
@Injectable()
export class ProjetosService {
  // A lista chega pronta e validada pelo provider do ProjetosModule (lida uma vez, na inicialização).
  constructor(@Inject(PROJETOS_CURADOS) private readonly projetos: Projeto[]) {}

  /** Todos os projetos, na ordem do arquivo curado. */
  listar(): Projeto[] {
    // Cópia profunda: quem recebe a lista pode alterá-la sem mexer na que o service guarda.
    return structuredClone(this.projetos);
  }
}
