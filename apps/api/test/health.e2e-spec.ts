// Teste de rota (aceitação da API): sobe a API inteira em memória, como em produção,
// e faz requisições HTTP de verdade com o Supertest, sem abrir uma porta fixa.
// Diferente do teste unitário do controller, aqui passam também o prefixo /api,
// o roteamento do Nest e a serialização da resposta em JSON.
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarApp } from '../src/criar-app.js';

describe('GET /api/health', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // logger: false deixa a saída dos testes limpa (sem os logs de inicialização do Nest).
    app = await criarApp({ logger: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 200 com { status: "ok" } em JSON', async () => {
    const resposta = await request(app.getHttpServer()).get('/api/health');

    expect(resposta.status).toBe(200);
    expect(resposta.headers['content-type']).toMatch(/application\/json/);
    expect(resposta.body).toEqual({ status: 'ok' });
  });

  it('não existe sem o prefixo /api (responde 404)', async () => {
    const resposta = await request(app.getHttpServer()).get('/health');

    expect(resposta.status).toBe(404);
  });
});
