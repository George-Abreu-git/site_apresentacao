import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
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

  // Cabeçalhos de segurança (T-026, ADR-0003): o helmet é ligado em criarApp(), então vale
  // para toda resposta, inclusive as de erro que o próprio Nest gera (404, 400).
  describe('cabeçalhos de segurança (helmet)', () => {
    async function responder(rota: string) {
      app = await criarApp({ logger: false });
      await app.init();
      return request(app.getHttpServer() as Server).get(rota);
    }

    it('não anuncia a tecnologia do servidor (sem X-Powered-By)', async () => {
      const resposta = await responder('/api/health');

      expect(resposta.headers).not.toHaveProperty('x-powered-by');
    });

    it('pede ao navegador para não adivinhar o tipo (X-Content-Type-Options: nosniff) numa resposta de sucesso', async () => {
      const resposta = await responder('/api/health');

      expect(resposta.headers['x-content-type-options']).toBe('nosniff');
    });

    it('também envia nosniff e omite X-Powered-By nas respostas de erro (rota inexistente, 404)', async () => {
      const resposta = await responder('/api/rota-que-nao-existe');

      expect(resposta.status).toBe(404);
      expect(resposta.headers['x-content-type-options']).toBe('nosniff');
      expect(resposta.headers).not.toHaveProperty('x-powered-by');
    });

    it('impede que a API seja exibida dentro de um iframe de outro site (X-Frame-Options: SAMEORIGIN)', async () => {
      const resposta = await responder('/api/health');

      expect(resposta.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('os cabeçalhos de segurança não mudam a resposta JSON (status, Content-Type e corpo)', async () => {
      const resposta = await responder('/api/health');

      expect(resposta.status).toBe(200);
      expect(resposta.headers['content-type']).toMatch(/application\/json/);
      expect(resposta.body).toEqual({ status: 'ok' });
    });
  });
});
