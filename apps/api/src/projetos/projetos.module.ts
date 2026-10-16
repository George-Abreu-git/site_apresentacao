import { Module } from '@nestjs/common';
import { GithubModule } from '../github/github.module.js';
import { lerProjetosCurados } from './ler-projetos-curados.js';
import { ProjetosController } from './projetos.controller.js';
import { PROJETOS_CURADOS } from './projetos-curados.token.js';
import { ProjetosService } from './projetos.service.js';

// Módulo do domínio "projetos" (monolito modular, ADR-0001).
@Module({
  // Importar o GithubModule dá acesso ao que ele exporta (o GithubService).
  imports: [GithubModule],
  controllers: [ProjetosController],
  providers: [
    ProjetosService,
    {
      // Provider de fábrica: o Nest chama `useFactory` uma vez, ao montar a aplicação.
      // Assim o arquivo curado é lido e validado na inicialização: se estiver inválido,
      // a API nem sobe (erro claro no log), em vez de falhar só quando alguém pedir /api/projetos.
      provide: PROJETOS_CURADOS,
      useFactory: () => lerProjetosCurados(),
    },
  ],
})
export class ProjetosModule {}
