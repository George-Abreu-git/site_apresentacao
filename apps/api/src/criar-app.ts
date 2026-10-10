import type { INestApplication, NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

/** Todas as rotas da API começam com /api (ex.: GET /api/health). */
export const PREFIXO_DAS_ROTAS = 'api';

/**
 * Cria a aplicação Nest já configurada, mas sem começar a escutar uma porta.
 *
 * Fica separada do main.ts para que os testes de rota (Supertest, em test/)
 * montem exatamente a mesma API que roda de verdade:
 *   const app = await criarApp({ logger: false });
 *   await app.init();
 *   await request(app.getHttpServer()).get('/api/health');
 */
export async function criarApp(opcoes?: NestApplicationOptions): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, opcoes);
  app.setGlobalPrefix(PREFIXO_DAS_ROTAS);
  return app;
}
