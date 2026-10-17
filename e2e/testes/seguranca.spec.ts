// Testes de aceitação de segurança e privacidade no navegador (RNF-05, RNF-06; pente-fino da
// T-016): nada de token no JavaScript entregue ao navegador, nenhum cookie nem rastreador, links
// externos que não dão à outra página acesso a esta, e dados da API mostrados como texto.
// O CORS da API publicada (RNF-05) fica para a T-013: aqui a API é simulada com `page.route`.
// Cada teste roda nos dois projetos do playwright.config.ts (celular e desktop).
import type { Page } from '@playwright/test';
import { ptBR } from '../../apps/web/src/conteudo/pt-BR';
import type { Projeto } from '../../packages/shared/src/projeto';
import { PROJETOS_DE_EXEMPLO, simularApi } from '../apoio/api';
import { expect, test } from '../apoio/teste';

/** Formatos de token do GitHub (clássico ghp_/gho_/ghu_/ghs_/ghr_ e o de permissões finas github_pat_). */
const FORMATO_DE_TOKEN_DO_GITHUB = /\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/;

async function abrirComCards(page: Page, projetos: Projeto[] = PROJETOS_DE_EXEMPLO) {
  await simularApi(page, projetos);
  await page.goto('/');
  await expect(page.getByRole('article')).toHaveCount(projetos.length);
}

test.describe('Segurança e privacidade no navegador (RNF-05, RNF-06)', () => {
  test('o site não grava cookies nem nada no armazenamento do navegador, mesmo navegando', async ({ page, isMobile }) => {
    await abrirComCards(page);
    if (isMobile) await page.getByRole('button', { name: ptBR.navegacao.botaoMenu }).click();
    await page.getByRole('navigation').getByRole('link', { name: ptBR.secoes.contato, exact: true }).click();
    await expect(page).toHaveURL(/#contato$/);

    expect(await page.context().cookies()).toEqual([]);
    const armazenamento = await page.evaluate(() => ({ local: localStorage.length, sessao: sessionStorage.length, cookie: document.cookie }));
    expect(armazenamento).toEqual({ local: 0, sessao: 0, cookie: '' });
  });

  test('ao abrir, a página só fala com o próprio site e a API: nenhum analytics nem recurso de terceiros', async ({ page }) => {
    const enderecos: string[] = [];
    page.on('request', (requisicao) => enderecos.push(requisicao.url()));
    await abrirComCards(page);

    const deFora = enderecos.filter((endereco) => new URL(endereco).hostname !== 'localhost');
    expect(deFora, 'requisições a outros sites').toEqual([]);
  });

  test('todo link que abre nova aba usa rel="noopener noreferrer"', async ({ page }) => {
    await abrirComCards(page);
    const links = await page.locator('a[target="_blank"]').evaluateAll((todos) =>
      todos.map((link) => ({ href: link.getAttribute('href'), rel: (link.getAttribute('rel') ?? '').split(/\s+/) })),
    );
    // Sobre (2) + Contato (2) + repositórios e demo dos cards de exemplo.
    expect(links.length).toBeGreaterThanOrEqual(7);
    for (const { href, rel } of links) {
      expect(rel, String(href)).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
    }
  });

  test('o JavaScript entregue ao navegador não traz token do GitHub nem a variável GITHUB_TOKEN', async ({ page }) => {
    await page.goto('/');
    // Os arquivos de código do site (não as bibliotecas) que a página carregou, mais o próprio HTML.
    const enderecos = await page.evaluate(() =>
      [location.href, ...performance.getEntriesByType('resource').map((recurso) => recurso.name)].filter(
        (endereco) => new URL(endereco).origin === location.origin && !endereco.includes('/node_modules/'),
      ),
    );
    expect(enderecos.length).toBeGreaterThan(5);
    for (const endereco of enderecos) {
      const codigo = await (await page.request.get(endereco)).text();
      expect(codigo, endereco).not.toMatch(FORMATO_DE_TOKEN_DO_GITHUB);
      expect(codigo, endereco).not.toContain('GITHUB_TOKEN');
    }
  });

  test('HTML e scripts nos dados da API aparecem como texto e não rodam', async ({ page }) => {
    const dialogos: string[] = [];
    page.on('dialog', async (dialogo) => {
      dialogos.push(dialogo.message());
      await dialogo.dismiss();
    });
    const malicioso: Projeto = {
      titulo: '<img src=x onerror=alert("titulo")>',
      descricao: '<script>alert("descricao")</script><b>negrito</b>',
      stacks: ['<svg onload=alert("stack")>'],
      github: { disponivel: true, linguagem: '<i>Itálico</i>', estrelas: 1, ultimaAtualizacao: '2026-10-01T12:00:00Z' },
    };
    await abrirComCards(page, [malicioso]);

    const card = page.getByRole('article');
    await expect(card.getByRole('heading', { level: 3 })).toHaveText(malicioso.titulo);
    await expect(card.getByText(malicioso.descricao, { exact: true })).toBeVisible();
    await expect(card.getByRole('listitem').filter({ hasText: malicioso.stacks[0] })).toBeVisible();
    // Nenhuma marcação virou elemento de verdade.
    await expect(card.locator('img, script, b, svg, i')).toHaveCount(0);
    expect(dialogos).toEqual([]);
  });

  // Desde a T-018, o front só aceita links http(s) nos projetos: um endereço que não seja
  // http(s) recusa a resposta inteira (a seção mostra a mensagem amigável) e nunca vira link.
  test('endereço que não é http(s) vindo da API (javascript:, data:) não vira link nem roda', async ({ page }) => {
    const dialogos: string[] = [];
    page.on('dialog', async (dialogo) => {
      dialogos.push(dialogo.message());
      await dialogo.dismiss();
    });
    const ENDERECOS_PERIGOSOS: Pick<Projeto, 'repositorio' | 'demo'>[] = [
      { repositorio: 'javascript:alert("repositorio")' },
      { demo: 'JAVASCRIPT:alert("maiusculas")' },
      { repositorio: ' javascript:alert("espaco na frente")' },
      { demo: 'data:text/html,<script>alert("data")</script>' },
    ];

    for (const endereco of ENDERECOS_PERIGOSOS) {
      await simularApi(page, [...PROJETOS_DE_EXEMPLO, { titulo: 'Link perigoso', descricao: 'd', stacks: ['A'], ...endereco }]);
      await page.goto('/');

      const projetos = page.getByRole('region', { name: ptBR.secoes.projetos, exact: true });
      await expect(projetos.getByRole('status'), JSON.stringify(endereco)).toHaveText(ptBR.projetos.erro);
      await expect(projetos.getByRole('article')).toHaveCount(0);
      await expect(page.locator('a[href*="javascript:" i], a[href^="data:" i]')).toHaveCount(0);
    }
    expect(dialogos).toEqual([]);
  });
});
