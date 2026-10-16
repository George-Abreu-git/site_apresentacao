// Simulação da API nos testes e2e. A página inteira chama GET /api/projetos assim que abre
// (seção Projetos, T-012). Sem simulação, o navegador tentaria a API de verdade
// (http://localhost:3000), que não sobe com os testes: a conexão é recusada e o navegador
// registra "Failed to load resource: net::ERR_CONNECTION_REFUSED" no console, em momentos
// diferentes a cada execução. Com `page.route`, o Playwright intercepta a requisição dentro do
// navegador e responde o que o teste quiser, sempre igual e sem depender de rede.
import type { Page, Route } from '@playwright/test';
import type { Projeto } from '../../packages/shared/src/projeto';

/** Qualquer endereço terminado em /api/projetos: vale para a API local e para a publicada. */
export const ROTA_DA_API = '**/api/projetos';

/** Uma lista que cobre os casos do card: completo, sem linguagem, GitHub fora do ar e sem repositório. */
export const PROJETOS_DE_EXEMPLO: Projeto[] = [
  {
    titulo: 'Site de apresentação',
    descricao: 'Portfólio com front em React e API própria em NestJS.',
    stacks: ['React', 'TypeScript', 'NestJS'],
    repositorio: 'https://github.com/George-Abreu-git/site_apresentacao',
    demo: 'https://site-do-george.exemplo.dev/',
    github: { disponivel: true, linguagem: 'TypeScript', estrelas: 1234, ultimaAtualizacao: '2026-10-01T12:00:00Z' },
  },
  {
    titulo: 'Repositório ainda vazio',
    descricao: 'O GitHub não identifica a linguagem de um repositório sem código.',
    stacks: ['Markdown'],
    repositorio: 'https://github.com/George-Abreu-git/vazio',
    github: { disponivel: true, linguagem: null, estrelas: 0, ultimaAtualizacao: '2026-09-15T08:30:00Z' },
  },
  {
    titulo: 'GitHub fora do ar',
    descricao: 'Quando o GitHub não responde, o card mostra só os dados curados.',
    stacks: ['Node.js'],
    repositorio: 'https://github.com/George-Abreu-git/outro',
    github: { disponivel: false },
  },
  {
    titulo: 'Projeto sem repositório',
    descricao: 'Sem código público: nem links nem dados do GitHub.',
    stacks: ['Node.js', 'TypeScript'],
  },
];

/**
 * Responde como a API: JSON com o status pedido (texto puro, se `corpo` já for string).
 * A resposta simulada não passa pela checagem de CORS do navegador: o CORS da API real
 * (RNF-05) não é testado aqui.
 */
export function responder(rota: Route, corpo: unknown, status = 200) {
  return rota.fulfill({
    status,
    contentType: 'application/json',
    body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
  });
}

/**
 * Simula a API respondendo na hora com o corpo recebido. Se for chamada mais de uma vez no
 * mesmo teste, vale a última: o Playwright tenta as rotas da mais nova para a mais antiga.
 */
export async function simularApi(page: Page, corpo: unknown, status = 200) {
  await page.route(ROTA_DA_API, (rota) => responder(rota, corpo, status));
}

/**
 * Simula a API que ainda não respondeu (como na partida a frio, RNF-03): a requisição fica
 * pendente até o fim do teste, e a seção Projetos fica no aviso de carregamento, sem mudar
 * de tamanho. O Playwright segura a requisição enquanto ninguém chama fulfill, abort ou continue.
 */
export async function simularApiSemResposta(page: Page) {
  await page.route(ROTA_DA_API, () => {
    // De propósito, nenhuma resposta.
  });
}
