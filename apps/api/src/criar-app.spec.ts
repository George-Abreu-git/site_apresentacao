import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarApp, PREFIXO_DAS_ROTAS } from './criar-app.js';
import { HealthController } from './health/health.controller.js';
import { ProjetosController } from './projetos/projetos.controller.js';

describe('criarApp', () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    vi.unstubAllEnvs();
  });

  it('todas as rotas ficam sob o prefixo "api" (ex.: /api/health)', () => {
    expect(PREFIXO_DAS_ROTAS).toBe('api');
  });

  it('monta a aplicação com os módulos de saúde e de projetos', async () => {
    app = await criarApp({ logger: false });

    expect(app.get(HealthController).verificar()).toEqual({ status: 'ok' });
    expect(app.get(ProjetosController)).toBeInstanceOf(ProjetosController);
  });

  it('não começa a escutar uma porta sozinha (quem escuta é o main.ts), o que deixa os testes de rota usarem a mesma API', async () => {
    app = await criarApp({ logger: false });
    await app.init();

    expect((app.getHttpServer() as Server).listening).toBe(false);
  });

  it('cada chamada cria uma aplicação nova e independente', async () => {
    app = await criarApp({ logger: false });
    const outra = await criarApp({ logger: false });

    try {
      expect(outra).not.toBe(app);
    } finally {
      await outra.close();
    }
  });

  it('com uma variável de ambiente inválida, falha ao criar a aplicação (a API nem sobe)', async () => {
    vi.stubEnv('GITHUB_CACHE_TTL_SEGUNDOS', 'uma hora');

    // abortOnError: false faz o Nest rejeitar a promessa em vez de encerrar o processo (o padrão).
    await expect(criarApp({ logger: false, abortOnError: false })).rejects.toThrow(/GITHUB_CACHE_TTL_SEGUNDOS/);
  });
});
