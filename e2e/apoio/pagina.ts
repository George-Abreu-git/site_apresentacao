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

// Texto longo (T-025): uma "palavra" sem espaço, como um nome de classe colado no título, e um
// endereço colado no meio de uma frase. Sem ponto de quebra, só o `overflow-wrap: break-word`
// do body consegue parti-los, e só se o contêiner puder encolher até a largura da tela.
export const PALAVRA_LONGA = 'ConfiguracaoDoGithubComCacheEFallbackParaAPI';
export const ENDERECO_LONGO = 'Detalhes em https://github.com/George-Abreu-git/site_apresentacao/tree/main/apps/api.';

/**
 * Troca o texto de um elemento já na tela, como se o George tivesse escrito outro texto no arquivo
 * de conteúdo. Serve para as seções estáticas (Serviços, Stacks), que não vêm da API simulada.
 */
export async function trocarTexto(elemento: Locator, texto: string) {
  await elemento.evaluate((el, novo) => {
    el.textContent = novo;
  }, texto);
}

/**
 * Como o texto do elemento ocupa a caixa dele: se cabe sem nada cortado ou passando da borda
 * (`scrollWidth` ≤ `clientWidth`) e em quantas linhas quebrou (altura ÷ altura da linha).
 */
export async function medirTexto(elemento: Locator) {
  return elemento.evaluate((el) => {
    const alturaDaLinha = parseFloat(getComputedStyle(el).lineHeight);
    return {
      texto: el.textContent,
      cabeNaCaixa: el.scrollWidth <= el.clientWidth + 1,
      linhas: Math.round(el.getBoundingClientRect().height / alturaDaLinha),
    };
  });
}

/** As larguras (arredondadas) dos elementos: numa grade com colunas iguais, todas são a mesma. */
export async function larguras(elementos: Locator): Promise<number[]> {
  return elementos.evaluateAll((lista) => lista.map((el) => Math.round(el.getBoundingClientRect().width)));
}
