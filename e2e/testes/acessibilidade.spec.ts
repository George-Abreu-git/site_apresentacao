// Testes de aceitação de acessibilidade da página inteira (RNF-02; pente-fino da T-016).
// Os testes de cada seção (foco visível, contraste) ficam nos arquivos delas; aqui fica o que
// vale para a página toda: percorrer tudo só com o teclado, nomes acessíveis, ids únicos,
// movimento reduzido e texto ampliado.
// Cada teste roda nos dois projetos do playwright.config.ts (celular e desktop).
import type { Page } from '@playwright/test';
import { ptBR } from '../../apps/web/src/conteudo/pt-BR';
import { PROJETOS_DE_EXEMPLO, simularApi } from '../apoio/api';
import { medirEstouroHorizontal } from '../apoio/pagina';
import { expect, test } from '../apoio/teste';

async function abrirComCards(page: Page) {
  await simularApi(page, PROJETOS_DE_EXEMPLO);
  await page.goto('/');
  await expect(page.getByRole('article')).toHaveCount(PROJETOS_DE_EXEMPLO.length);
}

/** Os links e botões visíveis, na ordem do documento, como "texto|href". */
async function focaveisVisiveis(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('a[href], button')]
      .filter((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden')
      .map((el) => `${el.textContent?.trim()}|${el.getAttribute('href') ?? 'botão'}`),
  );
}

/** O elemento com foco agora, como "texto|href", e se o cabeçalho preso ao topo o cobre. */
async function focoAtual(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const caixa = el.getBoundingClientRect();
    const baseDoCabecalho = document.querySelector('header')!.getBoundingClientRect().bottom;
    return {
      id: `${el.textContent?.trim()}|${el.getAttribute('href') ?? (el.tagName === 'BUTTON' ? 'botão' : el.tagName)}`,
      focoDeTeclado: el.matches(':focus-visible'),
      // Fora do cabeçalho, o elemento focado não pode ficar escondido atrás dele (WCAG 2.4.11).
      cobertoPeloCabecalho: !el.closest('header') && caixa.top < baseDoCabecalho - 1,
    };
  });
}

test.describe('Acessibilidade da página inteira (RNF-02)', () => {
  test('só com o teclado: Tab passa por todos os links e botões, em ordem, com foco visível e nada coberto pelo cabeçalho', async ({ page }) => {
    await abrirComCards(page);
    const esperados = await focaveisVisiveis(page);
    expect(esperados.length).toBeGreaterThan(10);

    const visitados: string[] = [];
    for (let i = 0; i < esperados.length; i++) {
      await page.keyboard.press('Tab');
      // A rolagem até o elemento pode ser suave: espera ela terminar antes de medir.
      await expect.poll(async () => (await focoAtual(page)).cobertoPeloCabecalho).toBe(false);
      const foco = await focoAtual(page);
      expect(foco.focoDeTeclado, `${foco.id} sem :focus-visible`).toBe(true);
      visitados.push(foco.id);
    }
    expect(visitados).toEqual(esperados);
  });

  test('Shift+Tab volta pelo mesmo caminho, do último ao primeiro', async ({ page }) => {
    await abrirComCards(page);
    const esperados = await focaveisVisiveis(page);
    for (let i = 0; i < esperados.length; i++) await page.keyboard.press('Tab');

    const visitados = [(await focoAtual(page)).id];
    for (let i = 1; i < esperados.length; i++) {
      await page.keyboard.press('Shift+Tab');
      visitados.push((await focoAtual(page)).id);
    }
    expect(visitados).toEqual([...esperados].reverse());
  });

  test('todo link e botão tem nome acessível, e nenhum id se repete na página', async ({ page }) => {
    await abrirComCards(page);
    const semNome = await page.evaluate(() =>
      [...document.querySelectorAll('a, button')].filter((el) => (el.textContent ?? '').trim() === '' && !el.getAttribute('aria-label')).map((el) => el.outerHTML),
    );
    expect(semNome).toEqual([]);

    const repetidos = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
      return ids.filter((id, posicao) => ids.indexOf(id) !== posicao);
    });
    expect(repetidos).toEqual([]);
    // Toda referência (aria-labelledby, aria-controls) aponta para um id que existe.
    const referenciasQuebradas = await page.evaluate(() =>
      [...document.querySelectorAll('[aria-labelledby], [aria-controls]')]
        .flatMap((el) => `${el.getAttribute('aria-labelledby') ?? ''} ${el.getAttribute('aria-controls') ?? ''}`.split(/\s+/))
        .filter((id) => id !== '' && !document.getElementById(id)),
    );
    expect(referenciasQuebradas).toEqual([]);
  });

  test('todo link que abre nova aba avisa o leitor de tela, e toda imagem (se houver) tem alt', async ({ page }) => {
    await abrirComCards(page);
    const novasAbas = page.locator('a[target="_blank"]');
    expect(await novasAbas.count()).toBeGreaterThan(0);
    for (const link of await novasAbas.all()) {
      await expect(link).toHaveAccessibleName(new RegExp(`${ptBR.geral.abreEmNovaAba.replace(/[()]/g, '\\$&')}$`));
    }
    await expect(page.locator('img:not([alt]), svg:not([aria-hidden="true"]):not([role="img"])')).toHaveCount(0);
  });

  test('com "reduzir movimento" ligado no sistema, a rolagem até as seções não é animada', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('smooth');
  });

  // Com o texto em 200%, cada rem vale o dobro: 720px de tela equivalem aos 360px do menor celular
  // de RNF-01 (e 1280px, a 640px). Abaixo disso (ex.: 360px a 200%, como uma tela de 180px), os
  // cards estouram pela mesma causa do bug das palavras longas (projetos.spec.ts).
  for (const largura of [720, 1280]) {
    test(`${largura}px com o texto ampliado a 200%: nada passa da largura da tela`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 800 });
      await simularApi(page, PROJETOS_DE_EXEMPLO);
      await page.goto('/');
      await expect(page.getByRole('article')).toHaveCount(PROJETOS_DE_EXEMPLO.length);
      // Como quem aumenta o tamanho da fonte no navegador (WCAG 1.4.4): as medidas em rem crescem juntas.
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });

      await expect.poll(async () => (await medirEstouroHorizontal(page)).estourados).toEqual([]);
      const medidas = await medirEstouroHorizontal(page);
      expect(medidas.larguraDoConteudo).toBeLessThanOrEqual(medidas.larguraDaTela);
    });
  }
});
