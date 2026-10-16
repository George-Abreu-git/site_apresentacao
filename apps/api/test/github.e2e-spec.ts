// Teste de rota (aceitação da API) do módulo github — T-011, RF-06 (parte 2) e RNF-05.
//
// Sobe a API inteira (AppModule, prefixo /api, GithubCliente e GithubService de verdade)
// e faz requisições HTTP com o Supertest. Só duas coisas são trocadas:
// - a lista de projetos curados (provider PROJETOS_CURADOS), para cada cenário ter os seus;
// - o `fetch` global, que faz o papel do GitHub (nenhum teste vai à internet).
import type { INestApplication, LoggerService } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Projeto } from '@site-apresentacao/shared';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { PREFIXO_DAS_ROTAS } from '../src/criar-app.js';
import { PROJETOS_CURADOS } from '../src/projetos/projetos-curados.token.js';
import { validarProjetosCurados } from '../src/projetos/validar-projetos-curados.js';
import {
  cabecalhosDaChamada,
  LogEmMemoria,
  repositorioNoGithub,
  respostaJson,
  semGithub,
  simularGithub,
} from './apoio/github-simulado.js';

const SITE = {
  titulo: 'Site de apresentação',
  descricao: 'Portfólio com React e NestJS.',
  stacks: ['React', 'NestJS'],
  repositorio: 'https://github.com/George-Abreu-git/site_apresentacao',
};
const SEM_REPOSITORIO = { titulo: 'Sem código público', descricao: 'Só curado.', stacks: ['Node.js'] };
const NO_GITLAB = {
  titulo: 'No GitLab',
  descricao: 'Repositório fora do GitHub.',
  stacks: ['Go'],
  repositorio: 'https://gitlab.com/george/projeto',
};
const OUTRO_NO_GITHUB = {
  titulo: 'Outro projeto',
  descricao: 'Segundo repositório no GitHub.',
  stacks: ['Python'],
  repositorio: 'https://github.com/George-Abreu-git/outro-projeto',
};

const DADOS_DO_SITE = {
  disponivel: true,
  linguagem: 'TypeScript',
  estrelas: 7,
  ultimaAtualizacao: '2026-10-01T12:00:00Z',
};

const TOKEN = 'ghp_tokenSecretoDeTeste0123456789';

const apps: INestApplication[] = [];

/**
 * Monta a API completa com os projetos indicados. As variáveis de ambiente do GitHub
 * devem estar definidas antes (são lidas aqui, ao montar, como na inicialização real).
 */
async function criarApi(
  projetos: object[],
  logger: LoggerService | false = false,
): Promise<INestApplication> {
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PROJETOS_CURADOS)
    .useFactory({ factory: () => validarProjetosCurados(projetos) })
    .compile();
  const app = modulo.createNestApplication({ logger });
  app.setGlobalPrefix(PREFIXO_DAS_ROTAS);
  await app.init();
  apps.push(app);
  return app;
}

function pedirProjetos(app: INestApplication) {
  return request(app.getHttpServer()).get('/api/projetos');
}

beforeEach(() => {
  // Ambiente previsível: nenhum token ou validade vindos da máquina de quem roda os testes.
  vi.stubEnv('GITHUB_TOKEN', '');
  vi.stubEnv('GITHUB_CACHE_TTL_SEGUNDOS', '');
});

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('GET /api/projetos com o GitHub respondendo (RF-06, parte 2)', () => {
  it('projeto com repositório no GitHub recebe linguagem, estrelas e última atualização', async () => {
    const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
    const app = await criarApi([SITE]);

    const resposta = await pedirProjetos(app);

    expect(resposta.status).toBe(200);
    expect(resposta.headers['content-type']).toMatch(/application\/json/);
    expect(resposta.body).toEqual([{ ...SITE, github: DADOS_DO_SITE }]);
    expect(fetchSimulado).toHaveBeenCalledTimes(1);
    expect(fetchSimulado.mock.calls[0]?.[0]).toBe(
      'https://api.github.com/repos/George-Abreu-git/site_apresentacao',
    );
  });

  it('cada repositório recebe os próprios dados; projetos sem repositório ou fora do GitHub ficam só com os curados, na ordem do arquivo', async () => {
    const fetchSimulado = simularGithub((endereco) =>
      endereco.endsWith('/outro-projeto')
        ? respostaJson(repositorioNoGithub({ language: 'Python', stargazers_count: 0, pushed_at: '2025-01-02T03:04:05Z' }))
        : respostaJson(repositorioNoGithub()),
    );
    const app = await criarApi([SEM_REPOSITORIO, OUTRO_NO_GITHUB, NO_GITLAB, SITE]);

    const resposta = await pedirProjetos(app);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([
      SEM_REPOSITORIO,
      {
        ...OUTRO_NO_GITHUB,
        github: { disponivel: true, linguagem: 'Python', estrelas: 0, ultimaAtualizacao: '2025-01-02T03:04:05Z' },
      },
      NO_GITLAB,
      { ...SITE, github: DADOS_DO_SITE },
    ]);
    // O GitLab nunca é consultado: só os 2 repositórios do GitHub.
    expect(fetchSimulado).toHaveBeenCalledTimes(2);
    expect(resposta.body[0]).not.toHaveProperty('github');
    expect(resposta.body[2]).not.toHaveProperty('github');
  });

  it('repositório sem linguagem identificada responde "linguagem": null', async () => {
    simularGithub(() => respostaJson(repositorioNoGithub({ language: null })));
    const app = await criarApi([SITE]);

    const resposta = await pedirProjetos(app);

    expect(resposta.body[0].github).toEqual({ ...DADOS_DO_SITE, linguagem: null });
  });

  it('a resposta do GitHub não vaza campos além dos documentados', async () => {
    simularGithub(() =>
      respostaJson(repositorioNoGithub({ owner: { login: 'George-Abreu-git' }, private: false, forks_count: 3 })),
    );
    const app = await criarApi([SITE]);

    const resposta = await pedirProjetos(app);

    expect(Object.keys(resposta.body[0].github).sort()).toEqual([
      'disponivel',
      'estrelas',
      'linguagem',
      'ultimaAtualizacao',
    ]);
  });
});

describe('GET /api/projetos com o GitHub indisponível (plano B, sem erro)', () => {
  it.each([
    ['limite de requisições atingido (403)', () => respostaJson({ message: 'API rate limit exceeded' }, 403, { 'x-ratelimit-remaining': '0' })],
    ['limite de requisições atingido (429)', () => respostaJson({ message: 'Too Many Requests' }, 429)],
    ['GitHub fora do ar (503)', () => respostaJson({ message: 'Service Unavailable' }, 503)],
    ['erro interno do GitHub (500)', () => respostaJson({}, 500)],
    ['repositório inexistente (404)', () => respostaJson({ message: 'Not Found' }, 404)],
    ['token recusado (401)', () => respostaJson({ message: 'Bad credentials' }, 401)],
    ['falha de rede', () => Promise.reject(new TypeError('fetch failed'))],
    ['tempo limite estourado', () => Promise.reject(new DOMException('The operation was aborted due to timeout', 'TimeoutError'))],
    ['resposta que não é JSON', () => new Response('<html>erro</html>', { status: 200 })],
    ['JSON em formato inesperado', () => respostaJson({ language: 'TypeScript' })],
  ])('%s: responde 200 com os dados curados e "github": { "disponivel": false }', async (_caso, responder) => {
    simularGithub(responder);
    const app = await criarApi([SEM_REPOSITORIO, SITE]);

    const resposta = await pedirProjetos(app);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([SEM_REPOSITORIO, { ...SITE, github: { disponivel: false } }]);
  });

  it('a falha de um repositório não afeta os outros', async () => {
    simularGithub((endereco) =>
      endereco.endsWith('/outro-projeto')
        ? respostaJson({ message: 'Not Found' }, 404)
        : respostaJson(repositorioNoGithub()),
    );
    const app = await criarApi([OUTRO_NO_GITHUB, SITE]);

    const resposta = await pedirProjetos(app);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([
      { ...OUTRO_NO_GITHUB, github: { disponivel: false } },
      { ...SITE, github: DADOS_DO_SITE },
    ]);
  });

  it('a falha registra um aviso no log, com o repositório e o motivo', async () => {
    simularGithub(() => respostaJson({ message: 'API rate limit exceeded' }, 403));
    const log = new LogEmMemoria();
    const app = await criarApi([SITE], log);

    await pedirProjetos(app);

    const avisos = log.linhas.filter((linha) => linha.startsWith('[warn]'));
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toContain('George-Abreu-git/site_apresentacao');
    expect(avisos[0]).toContain('403');
  });

  it('a falha não fica no cache: quando o GitHub volta, a requisição seguinte já traz os dados', async () => {
    const fetchSimulado = simularGithub(() => respostaJson({}, 503));
    const app = await criarApi([SITE]);

    const primeira = await pedirProjetos(app);
    fetchSimulado.mockImplementation(async () => respostaJson(repositorioNoGithub()));
    const segunda = await pedirProjetos(app);

    expect(primeira.body[0].github).toEqual({ disponivel: false });
    expect(segunda.body[0].github).toEqual(DADOS_DO_SITE);
    expect(fetchSimulado).toHaveBeenCalledTimes(2);
  });
});

describe('cache dos dados do GitHub por tempo configurável (GITHUB_CACHE_TTL_SEGUNDOS)', () => {
  const INICIO = new Date('2026-10-15T12:00:00Z');

  beforeEach(() => {
    // Só o relógio (Date) é simulado; os timers de verdade seguem funcionando para o Nest e o Supertest.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(INICIO);
  });

  function avancarSegundos(segundos: number): void {
    vi.setSystemTime(INICIO.getTime() + segundos * 1000);
  }

  it('com o padrão (sem a variável), consulta o GitHub uma vez por hora', async () => {
    const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
    const app = await criarApi([SITE]);

    await pedirProjetos(app);
    await pedirProjetos(app);
    avancarSegundos(3599);
    const aindaNoCache = await pedirProjetos(app);
    expect(fetchSimulado).toHaveBeenCalledTimes(1);
    expect(aindaNoCache.body[0].github).toEqual(DADOS_DO_SITE);

    avancarSegundos(3600);
    await pedirProjetos(app);
    expect(fetchSimulado).toHaveBeenCalledTimes(2);
  });

  it('com GITHUB_CACHE_TTL_SEGUNDOS=60, o dado vale por 60 segundos', async () => {
    vi.stubEnv('GITHUB_CACHE_TTL_SEGUNDOS', '60');
    const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
    const app = await criarApi([SITE]);

    await pedirProjetos(app);
    avancarSegundos(59);
    await pedirProjetos(app);
    expect(fetchSimulado).toHaveBeenCalledTimes(1);

    avancarSegundos(60);
    await pedirProjetos(app);
    expect(fetchSimulado).toHaveBeenCalledTimes(2);
  });

  it('enquanto o cache vale, a resposta sai do cache mesmo com o GitHub fora do ar', async () => {
    vi.stubEnv('GITHUB_CACHE_TTL_SEGUNDOS', '60');
    const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
    const app = await criarApi([SITE]);

    await pedirProjetos(app);
    fetchSimulado.mockImplementation(async () => respostaJson({}, 503));
    avancarSegundos(30);
    const doCache = await pedirProjetos(app);
    avancarSegundos(61);
    const vencido = await pedirProjetos(app);

    expect(doCache.body[0].github).toEqual(DADOS_DO_SITE);
    expect(vencido.status).toBe(200);
    expect(vencido.body[0].github).toEqual({ disponivel: false });
  });

  it('dados novos do GitHub aparecem depois que o cache vence', async () => {
    vi.stubEnv('GITHUB_CACHE_TTL_SEGUNDOS', '60');
    const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
    const app = await criarApi([SITE]);

    await pedirProjetos(app);
    fetchSimulado.mockImplementation(async () => respostaJson(repositorioNoGithub({ stargazers_count: 8 })));
    avancarSegundos(60);
    const resposta = await pedirProjetos(app);

    expect(resposta.body[0].github.estrelas).toBe(8);
  });

  it.each(['0', '-5', '1.5', '10s', 'abc'])(
    'GITHUB_CACHE_TTL_SEGUNDOS=%s: a API não sobe, com erro claro',
    async (valor) => {
      vi.stubEnv('GITHUB_CACHE_TTL_SEGUNDOS', valor);
      const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));

      await expect(criarApi([SITE])).rejects.toThrow(
        /GITHUB_CACHE_TTL_SEGUNDOS deve ser um número inteiro de segundos maior que zero/,
      );
      expect(fetchSimulado).not.toHaveBeenCalled();
    },
  );
});

describe('token do GitHub (RNF-05): só do ambiente, nunca no log nem na resposta', () => {
  it('com GITHUB_TOKEN, o token vai só no cabeçalho Authorization da chamada ao GitHub', async () => {
    vi.stubEnv('GITHUB_TOKEN', TOKEN);
    const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
    const log = new LogEmMemoria();
    const app = await criarApi([SITE], log);

    const resposta = await pedirProjetos(app);

    expect(cabecalhosDaChamada(fetchSimulado).Authorization).toBe(`Bearer ${TOKEN}`);
    expect(fetchSimulado.mock.calls[0]?.[0]).not.toContain(TOKEN);
    expect(resposta.text).not.toContain(TOKEN);
    expect(JSON.stringify(resposta.headers)).not.toContain(TOKEN);
    expect(log.texto).not.toContain(TOKEN);
  });

  it('sem GITHUB_TOKEN, a chamada vai sem Authorization e a rota funciona', async () => {
    const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
    const app = await criarApi([SITE]);

    const resposta = await pedirProjetos(app);

    expect(cabecalhosDaChamada(fetchSimulado)).not.toHaveProperty('Authorization');
    expect(resposta.body[0].github).toEqual(DADOS_DO_SITE);
  });

  it.each([
    ['token recusado (401)', () => respostaJson({ message: 'Bad credentials' }, 401)],
    ['limite atingido (403)', () => respostaJson({ message: 'API rate limit exceeded' }, 403)],
    ['falha de rede', () => Promise.reject(new TypeError('fetch failed'))],
    ['resposta em formato inesperado', () => respostaJson({ nada: true })],
  ])('%s: o token não aparece no log nem na resposta', async (_caso, responder) => {
    vi.stubEnv('GITHUB_TOKEN', TOKEN);
    simularGithub(responder);
    const log = new LogEmMemoria();
    const app = await criarApi([SITE], log);

    const resposta = await pedirProjetos(app);

    expect(resposta.status).toBe(200);
    expect(log.linhas.some((linha) => linha.startsWith('[warn]'))).toBe(true);
    expect(log.texto).not.toContain(TOKEN);
    expect(resposta.text).not.toContain(TOKEN);
  });

  it('nenhuma rota devolve a configuração do GitHub (token)', async () => {
    vi.stubEnv('GITHUB_TOKEN', TOKEN);
    simularGithub(() => respostaJson(repositorioNoGithub()));
    const app = await criarApi([SITE]);

    for (const rota of ['/api/health', '/api/github', '/api/configuracao', '/api/projetos']) {
      const resposta = await request(app.getHttpServer()).get(rota);
      expect(resposta.text).not.toContain(TOKEN);
    }
    // O módulo github não expõe rotas próprias.
    expect((await request(app.getHttpServer()).get('/api/github')).status).toBe(404);
  });
});

describe('formato da resposta (contrato com o front, T-012)', () => {
  it('cada projeto segue o tipo Projeto: campos curados + "github" opcional', async () => {
    simularGithub((endereco) =>
      endereco.endsWith('/outro-projeto') ? respostaJson({}, 503) : respostaJson(repositorioNoGithub()),
    );
    const app = await criarApi([SITE, SEM_REPOSITORIO, OUTRO_NO_GITHUB, NO_GITLAB]);

    const resposta = await pedirProjetos(app);
    const projetos = resposta.body as Projeto[];

    expect(Array.isArray(projetos)).toBe(true);
    const curados = projetos.map(semGithub);
    expect(validarProjetosCurados(curados)).toEqual([SITE, SEM_REPOSITORIO, OUTRO_NO_GITHUB, NO_GITLAB]);
    expect(projetos.map((p) => p.github)).toEqual([DADOS_DO_SITE, undefined, { disponivel: false }, undefined]);
  });
});

describe('pente-fino da T-016: tempo limite, endereços do repositório e segurança', () => {
  it('GitHub que não responde: depois do tempo limite (5 s) a rota responde 200 com "disponivel": false', { timeout: 15_000 }, async () => {
    // O GitHub simulado só "responde" quando a API desiste: o fetch é cancelado pelo sinal de tempo limite.
    simularGithub(
      (_endereco, opcoes) =>
        new Promise<Response>((_resolver, rejeitar) => {
          opcoes?.signal?.addEventListener('abort', () => rejeitar(opcoes.signal?.reason));
        }),
    );
    const log = new LogEmMemoria();
    const app = await criarApi([SEM_REPOSITORIO, SITE], log);

    const inicio = Date.now();
    const resposta = await pedirProjetos(app);
    const duracao = Date.now() - inicio;

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([SEM_REPOSITORIO, { ...SITE, github: { disponivel: false } }]);
    expect(duracao).toBeGreaterThanOrEqual(4_500);
    expect(duracao).toBeLessThan(10_000);
    expect(log.linhas.some((linha) => linha.startsWith('[warn]'))).toBe(true);
  });

  it('o cache não diferencia maiúsculas: o mesmo repositório escrito de outro jeito sai do cache', async () => {
    const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
    const MAIUSCULAS = { ...SITE, titulo: 'Mesmo repositório', repositorio: 'https://github.com/George-Abreu-git/SITE_APRESENTACAO' };
    const app = await criarApi([SITE, MAIUSCULAS]);

    const primeira = await pedirProjetos(app);
    const consultasNaPrimeira = fetchSimulado.mock.calls.length;
    const segunda = await pedirProjetos(app);

    // Na primeira requisição as duas consultas saem ao mesmo tempo, com o cache ainda vazio
    // (ponto já levado ao George pelo dev, pendência 2b da T-016); a partir da segunda, nenhuma.
    expect(consultasNaPrimeira).toBeGreaterThanOrEqual(1);
    expect(fetchSimulado).toHaveBeenCalledTimes(consultasNaPrimeira);
    for (const resposta of [primeira, segunda]) {
      expect(resposta.body.map((p: Projeto) => p.github)).toEqual([DADOS_DO_SITE, DADOS_DO_SITE]);
    }
  });

  it.each([
    ['com .git no final', 'https://github.com/George-Abreu-git/site_apresentacao.git'],
    ['apontando para uma pasta', 'https://github.com/George-Abreu-git/site_apresentacao/tree/main/apps'],
    ['com www', 'https://www.github.com/George-Abreu-git/site_apresentacao'],
    ['com barra, query e âncora', 'https://github.com/George-Abreu-git/site_apresentacao/?tab=readme#topo'],
  ])('repositório %s: consulta /repos/George-Abreu-git/site_apresentacao', async (_caso, endereco) => {
    const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
    const app = await criarApi([{ ...SITE, repositorio: endereco }]);

    const resposta = await pedirProjetos(app);

    expect(fetchSimulado.mock.calls[0]?.[0]).toBe('https://api.github.com/repos/George-Abreu-git/site_apresentacao');
    // O endereço curado volta como está no arquivo; só o "github" é acrescentado.
    expect(resposta.body).toEqual([{ ...SITE, repositorio: endereco, github: DADOS_DO_SITE }]);
  });

  it.each([
    ['domínio que imita o GitHub', 'https://github.com.exemplo.com/George-Abreu-git/site_apresentacao'],
    ['GitHub só no caminho', 'https://exemplo.com/github.com/George-Abreu-git/site_apresentacao'],
    ['subdomínio do GitHub (gist)', 'https://gist.github.com/George-Abreu-git/abc123'],
    ['perfil, sem repositório', 'https://github.com/George-Abreu-git'],
  ])('%s: não consulta o GitHub e o projeto fica só com os dados curados', async (_caso, endereco) => {
    const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
    const app = await criarApi([{ ...SITE, repositorio: endereco }]);

    const resposta = await pedirProjetos(app);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([{ ...SITE, repositorio: endereco }]);
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it('caracteres especiais no endereço não tiram a consulta de /repos/<dono>/<nome> em api.github.com', async () => {
    const fetchSimulado = simularGithub(() => respostaJson({ message: 'Not Found' }, 404));
    const enderecos = [
      'https://github.com/George-Abreu-git/..%2F..%2Fusers%2Foutro',
      'https://github.com/George-Abreu-git/a%3Fx=1%23y',
      'https://github.com/%2e%2e/%2e%2e/orgs/outra',
    ];
    const app = await criarApi(enderecos.map((repositorio, i) => ({ ...SITE, titulo: `P${i}`, repositorio })));

    const resposta = await pedirProjetos(app);

    expect(resposta.status).toBe(200);
    for (const [endereco] of fetchSimulado.mock.calls) {
      const url = new URL(String(endereco));
      expect(url.origin).toBe('https://api.github.com');
      expect(url.search).toBe('');
      // Sempre exatamente /repos/<dono>/<nome>: nenhum "..", "/" ou "?" escapou da codificação.
      const partes = url.pathname.split('/').filter(Boolean);
      expect(partes, url.pathname).toHaveLength(3);
      expect(partes[0]).toBe('repos');
      expect(partes).not.toContain('..');
    }
  });

  it('as chamadas ao GitHub levam os cabeçalhos recomendados (Accept, versão da API e User-Agent)', async () => {
    const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
    const app = await criarApi([SITE]);

    await pedirProjetos(app);

    const cabecalhos = cabecalhosDaChamada(fetchSimulado);
    expect(cabecalhos.Accept).toBe('application/vnd.github+json');
    expect(cabecalhos['X-GitHub-Api-Version']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(cabecalhos['User-Agent']).toBeTruthy();
  });

  it('o token só vai para api.github.com, sem espaços em volta, mesmo com vários repositórios', async () => {
    vi.stubEnv('GITHUB_TOKEN', `  ${TOKEN}  `);
    const fetchSimulado = simularGithub(() => respostaJson(repositorioNoGithub()));
    const app = await criarApi([SITE, NO_GITLAB, OUTRO_NO_GITHUB]);

    await pedirProjetos(app);

    expect(fetchSimulado).toHaveBeenCalledTimes(2);
    for (const [indice, [endereco]] of fetchSimulado.mock.calls.entries()) {
      expect(new URL(String(endereco)).origin).toBe('https://api.github.com');
      expect(cabecalhosDaChamada(fetchSimulado, indice).Authorization).toBe(`Bearer ${TOKEN}`);
    }
  });
});
