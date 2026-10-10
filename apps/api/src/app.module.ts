import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';

// Módulo raiz: junta os módulos da API. Novos assuntos (ex.: projetos, T-010) entram em `imports`.
@Module({
  imports: [HealthModule],
})
export class AppModule {}
