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
    // O "github" é preenchido pela API (T-011): o arquivo curado não pode trazê-lo pronto.
    ['com o campo "github" preenchido à mão', '[{ "titulo": "X", "descricao": "d", "stacks": ["A"], "github": { "disponivel": true } }]', /campo "github" não faz parte do formato/],
    ['com projeto que não é objeto', '["só um texto"]', /projeto 1: deve ser um objeto/],
    ['com demo em javascript:', '[{ "titulo": "X", "descricao": "d", "stacks": ["A"], "demo": "javascript:alert(1)" }]', /campo "demo"/],
  ])('arquivo %s: a API não sobe, com erro claro que traz o caminho', async (_caso, conteudo, problema) => {
    if (conteudo !== null) writeFileSync(arquivo, conteudo);

    const subida = criarAppComArquivo(arquivo);

    await expect(subida).rejects.toThrow(problema);
    await expect(criarAppComArquivo(arquivo)).rejects.toThrow(arquivo);
    await expect(criarAppComArquivo(arquivo)).rejects.toThrow(/Arquivo curado de projetos inválido/);
  });
});

describe('GET /api/projetos: bordas e segurança (pente-fino da T-016)', () => {
  let pasta: string;
  let arquivo: string;
  const apps: INestApplication[] = [];

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'api-projetos-bordas-'));
    arquivo = join(pasta, 'projetos.json');
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
    rmSync(pasta, { recursive: true, force: true });
  });

  async function subirCom(projetos: object[]): Promise<INestApplication> {
    writeFileSync(arquivo, JSON.stringify(projetos, null, 2));
    const app = await criarAppComArquivo(arquivo);
    apps.push(app);
    return app;
  }

  it('HEAD /api/projetos responde 200 sem corpo', async () => {
    const app = await subirCom([{ titulo: 'A', descricao: 'd', stacks: ['Go'] }]);

    const resposta = await request(app.getHttpServer()).head('/api/projetos');

    expect(resposta.status).toBe(200);
    expect(resposta.headers['content-type']).toMatch(/application\/json/);
    expect(resposta.text).toBeUndefined();
  });

  it('todos os campos opcionais (demo, imagem, repositório fora do GitHub) chegam intactos', async () => {
    const projeto = {
      titulo: 'Completo',
      descricao: 'Todos os campos do formato.',
      stacks: ['Go', 'Rust'],
      repositorio: 'https://gitlab.com/george/completo',
      demo: 'https://completo.exemplo.dev/',
      imagem: '/imagens/projetos/completo.png',
    };
    const app = await subirCom([projeto]);

    const resposta = await request(app.getHttpServer()).get('/api/projetos');

    expect(resposta.body).toEqual([projeto]);
  });

  it('acentos, emoji, aspas e marcação HTML voltam como texto, iguais aos do arquivo, em JSON UTF-8', async () => {
    // O corpo é JSON (não HTML): o navegador não interpreta a marcação, e o front a mostra como texto.
    const projeto = {
      titulo: 'Integração "ponta a ponta" 🚀',
      descricao: '<img src=x onerror=alert(1)> & <script>alert(2)</script> — ação, coração',
      stacks: ['C#', 'Node.js', 'Ação/Reação'],
    };
    const app = await subirCom([projeto]);

    const resposta = await request(app.getHttpServer()).get('/api/projetos');

    expect(resposta.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(resposta.body).toEqual([projeto]);
  });

  it('com 30 projetos, devolve todos na ordem do arquivo e consulta o GitHub uma vez por repositório', async () => {
    const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
    const projetos = Array.from({ length: 30 }, (_, i) => ({
      titulo: `Projeto ${String(i + 1).padStart(2, '0')}`,
      descricao: `Descrição ${i + 1}`,
      stacks: ['TypeScript'],
      // Um a cada três tem repositório no GitHub.
      ...(i % 3 === 0 ? { repositorio: `https://github.com/George-Abreu-git/projeto-${i + 1}` } : {}),
    }));
    const app = await subirCom(projetos);

    const resposta = await request(app.getHttpServer()).get('/api/projetos');

    expect(resposta.status).toBe(200);
    expect(resposta.body.map((p: Projeto) => p.titulo)).toEqual(projetos.map((p) => p.titulo));
    expect(fetchSimulado).toHaveBeenCalledTimes(10);
  });

  it('a resposta não expõe o caminho do arquivo curado nem detalhes do servidor', async () => {
    const app = await subirCom([{ titulo: 'A', descricao: 'd', stacks: ['Go'] }]);

    const resposta = await request(app.getHttpServer()).get('/api/projetos');

    expect(resposta.text).not.toContain('projetos.json');
    expect(resposta.text).not.toContain(pasta);
    expect(resposta.text).not.toMatch(/node_modules|conteudo\//);
  });

  it('a barra no final do endereço devolve a mesma lista', async () => {
    const app = await subirCom([{ titulo: 'A', descricao: 'd', stacks: ['Go'] }]);

    const semBarra = await request(app.getHttpServer()).get('/api/projetos');
    const comBarra = await request(app.getHttpServer()).get('/api/projetos/');

    expect(comBarra.status).toBe(200);
    expect(comBarra.body).toEqual(semBarra.body);
  });
});

// T-020 (BUG-3 da T-016): o título identifica o projeto no site e é a `key` dos cards no React.
// A API recusa títulos repetidos no arquivo curado (decisão do George): com o arquivo assim,
// ela nem sobe, e o front nunca recebe dois cards com o mesmo título.
describe('arquivo curado com títulos repetidos (T-020)', () => {
  let pasta: string;
  let arquivo: string;

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'api-projetos-titulos-'));
    arquivo = join(pasta, 'projetos.json');
  });

  afterEach(() => {
    rmSync(pasta, { recursive: true, force: true });
  });

  /** Tenta subir a API com o arquivo e devolve a mensagem do erro (falha se a API subir). */
  async function erroAoSubirCom(projetos: unknown[]): Promise<string> {
    writeFileSync(arquivo, JSON.stringify(projetos, null, 2));
    const app = await criarAppComArquivo(arquivo).catch((erro: Error) => erro);
    if (!(app instanceof Error)) {
      await app.close();
      throw new Error('a API subiu com títulos repetidos no arquivo curado');
    }
    return app.message;
  }

  /** Como o visitante vê o título no card: sem espaços nas pontas, espaços juntados, sem diferença de caixa. */
  function tituloNoCard(titulo: string): string {
    return titulo.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
  }

  it.each([
    ['idêntico', 'Portfólio pessoal'],
    ['com espaços nas pontas e a mais no meio', '  Portfólio   pessoal '],
    ['só com outra caixa', 'PORTFÓLIO PESSOAL'],
  ])('título %s ao de outro projeto: a API não sobe, e o erro traz o arquivo e os dois projetos', async (_caso, repetido) => {
    const mensagem = await erroAoSubirCom([
      { titulo: 'Portfólio pessoal', descricao: 'o primeiro', stacks: ['React'] },
      { titulo: 'Outro', descricao: 'no meio', stacks: ['Go'] },
      { titulo: repetido, descricao: 'o repetido', stacks: ['Rust'] },
    ]);

    expect(mensagem).toContain('Arquivo curado de projetos inválido');
    expect(mensagem).toContain(arquivo);
    expect(mensagem).toContain(
      `projeto 3 ("${repetido}"): título repetido — o mesmo do projeto 1 ("Portfólio pessoal"); cada projeto precisa de um título único`,
    );
    // Só o repetido é apontado: o primeiro com o título e o do meio não são erro.
    expect(mensagem).not.toMatch(/^projeto [12]\b/m);
  });

  it('títulos parecidos, mas diferentes, sobem normalmente: GET /api/projetos responde 200 com todos, na ordem', async () => {
    const projetos = [
      { titulo: 'Site de apresentação', descricao: 'd', stacks: ['React'] },
      { titulo: 'Site de apresentação 2', descricao: 'd', stacks: ['React'] },
      { titulo: 'Site de apresentacao', descricao: 'sem acento é outro texto', stacks: ['React'] },
      { titulo: 'Site-de-apresentação', descricao: 'hífen não é espaço', stacks: ['React'] },
      { titulo: 'Apresentação', descricao: 'd', stacks: ['React'] },
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

  it('repetição junto com outros erros: tudo numa única mensagem, uma linha por problema', async () => {
    const mensagem = await erroAoSubirCom([
      { titulo: 'Agenda', descricao: 'd', stacks: ['Go'] },
      { titulo: 'Agenda', descricao: '', stacks: ['Go'] },
      { titulo: '', descricao: 'sem título não entra na comparação', stacks: ['Go'] },
      { titulo: 'Loja', descricao: 'd', stacks: ['Go'], demo: 'ftp://loja' },
    ]);

    const problemas = mensagem.split('\n').slice(1);
    expect(problemas).toHaveLength(4);
    expect(problemas).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^projeto 2 \("Agenda"\): campo "descricao"/),
        expect.stringMatching(/^projeto 3: campo "titulo"/),
        expect.stringMatching(/^projeto 4 \("Loja"\): campo "demo"/),
        'projeto 2 ("Agenda"): título repetido — o mesmo do projeto 1 ("Agenda"); cada projeto precisa de um título único',
      ]),
    );
  });

  it('o projetos.json do repositório sobe a API, e GET /api/projetos não traz títulos repetidos', async () => {
    const app = await criarAppComArquivo(CAMINHO_DO_ARQUIVO_CURADO);

    try {
      const resposta = await request(app.getHttpServer()).get('/api/projetos');

      expect(resposta.status).toBe(200);
      const titulos = (resposta.body as Projeto[]).map((p) => tituloNoCard(p.titulo));
      expect(titulos.length).toBeGreaterThanOrEqual(2);
      expect(new Set(titulos).size, `títulos repetidos em ${CAMINHO_DO_ARQUIVO_CURADO}`).toBe(titulos.length);
    } finally {
      await app.close();
    }
  });

  it('três projetos com o mesmo título: as duas repetições apontam para o primeiro, que não é apontado', async () => {
    const mensagem = await erroAoSubirCom([
      { titulo: 'Blog', descricao: 'outro', stacks: ['Go'] },
      { titulo: 'Jogo da velha', descricao: 'o primeiro', stacks: ['TypeScript'] },
      { titulo: 'Jogo da velha', descricao: 'o segundo', stacks: ['TypeScript'] },
      { titulo: 'jogo da velha', descricao: 'o terceiro', stacks: ['TypeScript'] },
    ]);

    expect(mensagem.split('\n').slice(1)).toEqual([
      'projeto 3 ("Jogo da velha"): título repetido — o mesmo do projeto 2 ("Jogo da velha"); cada projeto precisa de um título único',
      'projeto 4 ("jogo da velha"): título repetido — o mesmo do projeto 2 ("Jogo da velha"); cada projeto precisa de um título único',
    ]);
  });
});

// T-021 (BUG-4 da T-016): editores do Windows costumam salvar em "UTF-8 com BOM", gravando os
// bytes EF BB BF (o caractere U+FEFF) antes do conteúdo. A API passa a aceitar esse arquivo e
// sobe normalmente; o resto do conteúdo continua sendo validado como antes.
describe('arquivo curado salvo em UTF-8 com BOM (T-021)', () => {
  /** Os bytes do BOM no UTF-8, como um editor os grava no disco. */
  const BOM = Buffer.from([0xef, 0xbb, 0xbf]);
  let pasta: string;
  let arquivo: string;
  const apps: INestApplication[] = [];

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'api-projetos-bom-'));
    arquivo = join(pasta, 'projetos.json');
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
    rmSync(pasta, { recursive: true, force: true });
  });

  /** Grava o texto em UTF-8 com o BOM na frente (bytes crus, como no disco). */
  function gravarComBom(caminho: string, texto: string, quantosBoms = 1): void {
    writeFileSync(caminho, Buffer.concat([...Array<Buffer>(quantosBoms).fill(BOM), Buffer.from(texto, 'utf8')]));
  }

  async function subir(caminho: string): Promise<INestApplication> {
    const app = await criarAppComArquivo(caminho);
    apps.push(app);
    return app;
  }

  it('com BOM, a API sobe e GET /api/projetos responde 200 com o mesmo corpo do arquivo sem BOM', async () => {
    const projetos = [
      { titulo: 'Primeiro', descricao: 'sem repositório', stacks: ['React'] },
      { titulo: 'Segundo', descricao: 'no GitHub', stacks: ['NestJS'], repositorio: 'https://github.com/George-Abreu-git/segundo' },
    ];
    const texto = JSON.stringify(projetos, null, 2);
    const semBom = join(pasta, 'sem-bom.json');
    writeFileSync(semBom, texto, 'utf8');
    gravarComBom(arquivo, texto);
    expect(readFileSync(arquivo).subarray(0, 3)).toEqual(BOM);

    const respostaSemBom = await request((await subir(semBom)).getHttpServer()).get('/api/projetos');
    const respostaComBom = await request((await subir(arquivo)).getHttpServer()).get('/api/projetos');

    expect(respostaComBom.status).toBe(200);
    expect(respostaComBom.headers['content-type']).toMatch(/application\/json/);
    expect(respostaComBom.body).toEqual(respostaSemBom.body);
    expect(respostaComBom.body).toEqual([projetos[0], { ...projetos[1], github: DADOS_VIVOS_SIMULADOS }]);
  });

  it('acentos, aspas tipográficas e emoji chegam intactos depois do BOM, sem U+FEFF no corpo', async () => {
    const projeto = {
      titulo: 'Aplicação de seleção ✨',
      descricao: 'Ação, coração e “aspas tipográficas” — com ‘simples’ também',
      stacks: ['C#', 'Ação/Reação'],
    };
    gravarComBom(arquivo, JSON.stringify([projeto]));
    const app = await subir(arquivo);

    const resposta = await request(app.getHttpServer()).get('/api/projetos');

    expect(resposta.status).toBe(200);
    expect(resposta.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(resposta.body).toEqual([projeto]);
    expect(resposta.text.startsWith('[')).toBe(true);
    expect(resposta.text).not.toContain('﻿');
  });

  it('o projetos.json do repositório, regravado com BOM, sobe e responde igual ao original', async () => {
    gravarComBom(arquivo, readFileSync(CAMINHO_DO_ARQUIVO_CURADO, 'utf8'));

    const original = await request((await subir(CAMINHO_DO_ARQUIVO_CURADO)).getHttpServer()).get('/api/projetos');
    const comBom = await request((await subir(arquivo)).getHttpServer()).get('/api/projetos');

    expect(original.status).toBe(200);
    expect(comBom.status).toBe(200);
    expect(comBom.body).toEqual(original.body);
    expect(comBom.body.length).toBeGreaterThanOrEqual(2);
  });

  it.each([
    ['só com o BOM', '', 1],
    ['com o BOM e só espaços', '  \n\t ', 1],
    ['com o BOM seguido de JSON inválido', '[{ "titulo": "sem fechar" ', 1],
    ['com dois BOMs seguidos (só um é removido)', '[]', 2],
  ])('arquivo %s: a API não sobe, e o erro diz que não é JSON e traz o caminho', async (_caso, texto, quantosBoms) => {
    gravarComBom(arquivo, texto, quantosBoms);

    const erro = await criarAppComArquivo(arquivo).then(
      async (app) => {
        await app.close();
        throw new Error('a API subiu com um arquivo curado inválido');
      },
      (e: Error) => e,
    );

    expect(erro.message).toContain('Arquivo curado de projetos inválido');
    expect(erro.message).toContain(arquivo);
    expect(erro.message).toMatch(/não é um JSON válido/);
  });

  it('com BOM e título repetido, a API continua sem subir: o erro é o da validação (T-020), não o de JSON', async () => {
    gravarComBom(
      arquivo,
      JSON.stringify([
        { titulo: 'Portfólio pessoal', descricao: 'o primeiro', stacks: ['React'] },
        { titulo: 'PORTFÓLIO PESSOAL', descricao: 'o repetido', stacks: ['Go'] },
      ]),
    );

    const erro = await criarAppComArquivo(arquivo).then(
      async (app) => {
        await app.close();
        throw new Error('a API subiu com títulos repetidos no arquivo curado');
      },
      (e: Error) => e,
    );

    expect(erro.message).toContain(arquivo);
    expect(erro.message).not.toMatch(/não é um JSON válido/);
    expect(erro.message).toContain(
      'projeto 2 ("PORTFÓLIO PESSOAL"): título repetido — o mesmo do projeto 1 ("Portfólio pessoal"); cada projeto precisa de um título único',
    );
  });
});
