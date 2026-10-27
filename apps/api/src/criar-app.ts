import type { INestApplication, NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
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
  // helmet (ADR-0003) define os cabeçalhos de segurança em toda resposta, inclusive nas de erro:
  // remove o X-Powered-By (não anuncia o Express) e adiciona X-Content-Type-Options: nosniff,
  // entre outros. Vem antes das rotas para valer para todas, atuais e futuras.
  app.use(helmet());
  app.setGlobalPrefix(PREFIXO_DAS_ROTAS);
  return app;
}
