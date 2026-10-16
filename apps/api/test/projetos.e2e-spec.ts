// Teste de rota (aceitação da API) do módulo projetos — T-010, RF-06 (parte 1).
// Sobe a API inteira em memória e faz requisições HTTP de verdade com o Supertest.
// Os cenários de arquivo inválido montam o mesmo AppModule com o Test do Nest,
// trocando só o provider PROJETOS_CURADOS para ler um arquivo temporário.
//
// Desde a T-011 a rota consulta o GitHub: aqui o `fetch` global é sempre simulado
// (nenhum teste vai à internet). Os cenários do GitHub estão em github.e2e-spec.ts.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Projeto } from '@site-apresentacao/shared';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { criarApp, PREFIXO_DAS_ROTAS } from '../src/criar-app.js';
import {
  CAMINHO_DO_ARQUIVO_CURADO,
  lerProjetosCurados,
} from '../src/projetos/ler-projetos-curados.js';
import { PROJETOS_CURADOS } from '../src/projetos/projetos-curados.token.js';
import { validarProjetosCurados } from '../src/projetos/validar-projetos-curados.js';
import { repositorioNoGithub, respostaJson, semGithub, simularGithub } from './apoio/github-simulado.js';

/** O que a rota acrescenta a projetos com repositório no GitHub, com o GitHub simulado respondendo. */
const DADOS_VIVOS_SIMULADOS = {
  disponivel: true,
  linguagem: 'TypeScript',
  estrelas: 7,
  ultimaAtualizacao: '2026-10-01T12:00:00Z',
} as const;

beforeEach(() => {
  // Ambiente previsível: sem token real nem validade de cache vindos da máquina.
  vi.stubEnv('GITHUB_TOKEN', '');
  vi.stubEnv('GITHUB_CACHE_TTL_SEGUNDOS', '');
  simularGithub(() => respostaJson(repositorioNoGithub()));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

/** Monta a API completa (com o prefixo /api), mas lendo o arquivo curado do caminho indicado. */
async function criarAppComArquivo(caminho: string): Promise<INestApplication> {
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PROJETOS_CURADOS)
    .useFactory({ factory: () => lerProjetosCurados(caminho) })
    .compile();
  const app = modulo.createNestApplication({ logger: false });
  app.setGlobalPrefix(PREFIXO_DAS_ROTAS);
  await app.init();
  return app;
}

describe('GET /api/projetos (arquivo curado do repositório)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // A configuração do GitHub é lida ao montar a API, antes do beforeEach do arquivo.
    vi.stubEnv('GITHUB_TOKEN', '');
    vi.stubEnv('GITHUB_CACHE_TTL_SEGUNDOS', '');
    app = await criarApp({ logger: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 200 em JSON com todos os projetos do arquivo, na ordem do arquivo', async () => {
    // Compara com o JSON cru do arquivo (e não com o leitor da API), para pegar
    // qualquer perda, troca de ordem ou campo acrescentado no caminho até a resposta.
    // O único campo acrescentado é o "github", nos projetos com repositório no GitHub (T-011).
    const arquivo = JSON.parse(readFileSync(CAMINHO_DO_ARQUIVO_CURADO, 'utf8')) as Projeto[];
    const esperado = arquivo.map((projeto) =>
      projeto.repositorio?.startsWith('https://github.com/')
        ? { ...projeto, github: DADOS_VIVOS_SIMULADOS }
        : projeto,
    );

    const resposta = await request(app.getHttpServer()).get('/api/projetos');

    expect(resposta.status).toBe(200);
    expect(resposta.headers['content-type']).toMatch(/application\/json/);
    expect(resposta.body).toEqual(esperado);
    expect(resposta.body.map((p: { titulo: string }) => p.titulo)).toEqual(
      arquivo.map((p) => p.titulo),
    );
  });

  it('devolve ao menos 2 projetos, cada um no formato do tipo Projeto', async () => {
    const resposta = await request(app.getHttpServer()).get('/api/projetos');

    expect(resposta.body.length).toBeGreaterThanOrEqual(2);
    // Tirando o "github" (preenchido pela API), cada projeto segue o formato do arquivo curado.
    const curados = (resposta.body as Projeto[]).map(semGithub);
    expect(() => validarProjetosCurados(curados)).not.toThrow();
    // E o "github", quando presente, é um dos dois formatos de DadosVivosDoGithub.
    for (const { github } of resposta.body as Projeto[]) {
      if (github === undefined) continue;
      expect([
        ['disponivel', 'estrelas', 'linguagem', 'ultimaAtualizacao'],
        ['disponivel'],
      ]).toContainEqual(Object.keys(github).sort());
    }
  });

  it('projeto sem repositório aparece só com os dados curados (sem o campo "repositorio")', async () => {
    const resposta = await request(app.getHttpServer()).get('/api/projetos');

    const semRepositorio = resposta.body.filter((p: object) => !('repositorio' in p));
    expect(semRepositorio.length).toBeGreaterThanOrEqual(1);
  });

  it('respostas seguidas são iguais (uma requisição não altera a lista da seguinte)', async () => {
    const primeira = await request(app.getHttpServer()).get('/api/projetos');
    const segunda = await request(app.getHttpServer()).get('/api/projetos');

    expect(segunda.body).toEqual(primeira.body);
  });

  it('ignora query string (responde a mesma lista)', async () => {
    const semQuery = await request(app.getHttpServer()).get('/api/projetos');
    const comQuery = await request(app.getHttpServer()).get('/api/projetos?ordem=desc&x=');

    expect(comQuery.status).toBe(200);
    expect(comQuery.body).toEqual(semQuery.body);
  });

  it('não existe sem o prefixo /api (responde 404)', async () => {
    const resposta = await request(app.getHttpServer()).get('/projetos');

    expect(resposta.status).toBe(404);
  });

  it.each(['post', 'put', 'delete'] as const)(
    'não aceita %s em /api/projetos (responde 404: a rota é só leitura)',
    async (metodo) => {
      const resposta = await request(app.getHttpServer())[metodo]('/api/projetos');

      expect(resposta.status).toBe(404);
    },
  );
});

describe('arquivo curado: lido na inicialização, não na requisição', () => {
  let pasta: string;
  let arquivo: string;

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'api-projetos-e2e-'));
    arquivo = join(pasta, 'projetos.json');
  });

  afterEach(() => {
    rmSync(pasta, { recursive: true, force: true });
  });

  it('com arquivo válido, a rota devolve exatamente o conteúdo dele', async () => {
    const projetos = [
      { titulo: 'B', descricao: 'segundo em ordem alfabética, primeiro no arquivo', stacks: ['Go'] },
      { titulo: 'A', descricao: 'último no arquivo', stacks: ['Rust'], demo: 'https://a.dev' },
    ];
    writeFileSync(arquivo, JSON.stringify(projetos));
    const app = await criarAppComArquivo(arquivo);

    try {
      const resposta = await request(app.getHttpServer()).get('/api/projetos');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual(projetos);
    } finally {
      await app.close();
    }
  });

  it('com lista vazia, responde 200 com []', async () => {
    writeFileSync(arquivo, '[]');
    const app = await criarAppComArquivo(arquivo);

    try {
      const resposta = await request(app.getHttpServer()).get('/api/projetos');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it('estragar o arquivo depois de a API subir não afeta as respostas (lido uma vez só)', async () => {
    const projetos = [{ titulo: 'Original', descricao: 'lido ao subir', stacks: ['React'] }];
    writeFileSync(arquivo, JSON.stringify(projetos));
    const app = await criarAppComArquivo(arquivo);

    try {
      writeFileSync(arquivo, 'isto não é JSON');
      const resposta = await request(app.getHttpServer()).get('/api/projetos');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual(projetos);
    } finally {
      await app.close();
    }
  });

  it.each([
    ['ausente', null, /não foi possível ler o arquivo/],
    ['vazio', '', /não é um JSON válido/],
    ['com JSON inválido', '[{ "titulo": "sem fechar" ', /não é um JSON válido/],
    ['que não é uma lista', '{ "projetos": [] }', /deve ser uma lista \(array\) de projetos/],
    ['com projeto sem descrição', '[{ "titulo": "X", "stacks": ["A"] }]', /projeto 1 \("X"\): campo "descricao"/],
    ['com stacks vazias de texto', '[{ "titulo": "X", "descricao": "d", "stacks": [""] }]', /campo "stacks"/],
    ['com repositório sem http(s)', '[{ "titulo": "X", "descricao": "d", "stacks": ["A"], "repositorio": "github.com/x" }]', /campo "repositorio"/],
    ['com campo desconhecido', '[{ "titulo": "X", "descricao": "d", "stacks": ["A"], "titlo": "Y" }]', /campo "titlo" não faz parte do formato/],
  ])('arquivo %s: a API não sobe, com erro claro que traz o caminho', async (_caso, conteudo, problema) => {
    if (conteudo !== null) writeFileSync(arquivo, conteudo);

    const subida = criarAppComArquivo(arquivo);

    await expect(subida).rejects.toThrow(problema);
    await expect(criarAppComArquivo(arquivo)).rejects.toThrow(arquivo);
    await expect(criarAppComArquivo(arquivo)).rejects.toThrow(/Arquivo curado de projetos inválido/);
  });
});
