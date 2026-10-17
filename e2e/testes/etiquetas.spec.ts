// Testes de aceitação das etiquetas de tecnologia com nome longo (T-028; achado do qa na T-025;
// RF-04, RF-05, RNF-01; WCAG 1.4.4 e 1.4.10).
//
// As etiquetas são as "pílulas" com o nome de uma tecnologia: as stacks do card de projeto e as
// tecnologias da seção Stacks. Cada uma é um item flex, que não encolhe abaixo da largura mínima
// do texto. Antes da correção, um nome longo e sem espaço deixava essa largura igual à palavra
// inteira, e em 360px a página rolava para o lado (conteúdo com 379px no card e 404px em Stacks).
//
// Os testes não supõem larguras de uma fonte: o que depende de a palavra caber numa linha é
// medido na hora, num <canvas> com a fonte da etiqueta (como no texto-ampliado.spec.ts da T-029).
// Assim o mesmo teste vale no Windows (Segoe UI) e no runner Linux do CI (DejaVu Sans).
//
// Cada teste roda nos dois projetos do playwright.config.ts (celular e desktop), com a largura
// definida no próprio teste.
import type { Locator, Page } from '@playwright/test';
import { PROJETOS_DE_EXEMPLO, simularApi } from '../apoio/api';
import { larguras, medirEstouroHorizontal, PALAVRA_LONGA, trocarTexto } from '../apoio/pagina';
import { expect, test } from '../apoio/teste';

const LARGURA_DO_CELULAR = 360;

/** Um projeto com um nome de tecnologia longo entre dois curtos. */
const PROJETO_COM_STACK_LONGA = {
  titulo: 'Projeto com stack longa',
  descricao: 'Uma das tecnologias tem um nome comprido e sem espaço.',
  stacks: ['React', PALAVRA_LONGA, 'TypeScript'],
};

/** Como quem aumenta o tamanho da fonte no navegador (WCAG 1.4.4): as medidas em rem crescem juntas. */
async function ampliarTexto(page: Page) {
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
}

/** Abre a página na largura pedida, com os cards da API simulada já na tela. */
async function abrir(page: Page, largura: number, projetos: unknown[]) {
  await page.setViewportSize({ width: largura, height: 800 });
  await simularApi(page, projetos);
  await page.goto('/');
  await expect(page.getByRole('article')).toHaveCount(projetos.length);
}

/** As etiquetas do card: os itens da lista de stacks (a única lista com nome dentro do card). */
function etiquetasDoCard(page: Page, titulo: string): Locator {
  return page.getByRole('article', { name: titulo, exact: true }).locator('ul[aria-label] > li');
}

/** As etiquetas da seção Stacks: os itens das listas de cada categoria. */
function etiquetasDeStacks(page: Page): Locator {
  return page.locator('#stacks ul > li');
}

/** Coloca o nome longo na primeira etiqueta de Stacks, como se o George o tivesse escrito no arquivo de conteúdo. */
async function nomeLongoEmStacks(page: Page): Promise<Locator> {
  const etiqueta = etiquetasDeStacks(page).first();
  await trocarTexto(etiqueta, PALAVRA_LONGA);
  await expect(etiqueta).toHaveText(PALAVRA_LONGA);
  return etiqueta;
}

/** Nada passa da largura da tela (espera o layout novo depois de trocar um texto ou ampliar). */
async function esperarSemRolagemLateral(page: Page) {
  await expect.poll(async () => (await medirEstouroHorizontal(page)).estourados, { message: 'elementos que passam da borda da tela' }).toEqual([]);
  const medida = await medirEstouroHorizontal(page);
  expect(medida.larguraDoConteudo).toBeLessThanOrEqual(medida.larguraDaTela);
}

/**
 * Como o texto ocupa a etiqueta: o texto inteiro, em quantas linhas quebrou, se todas as linhas
 * ficam dentro da etiqueta e da lista dela, quais palavras foram partidas entre duas linhas e,
 * medido num <canvas> com a fonte da etiqueta, a largura de cada palavra e do texto inteiro,
 * para comparar com a largura útil (a da lista, menos o padding e a borda da própria etiqueta).
 * Também devolve o estilo que poderia esconder ou cortar o texto.
 */
async function medirEtiquetas(etiquetas: Locator) {
  return etiquetas.evaluateAll((lista) =>
    lista.map((el) => {
      const no = [...el.childNodes].find((filho) => filho.nodeType === Node.TEXT_NODE)!;
      const texto = no.textContent ?? '';
      const caixa = el.getBoundingClientRect();
      const daLista = el.parentElement!.getBoundingClientRect();
      const estilo = getComputedStyle(el);
      const faixa = document.createRange();
      faixa.selectNodeContents(no);
      const linhas = [...faixa.getClientRects()].filter((linha) => linha.width > 0);

      const contexto = document.createElement('canvas').getContext('2d')!;
      contexto.font = estilo.font;
      const palavras: { palavra: string; largura: number; partida: boolean }[] = [];
      for (const achado of texto.matchAll(/\S+/g)) {
        const daPalavra = document.createRange();
        daPalavra.setStart(no, achado.index);
        daPalavra.setEnd(no, achado.index + achado[0].length);
        const pedacos = [...daPalavra.getClientRects()].filter((pedaco) => pedaco.width > 0);
        palavras.push({ palavra: achado[0], largura: contexto.measureText(achado[0]).width, partida: new Set(pedacos.map((p) => Math.round(p.top))).size > 1 });
      }

      const horizontais = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'] as const;
      return {
        texto,
        linhas: linhas.length,
        dentroDaEtiqueta: linhas.every((linha) => linha.left >= caixa.left - 0.5 && linha.right <= caixa.right + 0.5),
        dentroDaLista: caixa.left >= daLista.left - 0.5 && caixa.right <= daLista.right + 0.5,
        semRolagemInterna: el.scrollWidth <= el.clientWidth + 1,
        larguraUtil: el.parentElement!.clientWidth - horizontais.reduce((soma, lado) => soma + parseFloat(estilo[lado]), 0),
        larguraDoTexto: contexto.measureText(texto).width,
        palavras,
        estilo: { overflowX: estilo.overflowX, overflowY: estilo.overflowY, textOverflow: estilo.textOverflow, whiteSpace: estilo.whiteSpace },
      };
    }),
  );
}

type MedidaDaEtiqueta = Awaited<ReturnType<typeof medirEtiquetas>>[number];

/** O nome longo aparece inteiro, quebrado em mais de uma linha, e todas as linhas ficam dentro da etiqueta e da lista. */
function conferirNomeLongoQuebrado(medida: MedidaDaEtiqueta) {
  expect(medida.texto).toBe(PALAVRA_LONGA);
  expect(medida.larguraDoTexto, 'o nome longo deveria ser mais largo que a lista').toBeGreaterThan(medida.larguraUtil);
  expect(medida.linhas, 'o nome longo deveria quebrar dentro da etiqueta').toBeGreaterThan(1);
  expect(medida.dentroDaEtiqueta, 'uma linha do nome passa da etiqueta').toBe(true);
  expect(medida.dentroDaLista, 'a etiqueta passa da lista').toBe(true);
  expect(medida.semRolagemInterna, 'a etiqueta rola por dentro').toBe(true);
}

/**
 * Uma palavra que cabe na largura útil não é partida no meio, e uma etiqueta que cabe inteira numa
 * linha fica numa linha só (ela desce para a linha de baixo em vez de quebrar). Quando a palavra
 * fica a menos de 2px da largura útil, o caso é ambíguo (arredondamento entre o <canvas> e o layout)
 * e não é cobrado.
 */
function conferirSemQuebraNoMeio(medida: MedidaDaEtiqueta) {
  for (const { palavra, largura, partida } of medida.palavras) {
    if (largura < medida.larguraUtil - 2) expect(partida, `"${palavra}" (${Math.round(largura)}px) cabe em ${Math.round(medida.larguraUtil)}px e foi partida`).toBe(false);
  }
  if (medida.larguraDoTexto < medida.larguraUtil - 2) expect(medida.linhas, `"${medida.texto}" cabe numa linha`).toBe(1);
}

test.describe('Etiquetas de tecnologia com nome longo (T-028; RNF-01)', () => {
  test('360px: um nome longo na etiqueta do card quebra dentro dela, sem rolagem lateral, e as etiquetas curtas ficam inteiras', async ({ page }) => {
    await abrir(page, LARGURA_DO_CELULAR, [PROJETO_COM_STACK_LONGA]);
    await esperarSemRolagemLateral(page);

    const etiquetas = etiquetasDoCard(page, PROJETO_COM_STACK_LONGA.titulo);
    await expect(etiquetas).toHaveText(PROJETO_COM_STACK_LONGA.stacks);
    const [react, longa, typescript] = await medirEtiquetas(etiquetas);
    conferirNomeLongoQuebrado(longa);
    conferirSemQuebraNoMeio(react);
    conferirSemQuebraNoMeio(typescript);

    // O card continua inteiro dentro da tela.
    const card = (await page.getByRole('article').boundingBox())!;
    expect(card.x).toBeGreaterThanOrEqual(0);
    expect(card.x + card.width).toBeLessThanOrEqual(LARGURA_DO_CELULAR);
  });

  test('360px: um nome longo na etiqueta da seção Stacks quebra dentro dela, sem rolagem lateral', async ({ page }) => {
    await page.setViewportSize({ width: LARGURA_DO_CELULAR, height: 800 });
    await page.goto('/#stacks');
    const etiqueta = await nomeLongoEmStacks(page);
    await esperarSemRolagemLateral(page);

    const [longa] = await medirEtiquetas(etiqueta);
    conferirNomeLongoQuebrado(longa);
    // As outras etiquetas de Stacks continuam inteiras.
    for (const medida of (await medirEtiquetas(etiquetasDeStacks(page))).slice(1)) conferirSemQuebraNoMeio(medida);
  });

  test('360px com o texto ampliado a 200%: o nome longo quebra dentro da etiqueta no card e em Stacks, sem rolagem lateral', async ({ page }) => {
    await abrir(page, LARGURA_DO_CELULAR, [PROJETO_COM_STACK_LONGA, ...PROJETOS_DE_EXEMPLO]);
    await nomeLongoEmStacks(page);
    await ampliarTexto(page);
    await esperarSemRolagemLateral(page);

    const doCard = (await medirEtiquetas(etiquetasDoCard(page, PROJETO_COM_STACK_LONGA.titulo)))[1];
    const deStacks = (await medirEtiquetas(etiquetasDeStacks(page)))[0];
    conferirNomeLongoQuebrado(doCard);
    conferirNomeLongoQuebrado(deStacks);
  });

  // Regressão do `overflow-wrap: anywhere`: ele só pode partir a palavra que não cabe nem sozinha
  // na linha. Com os nomes reais (cards de exemplo e o arquivo de conteúdo), uma etiqueta que não
  // cabe ao lado das outras desce de linha inteira. A 200%, com fontes largas como a DejaVu Sans,
  // "TypeScript" e "Markdown" ficam mais largas que o card e quebram: a medida com o <canvas>
  // separa esse caso (permitido) do que seria um bug.
  test('360px, no tamanho normal e a 200%: com os nomes reais, etiqueta que cabe não é partida no meio', async ({ page }) => {
    await abrir(page, LARGURA_DO_CELULAR, PROJETOS_DE_EXEMPLO);
    const todas = page.locator('#stacks ul > li, article ul[aria-label] > li');
    const total = PROJETOS_DE_EXEMPLO.reduce((soma, projeto) => soma + projeto.stacks.length, 0) + (await etiquetasDeStacks(page).count());
    await expect(todas).toHaveCount(total);

    for (const tamanho of ['normal', '200%']) {
      if (tamanho === '200%') await ampliarTexto(page);
      await esperarSemRolagemLateral(page);
      const medidas = await medirEtiquetas(todas);
      for (const medida of medidas) {
        await test.step(`${tamanho}: "${medida.texto}"`, () => {
          conferirSemQuebraNoMeio(medida);
          expect(medida.dentroDaEtiqueta).toBe(true);
          expect(medida.dentroDaLista).toBe(true);
        });
      }
      // No tamanho normal, nenhum nome real é mais largo que a lista: todas ficam numa linha só.
      if (tamanho === 'normal') expect(medidas.filter((medida) => medida.linhas !== 1).map((medida) => medida.texto)).toEqual([]);
    }
  });

  // Nada é cortado ou escondido para caber: sem `overflow: hidden`, reticências ou `nowrap`, o nome
  // aparece inteiro. Em 1280px os cards ficam em 3 colunas e as categorias em 4, e a 200% o nome
  // longo é mais largo que qualquer coluna: ele quebra sem alargar a coluna dele.
  test('1280px a 200% com nomes longos: nada é cortado ou escondido, e as colunas continuam com a mesma largura', async ({ page }) => {
    await abrir(page, 1280, [PROJETO_COM_STACK_LONGA, ...PROJETOS_DE_EXEMPLO]);
    await nomeLongoEmStacks(page);
    await ampliarTexto(page);
    await esperarSemRolagemLateral(page);

    const medidas = await medirEtiquetas(page.locator('#stacks ul > li, article ul[aria-label] > li'));
    for (const medida of medidas) {
      expect(medida.estilo, `"${medida.texto}"`).toEqual({ overflowX: 'visible', overflowY: 'visible', textOverflow: 'clip', whiteSpace: 'normal' });
      expect(medida.semRolagemInterna, `"${medida.texto}" rola por dentro`).toBe(true);
      expect(medida.dentroDaEtiqueta, `"${medida.texto}" passa da etiqueta`).toBe(true);
      expect(medida.dentroDaLista, `"${medida.texto}" passa da lista`).toBe(true);
    }
    const longas = medidas.filter((medida) => medida.texto === PALAVRA_LONGA);
    expect(longas).toHaveLength(2);
    for (const longa of longas) conferirNomeLongoQuebrado(longa);

    // A etiqueta longa não alarga o card nem a categoria dela.
    expect(new Set(await larguras(page.getByRole('article'))).size, 'cards com larguras diferentes').toBe(1);
    expect(new Set(await larguras(page.locator('#stacks h3').locator('xpath=..'))).size, 'categorias com larguras diferentes').toBe(1);
  });
});
