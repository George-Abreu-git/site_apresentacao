import { Module } from '@nestjs/common';
import { GITHUB_CONFIGURACAO, lerConfiguracaoDoGithub } from './configuracao-do-github.js';
import { GithubCliente } from './github-cliente.js';
import { GithubService } from './github.service.js';

// Módulo do domínio "github" (monolito modular, ADR-0001). Não tem controller:
// não expõe rotas, só oferece o GithubService a quem importar o módulo (hoje, o ProjetosModule).
@Module({
  providers: [
    GithubCliente,
    GithubService,
    {
      // Lida uma vez, ao montar a aplicação (depois do .env carregado no main.ts).
      // Valor inválido impede a API de subir, com erro claro — o mesmo "fail fast" da T-010.
      provide: GITHUB_CONFIGURACAO,
      useFactory: () => lerConfiguracaoDoGithub(),
    },
  ],
  // Só o service sai do módulo; cliente e configuração são detalhes internos.
  exports: [GithubService],
})
export class GithubModule {}
