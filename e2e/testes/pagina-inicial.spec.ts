// Teste de aceitação da página inicial (criado na T-005, com a página provisória): ela abre
// no celular e no desktop, mostra o conteúdo, não estoura a largura da tela e cumpre a
// acessibilidade básica. A navegação pelo menu (T-007) fica em navegacao.spec.ts e as
// seções com conteúdo (T-008) em secoes-estaticas.spec.ts.
// Cada teste roda duas vezes, uma por projeto do playwright.config.ts (celular e desktop).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Locator } from '@playwright/test';
import { ptBR } from '../../apps/web/src/conteudo/pt-BR';
import { PROJETOS_DE_EXEMPLO, simularApi } from '../apoio/api';
import { contraste } from '../apoio/cores';
import { expect, test } from '../apoio/teste';

/** Razão de contraste entre a cor do texto do elemento e o fundo da página (1 a 21). */
async function contrasteComOFundo(elemento: Locator): Promise<number> {
  const corDoTexto = await elemento.evaluate((el) => getComputedStyle(el).color);
  const corDoFundo = await elemento
    .page()
    .evaluate(() => getComputedStyle(document.body).backgroundColor);
  return contraste(corDoTexto, corDoFundo);
}

test.describe('página inicial', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('mostra o nome e a frase de apresentação', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: ptBR.pessoa.nome, exact: true })).toBeVisible();
    // A frase vem do arquivo de conteúdo (RF-09): trocar a frase lá não quebra este teste.
    await expect(page.getByText(ptBR.inicio.frase, { exact: true })).toBeVisible();
  });

  // O título da aba fica no index.html (<title>), que precisa ser atualizado junto com
  // `pessoa.nome` do arquivo de conteúdo; quem cobra a dupla é o teste unitário
  // conteudo.test.tsx ("o título da aba (index.html) é o nome do arquivo de conteúdo").
  // Aqui o teste lê os dois arquivos: com os nomes iguais, confere a aba no navegador; com nomes
  // diferentes (uma troca de nome pela metade, como a da T-015 em andamento), ele é esperado
  // falhando, para a suíte e2e não acusar de novo o que o unitário já acusa.
  test('o título da aba é o nome do arquivo de conteúdo (RF-09)', async ({ page }) => {
    const tituloDoIndex = readFileSync(join(__dirname, '../../apps/web/index.html'), 'utf-8').match(/<title>(.*)<\/title>/)?.[1];
    test.fail(tituloDoIndex !== ptBR.pessoa.nome, `<title> do index.html ("${tituloDoIndex}") diferente do nome no conteúdo`);
    await expect(page).toHaveTitle(ptBR.pessoa.nome, { timeout: 2000 });
  });

  test('cabe na largura da tela, sem rolagem horizontal', async ({ page }) => {
    const larguras = await page.evaluate(() => ({
      conteudo: document.documentElement.scrollWidth,
      tela: document.documentElement.clientWidth,
    }));

    expect(larguras.conteudo).toBeLessThanOrEqual(larguras.tela);
    // O título fica inteiro dentro da tela.
    const caixa = await page.getByRole('heading', { level: 1 }).boundingBox();
    expect(caixa).not.toBeNull();
    expect(caixa!.x).toBeGreaterThanOrEqual(0);
    expect(caixa!.x + caixa!.width).toBeLessThanOrEqual(larguras.tela);
  });

  test('tem idioma, estrutura semântica e contraste adequados', async ({ page }) => {
    // Leitores de tela usam o lang para escolher a pronúncia.
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    // Um único <main> e um único <h1>: a estrutura que o leitor de tela usa para navegar.
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    // Imagens, se houver, precisam de texto alternativo.
    await expect(page.locator('img:not([alt])')).toHaveCount(0);

    // WCAG AA: pelo menos 4,5:1 para texto normal (vale com folga também para o título).
    expect(await contrasteComOFundo(page.getByRole('heading', { level: 1 }))).toBeGreaterThanOrEqual(4.5);
    expect(await contrasteComOFundo(page.getByText(ptBR.inicio.frase, { exact: true }))).toBeGreaterThanOrEqual(4.5);
  });

  test('carrega sem erros no console do navegador', async ({ page }) => {
    const erros: string[] = [];
    page.on('console', (mensagem) => {
      if (mensagem.type() === 'error') erros.push(mensagem.text());
    });
    page.on('pageerror', (erro) => erros.push(erro.message));

    // A API responde com projetos (no lugar da API sem resposta, padrão de e2e/apoio/teste.ts):
    // a página fica completa, com os cards (T-012) também passando pela checagem. A API de
    // verdade não sobe com os testes; chamá-la deixaria um erro de conexão no console.
    await simularApi(page, PROJETOS_DE_EXEMPLO);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Só confere depois de a seção Projetos terminar de carregar: um erro que aparecesse com
    // a resposta da API (por exemplo, um aviso do React ao montar os cards) não escapa.
    const projetos = page.getByRole('region', { name: ptBR.secoes.projetos, exact: true });
    await expect(projetos.getByRole('article')).toHaveCount(PROJETOS_DE_EXEMPLO.length);

    expect(erros).toEqual([]);
  });
});
