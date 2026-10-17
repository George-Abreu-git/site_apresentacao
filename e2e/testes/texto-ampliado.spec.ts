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
//
// O tamanho do cabeçalho depende da fonte e do nome na marca: com a DejaVu Sans, "George Siqueira"
// quebra em 2 linhas a 200%; com a Segoe UI, cabe em 1. Os testes que dependem da altura do
// cabeçalho trocam o nome da marca por um de tamanho conhecido (curto ou longo) e conferem a
// condição medida antes de esperar o resultado, para dar o mesmo resultado em qualquer sistema.
import type { Locator, Page } from '@playwright/test';
import { ptBR } from '../../apps/web/src/conteudo/pt-BR';
import { PALAVRA_LONGA, esperarFocoVisivel, medirEstouroHorizontal, medirSecao, medirTexto, trocarTexto } from '../apoio/pagina';
import { PROJETOS_DE_EXEMPLO, simularApi } from '../apoio/api';
import { expect, test } from '../apoio/teste';

const LARGURA_DO_CELULAR = 360;

/** Um nome curto: no tamanho normal, cabe ao lado do botão Menu em 360px com qualquer fonte comum. */
const NOME_CURTO = 'George Siqueira';

/**
 * Um nome longo (43 letras, 6 palavras): a 200% em 360px, a marca quebra em 3 linhas ou mais com
 * qualquer fonte, e o cabeçalho passa de ~300px. Assim os bugs do cabeçalho alto aparecem sempre,
 * e não só com fontes largas (como a DejaVu Sans do CI) ou com o nome real mais comprido.
 */
const NOME_LONGO = 'George Abreu de Siqueira Albuquerque Santos';

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

function marca(page: Page, nome = ptBR.pessoa.nome): Locator {
  return cabecalho(page).getByRole('link', { name: nome, exact: true });
}

/** Troca o nome na marca, como se o George tivesse escrito outro no arquivo de conteúdo. */
async function trocarNomeDaMarca(page: Page, nome: string): Promise<Locator> {
  await trocarTexto(marca(page), nome);
  const nova = marca(page, nome);
  await expect(nova).toHaveText(nome);
  return nova;
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
  // A marca recebe um nome curto: um nome real comprido pode, com razão, descer o menu para a linha
  // de baixo em 360px (com a DejaVu Sans, "George Abreu de Siqueira" já não cabe ao lado do botão).
  for (const largura of [LARGURA_DO_CELULAR, 1440]) {
    test(`${largura}px no tamanho normal, com um nome curto na marca: o cabeçalho continua numa linha só, com 64px de altura`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 800 });
      await page.goto('/');
      const marcaCurta = await trocarNomeDaMarca(page, NOME_CURTO);

      const doCabecalho = await caixa(cabecalho(page));
      expect(doCabecalho.altura).toBeCloseTo(65, 0);

      // A marca e o menu (botão no celular, links no desktop) ficam lado a lado, centralizados na mesma linha.
      const daMarca = await caixa(marcaCurta);
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

/**
 * Onde a seção, o título dela e o cabeçalho estão na tela. `topoDaSecao` é a borda de cima da
 * seção: ao seguir uma âncora, ela deve parar logo abaixo do cabeçalho, qualquer que seja a altura
 * dele (o `scroll-padding-top` do <html> acompanha a altura medida; T-030).
 */
async function medirAncora(page: Page, id: string) {
  return page.evaluate((idDaSecao) => {
    const secao = document.getElementById(idDaSecao)!.getBoundingClientRect();
    const titulo = document.querySelector(`#${idDaSecao} h1, #${idDaSecao} h2`)!.getBoundingClientRect();
    const doCabecalho = document.querySelector('header')!.getBoundingClientRect();
    return {
      topoDaSecao: secao.top,
      topoDoTitulo: titulo.top,
      baseDoTitulo: titulo.bottom,
      baseDoCabecalho: doCabecalho.bottom,
      alturaDaJanela: window.innerHeight,
      rolagemVertical: window.scrollY,
    };
  }, id);
}

/**
 * Espera a rolagem (suave ou não) terminar: duas leituras seguidas, com 200ms entre elas, na mesma
 * posição. Medir no meio da animação daria um resultado falso (o título passa pela tela no caminho).
 */
async function esperarRolagemParar(page: Page) {
  let anterior: number | undefined;
  await expect
    .poll(
      async () => {
        const atual = await page.evaluate(() => window.scrollY);
        const parou = atual === anterior;
        anterior = atual;
        return parou;
      },
      { intervals: [200], message: 'a rolagem deveria terminar' },
    )
    .toBe(true);
}

/** Segue o link do menu (abrindo a lista, se o menu compacto estiver na tela) e espera a rolagem terminar. */
async function seguirPeloMenu(page: Page, id: string, titulo: string) {
  const antes = await page.evaluate(() => window.scrollY);
  if (await botaoMenu(page).isVisible()) await botaoMenu(page).click();
  await navegacao(page).getByRole('link', { name: titulo, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`#${id}$`));
  // Em todos os casos dos testes a página precisa sair do lugar; só então dá para esperar o fim.
  await expect.poll(() => page.evaluate(() => window.scrollY)).not.toBe(antes);
  await esperarRolagemParar(page);
}

/**
 * A seção começa logo abaixo do cabeçalho: nem atrás dele (o título ficaria coberto) nem com um vão
 * acima dela (o espaço reservado maior que o cabeçalho). A expectativa sai da altura medida do
 * cabeçalho na hora, então vale com qualquer fonte e qualquer nome na marca. 1px de folga para o
 * arredondamento (a altura reservada é a do cabeçalho arredondada para cima) e o subpixel do celular.
 */
async function esperarSecaoLogoAbaixoDoCabecalho(page: Page, id: string) {
  const m = await medirAncora(page, id);
  expect(m.topoDaSecao - m.baseDoCabecalho, `#${id}: distância entre a base do cabeçalho e o topo da seção`).toBeGreaterThanOrEqual(-1);
  expect(m.topoDaSecao - m.baseDoCabecalho, `#${id}: distância entre a base do cabeçalho e o topo da seção`).toBeLessThanOrEqual(1.5);
  expect(m.baseDoTitulo, `#${id}: título abaixo da janela`).toBeLessThanOrEqual(m.alturaDaJanela + 1);
}

/** Os links e botões visíveis, na ordem do documento, como "texto|href" (o caminho do Tab). */
async function focaveisVisiveis(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('a[href], button')]
      .filter((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden')
      .map((el) => `${el.textContent?.trim()}|${el.getAttribute('href') ?? 'botão'}`),
  );
}

/** O elemento com foco, como "texto|href", e se o cabeçalho preso ao topo cobre parte dele (WCAG 2.4.11). */
async function focoAtual(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const caixaDoFoco = el.getBoundingClientRect();
    const baseDoCabecalho = document.querySelector('header')!.getBoundingClientRect().bottom;
    return {
      id: `${el.textContent?.trim()}|${el.getAttribute('href') ?? (el.tagName === 'BUTTON' ? 'botão' : el.tagName)}`,
      cobertoPeloCabecalho: !el.closest('header') && caixaDoFoco.top < baseDoCabecalho - 1,
    };
  });
}

test.describe('Âncora e foco abaixo do cabeçalho, qualquer que seja a altura dele (T-030)', () => {
  // Antes da T-030 o `scroll-padding-top` era fixo em 4rem (a altura do cabeçalho numa linha). Com o
  // texto a 200% numa tela estreita o cabeçalho quebra em várias linhas e fica mais alto que isso:
  // ao seguir uma âncora, o título da seção parava atrás dele. Agora a página mede a altura real do
  // cabeçalho e reserva esse espaço. A marca recebe o NOME_LONGO (cabeçalho de ~300px ou mais a
  // 200% em 360px, com qualquer fonte), para o caso difícil aparecer no Windows e no Linux do CI.

  // Achado no qa da T-029. A rolagem fica instantânea (movimento reduzido): com a rolagem suave, o
  // título passa por baixo do cabeçalho no meio da animação, e um teste que espera "o título na
  // tela" passaria por engano. A rolagem suave tem o seu próprio teste, logo abaixo.
  test('360px a 200%, com um nome longo na marca: seguir um link do menu deixa o título da seção abaixo do cabeçalho', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrirAmpliada(page);
    await trocarNomeDaMarca(page, NOME_LONGO);

    await botaoMenu(page).click();
    await navegacao(page).getByRole('link', { name: 'Sobre', exact: true }).click();
    await expect(page).toHaveURL(/#sobre$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    const secao = await medirSecao(page, 'sobre');
    expect(secao.topoDoTitulo).toBeGreaterThanOrEqual(secao.baseDoCabecalho - 1);
  });

  // Com a rolagem suave (quem não pediu movimento reduzido), descendo e subindo pela página. Em 768px
  // o menu fica em linha e o cabeçalho quebra de outro jeito. Só os quatro primeiros links: com o
  // nome longo, a lista aberta passa da janela em 360px (bug da T-024) e "Contato" não dá para tocar.
  for (const largura of [LARGURA_DO_CELULAR, 768]) {
    test(`${largura}px a 200%, com um nome longo e a rolagem suave: cada link do menu para a seção logo abaixo do cabeçalho`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await abrirAmpliada(page, largura);
      await trocarNomeDaMarca(page, NOME_LONGO);

      for (const { id, titulo } of [
        { id: 'projetos', titulo: 'Projetos' },
        { id: 'sobre', titulo: 'Sobre' },
        { id: 'stacks', titulo: 'Stacks' },
        { id: 'inicio', titulo: 'Início' },
      ]) {
        await seguirPeloMenu(page, id, titulo);
        await esperarSecaoLogoAbaixoDoCabecalho(page, id);
      }
    });
  }

  // Quem chega por um link compartilhado (/#contato) com o navegador já configurado para texto a
  // 200%: a página abre com o cabeçalho alto desde o início. O texto ampliado e o nome mais longo
  // (um complemento posto pelo CSS, `::after`) entram ANTES de o React montar a página, como uma
  // configuração do navegador; trocar o nome depois da carga não testaria a primeira medida.
  test('abrir o site em /#contato a 200% em 360px, com um nome longo na marca: o título de Contato aparece abaixo do cabeçalho', async ({ page }) => {
    await page.setViewportSize({ width: LARGURA_DO_CELULAR, height: 800 });
    await page.addInitScript((complemento) => {
      const estilo = document.createElement('style');
      estilo.textContent = `html { font-size: 200% !important; } header a[href="#inicio"]::after { content: "${complemento}"; }`;
      // O script roda antes de o HTML existir: põe o estilo assim que o <head> aparecer.
      new MutationObserver((_, observador) => {
        if (!document.head) return;
        document.head.append(estilo);
        observador.disconnect();
      }).observe(document, { childList: true, subtree: true });
    }, ` ${NOME_LONGO}`);
    await page.goto('/#contato');
    await expect(page.getByRole('heading', { name: ptBR.secoes.contato, exact: true })).toBeVisible();
    await esperarRolagemParar(page);

    const m = await medirAncora(page, 'contato');
    // O estilo valeu (o cabeçalho quebrou em várias linhas, mais alto que os 4rem de uma linha só)
    // e a página rolou até a seção.
    const alturaDeUmaLinha = await page.evaluate(() => 4 * parseFloat(getComputedStyle(document.documentElement).fontSize));
    expect(m.baseDoCabecalho, 'o cabeçalho deveria estar em várias linhas').toBeGreaterThan(alturaDeUmaLinha + 1);
    expect(m.rolagemVertical).toBeGreaterThan(0);
    expect(m.topoDaSecao, 'a seção começa atrás do cabeçalho').toBeGreaterThanOrEqual(m.baseDoCabecalho - 1);
    expect(m.topoDoTitulo, 'o título fica atrás do cabeçalho').toBeGreaterThanOrEqual(m.baseDoCabecalho - 1);
    expect(m.baseDoTitulo, 'o título fica abaixo da janela').toBeLessThanOrEqual(m.alturaDaJanela + 1);
  });

  // Tab e Shift+Tab rolam a página até o elemento focado, respeitando o mesmo `scroll-padding-top`.
  // O Shift+Tab (subindo) era o caso que deixava o foco atrás do cabeçalho alto. Movimento reduzido:
  // a rolagem até o foco é imediata, e a medida não pega a página no meio da animação.
  test('360px a 200%, com um nome longo na marca: Tab até o fim e Shift+Tab de volta, sem o foco ficar atrás do cabeçalho', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrirAmpliada(page);
    await trocarNomeDaMarca(page, NOME_LONGO);
    const esperados = await focaveisVisiveis(page);
    expect(esperados.length).toBeGreaterThan(10);

    for (const [i, esperado] of esperados.entries()) {
      await page.keyboard.press('Tab');
      const foco = await focoAtual(page);
      expect(foco.id, `Tab nº ${i + 1}`).toBe(esperado);
      expect(foco.cobertoPeloCabecalho, `${foco.id} atrás do cabeçalho (Tab)`).toBe(false);
    }
    for (const esperado of [...esperados].reverse().slice(1)) {
      await page.keyboard.press('Shift+Tab');
      const foco = await focoAtual(page);
      expect(foco.id).toBe(esperado);
      expect(foco.cobertoPeloCabecalho, `${foco.id} atrás do cabeçalho (Shift+Tab)`).toBe(false);
    }
  });

  // A altura do cabeçalho muda com a página aberta (tela girada, janela redimensionada): o espaço
  // reservado acompanha, para mais e para menos. Em 1440px o cabeçalho fica mais baixo; se o espaço
  // ficasse o de 360px, a seção pararia longe do cabeçalho, com um vão no meio.
  test('mudar a largura com a página aberta (360px → 1440px → 360px a 200%, nome longo): a seção continua parando logo abaixo do cabeçalho', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrirAmpliada(page);
    await trocarNomeDaMarca(page, NOME_LONGO);
    const alturaEstreita = (await caixa(cabecalho(page))).altura;

    await seguirPeloMenu(page, 'sobre', 'Sobre');
    await esperarSecaoLogoAbaixoDoCabecalho(page, 'sobre');

    await page.setViewportSize({ width: 1440, height: 800 });
    await expect.poll(async () => (await caixa(cabecalho(page))).altura, 'em 1440px o cabeçalho deveria ficar mais baixo').toBeLessThan(alturaEstreita - 1);
    await seguirPeloMenu(page, 'projetos', 'Projetos');
    await esperarSecaoLogoAbaixoDoCabecalho(page, 'projetos');

    await page.setViewportSize({ width: LARGURA_DO_CELULAR, height: 800 });
    await expect.poll(async () => (await caixa(cabecalho(page))).altura).toBeCloseTo(alturaEstreita, 0);
    await seguirPeloMenu(page, 'stacks', 'Stacks');
    await esperarSecaoLogoAbaixoDoCabecalho(page, 'stacks');
  });

  // Regressão: no tamanho normal o cabeçalho tem uma linha (4rem + 1px de borda) e a seção continua
  // parando logo abaixo dele, do celular ao desktop largo.
  test('tamanho normal, de 360px a 1440px: cada link do menu para a seção logo abaixo do cabeçalho', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const largura of [LARGURA_DO_CELULAR, 768, 1440]) {
      await page.setViewportSize({ width: largura, height: 800 });
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
      for (const { id, titulo } of [
        { id: 'projetos', titulo: 'Projetos' },
        { id: 'sobre', titulo: 'Sobre' },
        { id: 'stacks', titulo: 'Stacks' },
      ]) {
        await seguirPeloMenu(page, id, titulo);
        await esperarSecaoLogoAbaixoDoCabecalho(page, id);
      }
    }
  });
});

test.describe('Cabeçalho em várias linhas a 200%: bug conhecido (achado da T-029)', () => {
  // O bug só aparece quando o cabeçalho fica alto, o que depende da fonte e do nome: com a DejaVu
  // Sans (CI) e "George Siqueira", o cabeçalho tem ~249px e o bug aparece; com a Segoe UI (Windows),
  // ~201px e não aparece. Por isso a marca recebe o NOME_LONGO (cabeçalho de ~300px ou mais) e o
  // teste confere a condição do bug ANTES do `test.fail()`: se ela não valer, o teste falha de
  // verdade (não "como esperado"). Assim o "Expected to fail, but passed" só aparece quando o bug
  // for corrigido, e aí é hora de tirar o `test.fail()`.

  // BUG CONHECIDO (achado no qa da T-029; mesma causa da T-024): a lista aberta é `position:
  // absolute` dentro do cabeçalho preso ao topo (sticky), então rolar a página não a move. Com o
  // cabeçalho em várias linhas, a lista começa mais abaixo e, em 360x800 com o texto a 200%, o
  // último link ("Contato") termina abaixo da janela, sem como rolar até ele.
  // Esperado: todos os links inteiros na tela (ou a lista rolando por dentro). Obtido: "Contato" vai
  // até y≈841 (DejaVu Sans, "George Siqueira") ou y≈937 (NOME_LONGO).
  test('360x800 a 200%, com um nome longo na marca: a lista aberta cabe na tela ou rola por dentro', async ({ page }) => {
    await abrirAmpliada(page);
    await trocarNomeDaMarca(page, NOME_LONGO);
    await botaoMenu(page).click();
    const links = navegacao(page).getByRole('link');
    await expect(links).toHaveCount(6);

    // Condição do bug: o cabeçalho e os seis links, um embaixo do outro, somam mais que a altura da
    // janela. Só cabe tudo se a lista rolar por dentro (ou mudar de forma).
    const baseDoCabecalho = (await caixa(cabecalho(page))).base;
    const alturaDosLinks = (await links.evaluateAll((lista) => lista.map((el) => el.getBoundingClientRect().height))).reduce((soma, altura) => soma + altura, 0);
    const alturaDaJanela = await page.evaluate(() => window.innerHeight);
    expect(baseDoCabecalho + alturaDosLinks, 'o cabeçalho e os links deveriam somar mais que a janela').toBeGreaterThan(alturaDaJanela);

    test.fail();
    const ultimo = navegacao(page).getByRole('link', { name: 'Contato', exact: true });
    await ultimo.scrollIntoViewIfNeeded();
    await expect(ultimo).toBeInViewport({ ratio: 1, timeout: 2000 });
  });
});
