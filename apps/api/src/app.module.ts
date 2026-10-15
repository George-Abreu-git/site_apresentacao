import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { ProjetosModule } from './projetos/projetos.module.js';

// Módulo raiz: junta os módulos da API. Novos assuntos (ex.: github, T-011) entram em `imports`.
@Module({
  imports: [HealthModule, ProjetosModule],
})
export class AppModule {}
