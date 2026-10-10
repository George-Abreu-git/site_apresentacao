// Teste de aceitação da página provisória (T-005): ela abre no celular e no desktop,
// mostra o conteúdo, não estoura a largura da tela e cumpre a acessibilidade básica.
// Cada teste roda duas vezes, uma por projeto do playwright.config.ts (celular e desktop).
import { expect, test, type Locator } from '@playwright/test';

/** Converte "rgb(26, 26, 26)" (formato do getComputedStyle) em [26, 26, 26]. */
function lerRgb(cor: string): [number, number, number] {
  const numeros = cor.match(/\d+(\.\d+)?/g);
  if (!numeros || numeros.length < 3) {
    throw new Error(`Cor em formato inesperado: ${cor}`);
  }
  return [Number(numeros[0]), Number(numeros[1]), Number(numeros[2])];
}

/** Luminância relativa de uma cor, pela fórmula das WCAG 2.x. */
function luminancia([r, g, b]: [number, number, number]): number {
  const [rl, gl, bl] = [r, g, b].map((canal) => {
    const c = canal / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** Razão de contraste entre a cor do texto do elemento e o fundo da página (1 a 21). */
async function contrasteComOFundo(elemento: Locator): Promise<number> {
  const corDoTexto = await elemento.evaluate((el) => getComputedStyle(el).color);
  const corDoFundo = await elemento
    .page()
    .evaluate(() => getComputedStyle(document.body).backgroundColor);
  const [clara, escura] = [luminancia(lerRgb(corDoTexto)), luminancia(lerRgb(corDoFundo))].sort(
    (a, b) => b - a,
  );
  return (clara + 0.05) / (escura + 0.05);
}

test.describe('página provisória', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('mostra o nome e o aviso de site em construção', async ({ page }) => {
    await expect(page).toHaveTitle('George Siqueira');
    await expect(page.getByRole('heading', { level: 1, name: 'George Siqueira' })).toBeVisible();
    await expect(page.getByText('Site em construção.')).toBeVisible();
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
    expect(await contrasteComOFundo(page.getByText('Site em construção.'))).toBeGreaterThanOrEqual(4.5);
  });

  test('carrega sem erros no console do navegador', async ({ page }) => {
    const erros: string[] = [];
    page.on('console', (mensagem) => {
      if (mensagem.type() === 'error') erros.push(mensagem.text());
    });
    page.on('pageerror', (erro) => erros.push(erro.message));

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    expect(erros).toEqual([]);
  });
});
