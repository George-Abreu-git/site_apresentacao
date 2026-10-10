import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';

// Monolito modular (ADR-0001): cada assunto da API é um módulo do Nest.
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
