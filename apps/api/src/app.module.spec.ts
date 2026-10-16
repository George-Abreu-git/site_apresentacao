import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { AppModule } from './app.module.js';
import { HealthController } from './health/health.controller.js';
import { ProjetosController } from './projetos/projetos.controller.js';

describe('AppModule', () => {
  it('inclui o módulo de projetos', async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();

    expect(modulo.get(ProjetosController)).toBeInstanceOf(ProjetosController);
  });

  it('inclui o módulo de saúde', async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();

    expect(modulo.get(HealthController)).toBeInstanceOf(HealthController);
  });
});
