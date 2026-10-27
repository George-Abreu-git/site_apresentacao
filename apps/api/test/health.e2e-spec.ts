// Teste de rota (aceitação da API): sobe a API inteira em memória, como em produção,
// e faz requisições HTTP de verdade com o Supertest, sem abrir uma porta fixa.
// Diferente do teste unitário do controller, aqui passam também o prefixo /api,
// o roteamento do Nest e a serialização da resposta em JSON.
//
// Funcionalidade 14 da T-016: a rota de saúde e a configuração por ambiente (.env no
// desenvolvimento, variáveis do painel no Render), inclusive o que a API NÃO deve expor.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { carregarVariaveisDeAmbiente } from '../src/config/carregar-variaveis-de-ambiente.js';
import { criarApp } from '../src/criar-app.js';
import { cabecalhosDaChamada, repositorioNoGithub, respostaJson, simularGithub } from './apoio/github-simulado.js';

/** Sinais de que uma resposta de erro vazou detalhes internos (pilha de chamadas, caminhos do servidor). */
const SINAIS_DE_DETALHE_INTERNO = [/\bat \w/, /node_modules/, /[A-Z]:\\/, /\/home\//, /\.ts:\d+/, /\.js:\d+/];

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

  it('HEAD /api/health responde 200 sem corpo (usado por monitores de disponibilidade)', async () => {
    const resposta = await request(app.getHttpServer()).head('/api/health');

    expect(resposta.status).toBe(200);
    expect(resposta.text).toBeUndefined();
  });

  it('query string e barra no final não mudam a resposta', async () => {
    for (const rota of ['/api/health?verbose=1&x=', '/api/health/']) {
      const resposta = await request(app.getHttpServer()).get(rota);

      expect(resposta.status, rota).toBe(200);
      expect(resposta.body, rota).toEqual({ status: 'ok' });
    }
  });

  it.each(['post', 'put', 'patch', 'delete'] as const)(
    'não aceita %s em /api/health (responde 404: a rota é só leitura)',
    async (metodo) => {
      const resposta = await request(app.getHttpServer())[metodo]('/api/health');

      expect(resposta.status).toBe(404);
    },
  );

  it('rota inexistente dentro de /api responde 404 em JSON, sem pilha de chamadas nem caminhos do servidor', async () => {
    const resposta = await request(app.getHttpServer()).get('/api/rota-que-nao-existe');

    expect(resposta.status).toBe(404);
    expect(resposta.headers['content-type']).toMatch(/application\/json/);
    for (const sinal of SINAIS_DE_DETALHE_INTERNO) {
      expect(resposta.text).not.toMatch(sinal);
    }
  });

  it('endereço malformado responde 400 em JSON, sem pilha de chamadas nem caminhos do servidor', async () => {
    // "%E0%A4%A" é uma sequência UTF-8 incompleta: decodificar o endereço falha.
    const resposta = await request(app.getHttpServer()).get('/api/%E0%A4%A');

    expect(resposta.status).toBe(400);
    expect(resposta.headers['content-type']).toMatch(/application\/json/);
    for (const sinal of SINAIS_DE_DETALHE_INTERNO) {
      expect(resposta.text).not.toMatch(sinal);
    }
  });

  // Cabeçalhos de segurança (BUG-Q5 da T-016, corrigido na T-026 com o helmet — ADR-0003).
  // Cada requisição abaixo produz um tipo diferente de resposta: sucesso, HEAD sem corpo,
  // 404 de rota inexistente, 404 de método não aceito, 400 de endereço malformado e rota fora do /api.
  const REQUISICOES_DE_TODO_TIPO = [
    { metodo: 'get', rota: '/api/health' },
    { metodo: 'head', rota: '/api/health' },
    { metodo: 'get', rota: '/api/rota-que-nao-existe' },
    { metodo: 'post', rota: '/api/health' },
    { metodo: 'get', rota: '/api/%E0%A4%A' },
    { metodo: 'get', rota: '/health' },
  ] as const;

  // O Express envia "X-Powered-By: Express" por padrão, revelando a tecnologia do servidor a quem
  // fizer qualquer requisição (facilita procurar falhas conhecidas da versão).
  it('as respostas não anunciam a tecnologia do servidor (sem X-Powered-By)', async () => {
    for (const { metodo, rota } of REQUISICOES_DE_TODO_TIPO) {
      const resposta = await request(app.getHttpServer())[metodo](rota);

      expect(resposta.headers, `${metodo} ${rota}`).not.toHaveProperty('x-powered-by');
    }
  });

  // Sem "X-Content-Type-Options: nosniff", o navegador pode tentar adivinhar o tipo de uma resposta
  // em vez de respeitar o Content-Type.
  it('as respostas pedem ao navegador para não adivinhar o tipo (X-Content-Type-Options: nosniff)', async () => {
    for (const { metodo, rota } of REQUISICOES_DE_TODO_TIPO) {
      const resposta = await request(app.getHttpServer())[metodo](rota);

      expect(resposta.headers['x-content-type-options'], `${metodo} ${rota}`).toBe('nosniff');
    }
  });

  it('os cabeçalhos de segurança não mudam os códigos de status das respostas', async () => {
    const esperados = [200, 200, 404, 404, 400, 404];

    for (const [i, { metodo, rota }] of REQUISICOES_DE_TODO_TIPO.entries()) {
      const resposta = await request(app.getHttpServer())[metodo](rota);

      expect(resposta.status, `${metodo} ${rota}`).toBe(esperados[i]);
    }
  });
});

describe('configuração por ambiente (.env no desenvolvimento, painel no Render)', () => {
  const VARIAVEIS = ['GITHUB_TOKEN', 'GITHUB_CACHE_TTL_SEGUNDOS'] as const;
  const TOKEN_DO_ARQUIVO = 'ghp_tokenDoArquivoEnv0123456789';
  const TOKEN_DO_AMBIENTE = 'ghp_tokenDoPainelDoRender0123456789';
  let pasta: string;
  let arquivoEnv: string;
  let originais: Record<string, string | undefined>;
  const apps: INestApplication[] = [];

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'api-ambiente-e2e-'));
    arquivoEnv = join(pasta, '.env');
    // O .env só preenche variáveis que NÃO existem no ambiente; por isso elas são apagadas
    // (e não só esvaziadas) antes de cada teste, e devolvidas no fim.
    originais = Object.fromEntries(VARIAVEIS.map((nome) => [nome, process.env[nome]]));
    for (const nome of VARIAVEIS) delete process.env[nome];
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
    rmSync(pasta, { recursive: true, force: true });
    for (const nome of VARIAVEIS) {
      if (originais[nome] === undefined) delete process.env[nome];
      else process.env[nome] = originais[nome];
    }
    vi.restoreAllMocks();
  });

  /** Sobe a API como o main.ts: primeiro o .env, depois a aplicação. */
  async function subirComEnv(conteudoDoEnv: string | null): Promise<INestApplication> {
    if (conteudoDoEnv !== null) writeFileSync(arquivoEnv, conteudoDoEnv);
    carregarVariaveisDeAmbiente(arquivoEnv);
    // abortOnError: false faz o Nest rejeitar a promessa em vez de encerrar o processo dos testes
    // (o padrão, que é o que acontece no main.ts quando a configuração é inválida).
    const app = await criarApp({ logger: false, abortOnError: false });
    await app.init();
    apps.push(app);
    return app;
  }

  it('sem arquivo .env (como no Render), a API sobe e responde /api/health', async () => {
    const app = await subirComEnv(null);

    const resposta = await request(app.getHttpServer()).get('/api/health');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: 'ok' });
  });

  it('o GITHUB_TOKEN do .env chega ao GitHub no cabeçalho Authorization e não aparece em nenhuma resposta', async () => {
    const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
    const app = await subirComEnv(`GITHUB_TOKEN=${TOKEN_DO_ARQUIVO}\n`);

    const projetos = await request(app.getHttpServer()).get('/api/projetos');
    const saude = await request(app.getHttpServer()).get('/api/health');

    expect(cabecalhosDaChamada(fetchSimulado).Authorization).toBe(`Bearer ${TOKEN_DO_ARQUIVO}`);
    for (const resposta of [projetos, saude]) {
      expect(resposta.text).not.toContain(TOKEN_DO_ARQUIVO);
      expect(JSON.stringify(resposta.headers)).not.toContain(TOKEN_DO_ARQUIVO);
    }
  });

  it('a variável já definida no ambiente (painel do Render) vale mais que a do .env', async () => {
    process.env.GITHUB_TOKEN = TOKEN_DO_AMBIENTE;
    const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
    const app = await subirComEnv(`GITHUB_TOKEN=${TOKEN_DO_ARQUIVO}\n`);

    await request(app.getHttpServer()).get('/api/projetos');

    expect(cabecalhosDaChamada(fetchSimulado).Authorization).toBe(`Bearer ${TOKEN_DO_AMBIENTE}`);
  });

  it('GITHUB_TOKEN vazio no .env conta como ausente: a chamada ao GitHub vai sem Authorization', async () => {
    const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
    const app = await subirComEnv('GITHUB_TOKEN=\n');

    const resposta = await request(app.getHttpServer()).get('/api/projetos');

    expect(resposta.status).toBe(200);
    expect(cabecalhosDaChamada(fetchSimulado)).not.toHaveProperty('Authorization');
  });

  it('GITHUB_CACHE_TTL_SEGUNDOS inválido no .env impede a API de subir, com erro claro', async () => {
    await expect(subirComEnv('GITHUB_CACHE_TTL_SEGUNDOS=uma-hora\n')).rejects.toThrow(
      /GITHUB_CACHE_TTL_SEGUNDOS deve ser um número inteiro de segundos maior que zero/,
    );
  });

  it('GITHUB_CACHE_TTL_SEGUNDOS do .env define a validade do cache', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      const inicio = new Date('2026-10-15T12:00:00Z').getTime();
      vi.setSystemTime(inicio);
      const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
      const app = await subirComEnv('GITHUB_CACHE_TTL_SEGUNDOS=10\n');

      await request(app.getHttpServer()).get('/api/projetos');
      vi.setSystemTime(inicio + 9_000);
      await request(app.getHttpServer()).get('/api/projetos');
      expect(fetchSimulado).toHaveBeenCalledTimes(1);

      vi.setSystemTime(inicio + 10_000);
      await request(app.getHttpServer()).get('/api/projetos');
      expect(fetchSimulado).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
