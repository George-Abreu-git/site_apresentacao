import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { ProjetosModule } from './projetos/projetos.module.js';

// Módulo raiz: junta os módulos da API. Novos assuntos entram em `imports`.
// O GithubModule (T-011) não aparece aqui: quem o usa é o ProjetosModule, que o importa.
@Module({
  imports: [HealthModule, ProjetosModule],
})
export class AppModule {}
