// Funções de apoio dos testes e2e para medir a página: posição das seções em relação ao
// cabeçalho, foco visível e rolagem horizontal. Usadas por mais de um arquivo de teste.
// Ficam fora de e2e/testes/ porque não são testes: o Playwright só roda os arquivos *.spec.ts.
import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Onde o título da seção está em relação ao cabeçalho e à janela.
 * Serve para saber se a seção apareceu na tela sem ficar escondida atrás do cabeçalho.
 */
export async function medirSecao(page: Page, id: string) {
  return page.evaluate((idDaSecao) => {
    const titulo = document.querySelector(`#${idDaSecao} h1, #${idDaSecao} h2`)!.getBoundingClientRect();
    const cabecalho = document.querySelector('header')!.getBoundingClientRect();
    return {
      topoDoTitulo: titulo.top,
      baseDoTitulo: titulo.bottom,
      topoDoCabecalho: cabecalho.top,
      baseDoCabecalho: cabecalho.bottom,
      alturaDaJanela: window.innerHeight,
      rolagemVertical: window.scrollY,
    };
  }, id);
}

/** Espera a rolagem (que pode ser suave) terminar com o título da seção visível abaixo do cabeçalho. */
export async function esperarSecaoNaTela(page: Page, id: string) {
  await expect
    .poll(
      async () => {
        const m = await medirSecao(page, id);
        // 1px de folga para arredondamentos de subpixel.
        return m.topoDoTitulo >= m.baseDoCabecalho - 1 && m.baseDoTitulo <= m.alturaDaJanela + 1;
      },
      { message: `o título de #${id} deveria aparecer abaixo do cabeçalho, dentro da janela` },
    )
    .toBe(true);
}

/** O elemento com foco mostra o contorno de foco do teclado (`:focus-visible`, RNF-02). */
export async function esperarFocoVisivel(elemento: Locator) {
  await expect(elemento).toBeFocused();
  const foco = await elemento.evaluate((el) => {
    const estilo = getComputedStyle(el);
    return {
      focoDeTeclado: el.matches(':focus-visible'),
      estiloDoContorno: estilo.outlineStyle,
      larguraDoContorno: parseFloat(estilo.outlineWidth),
    };
  });
  expect(foco.focoDeTeclado).toBe(true);
  expect(foco.estiloDoContorno).not.toBe('none');
  expect(foco.larguraDoContorno).toBeGreaterThanOrEqual(2);
}

/** Elementos que passam da borda direita da tela (o que geraria rolagem horizontal). */
export async function medirEstouroHorizontal(page: Page) {
  return page.evaluate(() => {
    const larguraDaTela = document.documentElement.clientWidth;
    const estourados = [...document.querySelectorAll('body *')]
      .filter((el) => {
        const caixa = el.getBoundingClientRect();
        return caixa.width > 0 && (caixa.right > larguraDaTela + 0.5 || caixa.left < -0.5);
      })
      .map((el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}`);
    return {
      larguraDoConteudo: document.documentElement.scrollWidth,
      larguraDaTela,
      estourados,
    };
  });
}
