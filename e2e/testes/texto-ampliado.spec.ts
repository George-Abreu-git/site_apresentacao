// Testes de aceitação do cabeçalho e dos links com cara de botão com o texto ampliado a 200%
// (T-029; RNF-01, RNF-02; WCAG 1.4.4 e 1.4.10).
//
// O problema só aparecia com fontes largas, como a DejaVu Sans, a `sans-serif` padrão do runner
// Linux do CI: a marca e o botão Menu não cabiam lado a lado em 360px, e a palavra "Repositório"
// sozinha era mais larga que o card. Por isso os testes medem a página na hora, em vez de supor
// larguras de uma fonte: o mesmo teste vale no Windows (Segoe UI) e no Linux (DejaVu Sans).
//
// Cada teste roda nos dois projetos do playwright.config.ts (celular e desktop). Em 360px o
// desktop também usa o menu compacto (o menu em linha começa em 48rem = 768px).
import type { Locator, Page } from '@playwright/test';
import { ptBR } from '../../apps/web/src/conteudo/pt-BR';
import { PALAVRA_LONGA, esperarFocoVisivel, medirEstouroHorizontal, medirSecao, medirTexto } from '../apoio/pagina';
import { PROJETOS_DE_EXEMPLO, simularApi } from '../apoio/api';
import { expect, test } from '../apoio/teste';

const LARGURA_DO_CELULAR = 360;

/** Como quem aumenta o tamanho da fonte no navegador (WCAG 1.4.4): as medidas em rem crescem juntas. */
async function ampliarTexto(page: Page) {
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
}

/** Abre a página com os cards de exemplo na tela e o texto a 200%. */
async function abrirAmpliada(page: Page, largura = LARGURA_DO_CELULAR) {
  await page.setViewportSize({ width: largura, height: 800 });
  await simularApi(page, PROJETOS_DE_EXEMPLO);
  await page.goto('/');
  await expect(page.getByRole('article')).toHaveCount(PROJETOS_DE_EXEMPLO.length);
  await ampliarTexto(page);
  // Espera o layout novo: nada passando da largura da tela.
  await expect.poll(async () => (await medirEstouroHorizontal(page)).estourados).toEqual([]);
}

function cabecalho(page: Page): Locator {
  return page.getByRole('banner');
}

function marca(page: Page): Locator {
  return cabecalho(page).getByRole('link', { name: ptBR.pessoa.nome, exact: true });
}

function navegacao(page: Page): Locator {
  return page.getByRole('navigation', { name: ptBR.navegacao.rotulo });
}

function botaoMenu(page: Page): Locator {
  return navegacao(page).getByRole('button', { name: ptBR.navegacao.botaoMenu });
}

/** A caixa do elemento na tela (posição e tamanho), já arredondada para comparar sem subpixel. */
async function caixa(elemento: Locator) {
  return elemento.evaluate((el) => {
    const c = el.getBoundingClientRect();
    return { esquerda: c.left, direita: c.right, topo: c.top, base: c.bottom, altura: c.height, centroVertical: (c.top + c.bottom) / 2 };
  });
}

/** O elemento está inteiro na largura da tela (1px de folga para subpixel). */
async function esperarDentroDaTela(elemento: Locator, larguraDaTela: number) {
  const c = await caixa(elemento);
  expect(c.esquerda, 'passa da borda esquerda').toBeGreaterThanOrEqual(-1);
  expect(c.direita, 'passa da borda direita').toBeLessThanOrEqual(larguraDaTela + 1);
}

/**
 * Como o rótulo (o primeiro texto) de um link com cara de botão ocupa o botão: o texto, em
 * quantas linhas quebrou, se todas as linhas ficam dentro do botão e se ele caberia numa linha.
 * "Caberia" compara a largura da palavra inteira, medida num <canvas> com a fonte do botão, com a
 * largura útil dele (sem o padding). É o que torna o teste independente da fonte do sistema.
 */
async function medirRotulo(link: Locator) {
  return link.evaluate((el) => {
    const texto = [...el.childNodes].find((no) => no.nodeType === Node.TEXT_NODE && (no.textContent ?? '').trim() !== '')!;
    const faixa = document.createRange();
    faixa.selectNodeContents(texto);
    const linhas = [...faixa.getClientRects()].filter((linha) => linha.width > 0);
    const botao = el.getBoundingClientRect();
    const estilo = getComputedStyle(el);
    const contexto = document.createElement('canvas').getContext('2d')!;
    contexto.font = estilo.font;
    const rotulo = (texto.textContent ?? '').trim();
    return {
      texto: rotulo,
      linhas: linhas.length,
      dentroDoBotao: linhas.every(
        (linha) => linha.left >= botao.left - 0.5 && linha.right <= botao.right + 0.5 && linha.top >= botao.top - 0.5 && linha.bottom <= botao.bottom + 0.5,
      ),
      alturaDoBotao: botao.height,
      larguraUtil: el.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight),
      larguraDaPalavra: contexto.measureText(rotulo).width,
    };
  });
}

/** Troca só o rótulo visível do link, mantendo o aviso "(abre em nova aba)" dos links externos. */
async function trocarRotulo(link: Locator, novo: string) {
  await link.evaluate((el, texto) => {
    const no = [...el.childNodes].find((filho) => filho.nodeType === Node.TEXT_NODE && (filho.textContent ?? '').trim() !== '')!;
    no.textContent = texto;
  }, novo);
}

test.describe('Cabeçalho e links-botão com o texto ampliado a 200% (T-029; WCAG 1.4.4 e 1.4.10)', () => {
  // Regressão: a quebra em linhas (flex-wrap) e o padding vertical novo não podem mudar o cabeçalho
  // de quem não ampliou o texto. 64px de altura (4rem) + 1px da borda de baixo.
  for (const largura of [LARGURA_DO_CELULAR, 1440]) {
    test(`${largura}px no tamanho normal: o cabeçalho continua numa linha só, com 64px de altura`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 800 });
      await page.goto('/');

      const doCabecalho = await caixa(cabecalho(page));
      expect(doCabecalho.altura).toBeCloseTo(65, 0);

      // A marca e o menu (botão no celular, links no desktop) ficam lado a lado, centralizados na mesma linha.
      const daMarca = await caixa(marca(page));
      const doMenu = largura < 768 ? botaoMenu(page) : navegacao(page).getByRole('link');
      for (const item of await doMenu.all()) {
        const doItem = await caixa(item);
        expect(Math.abs(doItem.centroVertical - daMarca.centroVertical), 'fora da linha da marca').toBeLessThanOrEqual(1);
        expect(doItem.esquerda).toBeGreaterThan(daMarca.direita);
      }
    });
  }

  test('360px a 200%: a marca fica em cima e o botão Menu desce para a linha de baixo, os dois inteiros e dentro da tela', async ({ page }) => {
    await abrirAmpliada(page);

    const daMarca = await caixa(marca(page));
    const doBotao = await caixa(botaoMenu(page));
    const doCabecalho = await caixa(cabecalho(page));
    // Duas linhas: o botão começa abaixo da marca, e o cabeçalho cresce para conter os dois.
    expect(doBotao.topo).toBeGreaterThanOrEqual(daMarca.base);
    expect(doCabecalho.base).toBeGreaterThanOrEqual(doBotao.base);
    await esperarDentroDaTela(marca(page), LARGURA_DO_CELULAR);
    await esperarDentroDaTela(botaoMenu(page), LARGURA_DO_CELULAR);

    // Nada cortado para caber: o nome inteiro, sem reticências, e o botão com alvo de toque de 44px ou mais.
    const textoDaMarca = await medirTexto(marca(page));
    expect(textoDaMarca.texto).toBe(ptBR.pessoa.nome);
    expect(textoDaMarca.cabeNaCaixa).toBe(true);
    await expect(botaoMenu(page)).toHaveText(ptBR.navegacao.botaoMenu);
    expect(doBotao.altura).toBeGreaterThanOrEqual(44);
  });

  test('360px a 200% com o menu aberto: os seis links ficam dentro da largura e abaixo do cabeçalho, e o teclado abre, percorre e fecha a lista', async ({ page }) => {
    await abrirAmpliada(page);

    // Pelo teclado: Tab passa pela marca e chega ao botão; Enter abre a lista.
    await page.keyboard.press('Tab');
    await esperarFocoVisivel(marca(page));
    await page.keyboard.press('Tab');
    await esperarFocoVisivel(botaoMenu(page));
    await page.keyboard.press('Enter');
    await expect(botaoMenu(page)).toHaveAttribute('aria-expanded', 'true');

    await expect.poll(async () => (await medirEstouroHorizontal(page)).estourados).toEqual([]);
    const links = navegacao(page).getByRole('link');
    await expect(links).toHaveCount(6);
    const baseDoCabecalho = (await caixa(cabecalho(page))).base;
    for (const link of await links.all()) {
      await esperarDentroDaTela(link, LARGURA_DO_CELULAR);
      expect((await caixa(link)).topo).toBeGreaterThanOrEqual(baseDoCabecalho - 1);
      const texto = await medirTexto(link);
      expect(texto.cabeNaCaixa, `${texto.texto} cortado`).toBe(true);
    }

    // Tab entra na lista com foco visível; Esc fecha e devolve o foco ao botão.
    await page.keyboard.press('Tab');
    await esperarFocoVisivel(links.first());
    await page.keyboard.press('Escape');
    await expect(botaoMenu(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(botaoMenu(page)).toBeFocused();
    await expect(navegacao(page).locator('a').first()).toBeHidden();

    // E o clique também abre e fecha.
    await botaoMenu(page).click();
    await expect(links.first()).toBeVisible();
    await botaoMenu(page).click();
    await expect(navegacao(page).locator('a').first()).toBeHidden();
  });

  test('360px a 200%: "Repositório" fica inteiro dentro do botão, o botão dentro do card e o card dentro da tela; se a palavra não cabe numa linha, quebra', async ({ page }) => {
    await abrirAmpliada(page);

    const botoes = page.getByRole('article').getByRole('link', { name: new RegExp(`^${ptBR.projetos.linkRepositorio}`) });
    await expect(botoes).toHaveCount(PROJETOS_DE_EXEMPLO.filter((projeto) => projeto.repositorio).length);
    for (const botao of await botoes.all()) {
      const card = botao.locator('xpath=ancestor::article');
      await esperarDentroDaTela(card, LARGURA_DO_CELULAR);
      const doCard = await caixa(card);
      const doBotao = await caixa(botao);
      expect(doBotao.esquerda).toBeGreaterThanOrEqual(doCard.esquerda);
      expect(doBotao.direita).toBeLessThanOrEqual(doCard.direita);

      const rotulo = await medirRotulo(botao);
      expect(rotulo.texto).toBe(ptBR.projetos.linkRepositorio);
      expect(rotulo.dentroDoBotao).toBe(true);
      expect(rotulo.alturaDoBotao).toBeGreaterThanOrEqual(44);
      // Com a DejaVu Sans (CI) e a Segoe UI (Windows), a palavra em negrito a 32px é mais larga que
      // o botão e quebra em 2 linhas. Com uma fonte mais estreita, cabe numa linha só. Fora de uma
      // faixa de 2px (arredondamento entre o <canvas> e o layout), o teste confere o caso certo.
      if (rotulo.larguraDaPalavra > rotulo.larguraUtil + 2) expect(rotulo.linhas).toBeGreaterThan(1);
      if (rotulo.larguraDaPalavra < rotulo.larguraUtil - 2) expect(rotulo.linhas).toBe(1);
    }
  });

  test('360px a 200%, com uma palavra longa: os canais de Contato e os atalhos do Início e de Serviços quebram dentro do botão, sem passar da tela', async ({ page }) => {
    await abrirAmpliada(page);

    // Os links com cara de botão fora dos cards: 2 atalhos no Início, 1 em Serviços e 3 canais em Contato.
    const botoes = page.locator('#inicio, #servicos, #contato').getByRole('link');
    await expect(botoes).toHaveCount(6);
    // Primeiro com os textos reais: inteiros e com alvo de toque de 44px ou mais.
    for (const botao of await botoes.all()) {
      const rotulo = await medirRotulo(botao);
      expect(rotulo.dentroDoBotao, `"${rotulo.texto}" passa do botão`).toBe(true);
      expect(rotulo.alturaDoBotao).toBeGreaterThanOrEqual(44);
      await esperarDentroDaTela(botao, LARGURA_DO_CELULAR);
    }

    // Depois com uma palavra sem ponto de quebra, bem maior que a tela: ela tem de quebrar dentro do botão.
    for (const botao of await botoes.all()) await trocarRotulo(botao, PALAVRA_LONGA);
    await expect.poll(async () => (await medirEstouroHorizontal(page)).estourados).toEqual([]);
    for (const botao of await botoes.all()) {
      const rotulo = await medirRotulo(botao);
      expect(rotulo.texto).toBe(PALAVRA_LONGA);
      expect(rotulo.linhas).toBeGreaterThan(1);
      expect(rotulo.dentroDoBotao).toBe(true);
      await esperarDentroDaTela(botao, LARGURA_DO_CELULAR);
    }
  });
});

test.describe('Cabeçalho em 2 linhas a 200%: bugs conhecidos (achados da T-029)', () => {
  // BUG CONHECIDO (achado no qa da T-029): o `scroll-padding-top` do html é fixo em 4rem (a altura
  // do cabeçalho numa linha; apps/web/src/index.css). Em 360px com o texto a 200%, o cabeçalho
  // quebra em 2 linhas e fica mais alto que isso (~249px contra 128px). Ao seguir uma âncora do
  // menu, a seção para 128px abaixo do topo e o título dela fica atrás do cabeçalho.
  // Esperado: o título da seção abaixo do cabeçalho. Obtido: topo do título em y=225, base do cabeçalho em y=249.
  // A rolagem fica instantânea (movimento reduzido): com a rolagem suave, o título passa por baixo
  // do cabeçalho no meio da animação, e um teste que espera "o título na tela" passaria por engano.
  test('360px a 200%: seguir um link do menu deixa o título da seção abaixo do cabeçalho', async ({ page }) => {
    test.fail();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrirAmpliada(page);
    await botaoMenu(page).click();
    await navegacao(page).getByRole('link', { name: 'Sobre', exact: true }).click();
    await expect(page).toHaveURL(/#sobre$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    const secao = await medirSecao(page, 'sobre');
    expect(secao.topoDoTitulo).toBeGreaterThanOrEqual(secao.baseDoCabecalho - 1);
  });

  // BUG CONHECIDO (achado no qa da T-029; mesma causa da T-024): a lista aberta é `position:
  // absolute` dentro do cabeçalho preso ao topo (sticky), então rolar a página não a move. Com o
  // cabeçalho em 2 linhas, a lista começa mais abaixo e, em 360x800 com o texto a 200%, o último
  // link ("Contato") termina abaixo da janela, sem como rolar até ele.
  // Esperado: todos os links inteiros na tela (ou a lista rolando por dentro). Obtido: "Contato" vai até y≈840.
  test('360x800 a 200%: a lista aberta cabe na tela ou rola por dentro', async ({ page }) => {
    test.fail();
    await abrirAmpliada(page);
    await botaoMenu(page).click();
    const ultimo = navegacao(page).getByRole('link', { name: 'Contato', exact: true });
    await ultimo.scrollIntoViewIfNeeded();
    await expect(ultimo).toBeInViewport({ ratio: 1, timeout: 2000 });
  });
});
