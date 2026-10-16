// Testes de aceitação do layout base (T-007): menu por âncoras, navegação por teclado,
// HTML semântico (RNF-02) e ausência de rolagem horizontal de 360px a 1280px+ (RNF-01).
// Cada teste roda nos dois projetos do playwright.config.ts (celular e desktop); os que só
// fazem sentido num deles usam o `isMobile` do Playwright para pular o outro.
import type { Locator, Page } from '@playwright/test';
import { ptBR } from '../../apps/web/src/conteudo/pt-BR';
import { contraste } from '../apoio/cores';
import { esperarFocoVisivel, esperarSecaoNaTela, medirEstouroHorizontal, medirSecao } from '../apoio/pagina';
import { expect, test } from '../apoio/teste';

/** As seis seções de RF-01, na ordem do menu: `id` da seção e texto do link. */
const SECOES = [
  { id: 'inicio', titulo: 'Início' },
  { id: 'sobre', titulo: 'Sobre' },
  { id: 'stacks', titulo: 'Stacks' },
  { id: 'projetos', titulo: 'Projetos' },
  { id: 'servicos', titulo: 'Serviços' },
  { id: 'contato', titulo: 'Contato' },
] as const;

function navegacao(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Navegação principal' });
}

/** A marca no cabeçalho: o nome do George, lido do arquivo de conteúdo (RF-09), leva ao Início. */
function marca(page: Page): Locator {
  return page.getByRole('banner').getByRole('link', { name: ptBR.pessoa.nome, exact: true });
}

function botaoMenu(page: Page): Locator {
  return navegacao(page).getByRole('button', { name: 'Menu' });
}

/**
 * Os links do menu, inclusive os escondidos. O `getByRole` ignora elementos ocultos,
 * então, para conferir que estão ocultos, buscamos pelo seletor CSS.
 */
function linksDoMenu(page: Page): Locator {
  return navegacao(page).locator('a');
}

function linkDoMenu(page: Page, titulo: string): Locator {
  return navegacao(page).getByRole('link', { name: titulo, exact: true });
}

test.describe('layout base: estrutura semântica (RNF-02)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('tem cabeçalho com a navegação principal, um main e um rodapé', async ({ page }) => {
    // Papéis ARIA implícitos: <header> = banner, <nav> = navigation, <main> = main, <footer> = contentinfo.
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('contentinfo')).toHaveCount(1);
    await expect(navegacao(page)).toHaveCount(1);
    // A navegação fica dentro do cabeçalho.
    await expect(page.getByRole('banner').getByRole('navigation')).toHaveCount(1);
    await expect(page.locator('header, nav, main, footer')).toHaveCount(4);
  });

  test('tem as seis seções, com id e nome, dentro do main e na ordem do menu', async ({ page }) => {
    const secoes = page.locator('main > section');
    await expect(secoes).toHaveCount(SECOES.length);

    for (const [posicao, { id, titulo }] of SECOES.entries()) {
      const secao = secoes.nth(posicao);
      await expect(secao).toHaveAttribute('id', id);
      // Cada <section> tem nome (aria-labelledby) e por isso vira uma "região" para o leitor de tela.
      // A região Início tem o nome do <h1> da página.
      const nome = id === 'inicio' ? ptBR.pessoa.nome : titulo;
      await expect(page.getByRole('region', { name: nome, exact: true })).toHaveAttribute('id', id);
    }
  });

  test('cada link do menu aponta para uma seção que existe', async ({ page }) => {
    const links = linksDoMenu(page);
    await expect(links).toHaveCount(SECOES.length);

    for (const [posicao, { id, titulo }] of SECOES.entries()) {
      await expect(links.nth(posicao)).toHaveText(titulo);
      await expect(links.nth(posicao)).toHaveAttribute('href', `#${id}`);
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
  });
});

test.describe('layout base: navegação pelo menu (RF-01)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('cada link leva à sua seção, sem o cabeçalho cobrir o título', async ({ page, isMobile }) => {
    // Começa no fim da página, para que até o link "Início" precise rolar.
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));

    for (const { id, titulo } of SECOES) {
      if (isMobile) {
        await botaoMenu(page).click();
      }
      await linkDoMenu(page, titulo).click();

      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await esperarSecaoNaTela(page, id);
      if (id === 'inicio') {
        // Volta ao topo. Tolera 1px: o cabeçalho tem 4rem + 1px de borda e o scroll-padding-top, 4rem.
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
      }
      if (isMobile) {
        // Escolher uma seção fecha a lista.
        await expect(botaoMenu(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(linksDoMenu(page).first()).toBeHidden();
      }
    }
  });

  test('o cabeçalho e o menu continuam visíveis ao rolar a página', async ({ page, isMobile }) => {
    await page.mouse.wheel(0, 5000);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    // Preso ao topo (sticky): mesmo com a página rolada, o cabeçalho fica em y = 0.
    const medidas = await medirSecao(page, 'contato');
    expect(medidas.rolagemVertical).toBeGreaterThan(0);
    expect(Math.abs(medidas.topoDoCabecalho)).toBeLessThanOrEqual(1);
    await expect(page.getByRole('banner')).toBeInViewport();

    // E o menu continua utilizável dali.
    if (isMobile) {
      await expect(botaoMenu(page)).toBeInViewport();
      await botaoMenu(page).click();
    }
    await expect(linkDoMenu(page, 'Sobre')).toBeInViewport();
    await linkDoMenu(page, 'Sobre').click();
    await esperarSecaoNaTela(page, 'sobre');
  });

  test('abrir a página já numa âncora mostra a seção abaixo do cabeçalho', async ({ page }) => {
    await page.goto('/#servicos');
    await esperarSecaoNaTela(page, 'servicos');
  });
});

test.describe('layout base: menu compacto no celular', () => {
  test.skip(({ isMobile }) => !isMobile, 'comportamento só do celular');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('começa fechado: o botão Menu aparece e os links ficam ocultos', async ({ page }) => {
    await expect(botaoMenu(page)).toBeVisible();
    await expect(botaoMenu(page)).toHaveAttribute('aria-expanded', 'false');
    // aria-controls liga o botão à lista que ele abre.
    const idDaLista = await botaoMenu(page).getAttribute('aria-controls');
    expect(idDaLista).toBeTruthy();
    await expect(page.locator(`[id="${idDaLista}"]`)).toBeHidden();

    await expect(linksDoMenu(page)).toHaveCount(SECOES.length);
    for (const link of await linksDoMenu(page).all()) {
      await expect(link).toBeHidden();
    }
  });

  test('o botão Menu abre e fecha a lista', async ({ page }) => {
    await botaoMenu(page).click();
    await expect(botaoMenu(page)).toHaveAttribute('aria-expanded', 'true');
    for (const { titulo } of SECOES) {
      await expect(linkDoMenu(page, titulo)).toBeInViewport();
    }

    await botaoMenu(page).click();
    await expect(botaoMenu(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(linksDoMenu(page).first()).toBeHidden();
  });

  test('Esc fecha a lista e devolve o foco ao botão', async ({ page }) => {
    await botaoMenu(page).click();
    // Com o foco num link da lista aberta (o caso mais comum de quem usa teclado).
    await linkDoMenu(page, 'Stacks').focus();
    await page.keyboard.press('Escape');

    await expect(botaoMenu(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(linksDoMenu(page).first()).toBeHidden();
    await expect(botaoMenu(page)).toBeFocused();
  });

  test('pelo teclado: Tab chega ao botão, Enter abre, Tab percorre os links com foco visível', async ({ page }) => {
    await page.keyboard.press('Tab');
    await esperarFocoVisivel(marca(page));
    await page.keyboard.press('Tab');
    await esperarFocoVisivel(botaoMenu(page));

    // Com a lista fechada, o próximo Tab não entra nos links escondidos.
    await page.keyboard.press('Tab');
    expect(await linksDoMenu(page).evaluateAll((links) => links.includes(document.activeElement as HTMLAnchorElement))).toBe(false);

    await page.keyboard.press('Shift+Tab');
    await esperarFocoVisivel(botaoMenu(page));
    await page.keyboard.press('Enter');
    await expect(botaoMenu(page)).toHaveAttribute('aria-expanded', 'true');

    for (const { titulo } of SECOES) {
      await page.keyboard.press('Tab');
      await esperarFocoVisivel(linkDoMenu(page, titulo));
    }

    // Enter no link escolhido leva à seção e fecha a lista.
    await page.keyboard.press('Shift+Tab');
    await esperarFocoVisivel(linkDoMenu(page, 'Serviços'));
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#servicos$/);
    await esperarSecaoNaTela(page, 'servicos');
    await expect(botaoMenu(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('a lista aberta cabe na tela, sem rolagem horizontal, e fica abaixo do cabeçalho', async ({ page }) => {
    await botaoMenu(page).click();
    const medidas = await medirEstouroHorizontal(page);
    expect(medidas.estourados).toEqual([]);
    expect(medidas.larguraDoConteudo).toBeLessThanOrEqual(medidas.larguraDaTela);

    const cabecalho = await page.getByRole('banner').boundingBox();
    const lista = await linksDoMenu(page).first().locator('xpath=ancestor::ul').boundingBox();
    expect(lista!.y).toBeGreaterThanOrEqual(cabecalho!.y + cabecalho!.height - 1);
  });
});

test.describe('layout base: menu em linha no desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'comportamento só do desktop');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('o botão Menu fica oculto e os links aparecem em linha', async ({ page }) => {
    await expect(linksDoMenu(page)).toHaveCount(SECOES.length);
    await expect(botaoMenu(page)).toBeHidden();

    const caixas = [];
    for (const { titulo } of SECOES) {
      const link = linkDoMenu(page, titulo);
      await expect(link).toBeVisible();
      caixas.push((await link.boundingBox())!);
    }
    // Em linha: todos na mesma altura, um à direita do outro.
    for (let i = 1; i < caixas.length; i++) {
      expect(Math.abs(caixas[i].y - caixas[0].y)).toBeLessThanOrEqual(1);
      expect(caixas[i].x).toBeGreaterThan(caixas[i - 1].x);
    }
  });

  test('pelo teclado: Tab percorre a marca e os seis links com foco visível; Enter leva à seção', async ({ page }) => {
    await page.keyboard.press('Tab');
    await esperarFocoVisivel(marca(page));
    for (const { titulo } of SECOES) {
      await page.keyboard.press('Tab');
      await esperarFocoVisivel(linkDoMenu(page, titulo));
    }

    // Volta até "Projetos" e segue o link com Enter.
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await esperarFocoVisivel(linkDoMenu(page, 'Projetos'));
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#projetos$/);
    await esperarSecaoNaTela(page, 'projetos');
  });
});

test.describe('layout base: contraste do cabeçalho', () => {
  test('links, botão e contorno de foco têm contraste suficiente sobre o fundo do cabeçalho', async ({ page, isMobile }) => {
    await page.goto('/');
    const fundoDoCabecalho = await page.getByRole('banner').evaluate((el) => getComputedStyle(el).backgroundColor);

    if (isMobile) {
      const corDoBotao = await botaoMenu(page).evaluate((el) => getComputedStyle(el).color);
      expect(contraste(corDoBotao, fundoDoCabecalho)).toBeGreaterThanOrEqual(4.5);
      await botaoMenu(page).click();
    }
    // A lista aberta no celular tem fundo próprio; no desktop ela é transparente (vale o do cabeçalho).
    const lista = linksDoMenu(page).first().locator('xpath=ancestor::ul');
    const fundoDaLista = await lista.evaluate((el) => getComputedStyle(el).backgroundColor);
    const fundoDosLinks = fundoDaLista === 'rgba(0, 0, 0, 0)' ? fundoDoCabecalho : fundoDaLista;

    for (const { titulo } of SECOES) {
      const link = linkDoMenu(page, titulo);
      const corDoLink = await link.evaluate((el) => getComputedStyle(el).color);
      // WCAG AA: 4,5:1 para texto normal.
      expect(contraste(corDoLink, fundoDosLinks), titulo).toBeGreaterThanOrEqual(4.5);
    }

    // WCAG 1.4.11: indicadores visuais como o contorno de foco pedem pelo menos 3:1.
    const link = linkDoMenu(page, 'Sobre');
    await link.focus();
    const corDoFoco = await link.evaluate((el) => getComputedStyle(el).outlineColor);
    expect(contraste(corDoFoco, fundoDosLinks)).toBeGreaterThanOrEqual(3);
  });
});

test.describe('layout base: sem rolagem horizontal de 360px a 1280px+ (RNF-01)', () => {
  // 360px é o menor celular de RNF-01; 767/768px são os dois lados do ponto de quebra do menu (48rem).
  const LARGURAS = [360, 390, 412, 600, 767, 768, 1024, 1280, 1440, 1920];

  for (const largura of LARGURAS) {
    test(`${largura}px: nada passa da largura da tela`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 800 });
      await page.goto('/');

      const medidas = await medirEstouroHorizontal(page);
      expect(medidas.larguraDaTela).toBe(largura);
      expect(medidas.estourados, 'elementos além da borda da tela').toEqual([]);
      expect(medidas.larguraDoConteudo).toBeLessThanOrEqual(medidas.larguraDaTela);

      // Abaixo de 48rem o menu é compacto; aberto, ele também precisa caber.
      if (largura < 768) {
        await expect(botaoMenu(page)).toBeVisible();
        await botaoMenu(page).click();
        const comMenuAberto = await medirEstouroHorizontal(page);
        expect(comMenuAberto.estourados, 'elementos além da borda com o menu aberto').toEqual([]);
        expect(comMenuAberto.larguraDoConteudo).toBeLessThanOrEqual(comMenuAberto.larguraDaTela);
      } else {
        await expect(botaoMenu(page)).toBeHidden();
        await expect(linkDoMenu(page, 'Contato')).toBeVisible();
      }
    });
  }
});

test.describe('navegação: bordas e regressão (pente-fino da T-016)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  /** Clica no link do menu, abrindo a lista antes quando está no celular. */
  async function irPeloMenu(page: Page, titulo: string, isMobile: boolean) {
    if (isMobile) await botaoMenu(page).click();
    await linkDoMenu(page, titulo).click();
  }

  test('a marca (nome do George) no cabeçalho leva de volta ao Início', async ({ page }) => {
    await page.goto('/#contato');
    await esperarSecaoNaTela(page, 'contato');

    await expect(marca(page)).toHaveAttribute('href', '#inicio');
    await marca(page).click();
    await expect(page).toHaveURL(/#inicio$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
  });

  test('o botão Voltar do navegador volta à seção anterior', async ({ page, isMobile }) => {
    await irPeloMenu(page, 'Sobre', isMobile);
    await esperarSecaoNaTela(page, 'sobre');
    await irPeloMenu(page, 'Contato', isMobile);
    await esperarSecaoNaTela(page, 'contato');

    await page.goBack();
    await expect(page).toHaveURL(/#sobre$/);
    await esperarSecaoNaTela(page, 'sobre');
  });

  test('recarregar a página numa âncora mantém a seção na tela', async ({ page }) => {
    await page.goto('/#projetos');
    await esperarSecaoNaTela(page, 'projetos');
    await page.reload();
    await expect(page).toHaveURL(/#projetos$/);
    await esperarSecaoNaTela(page, 'projetos');
  });

  test('âncora que não existe abre a página no topo, sem erro', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (erro) => erros.push(erro.message));
    await page.goto('/#secao-que-nao-existe');
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(erros).toEqual([]);
  });

  test('no celular, Esc com a lista fechada não abre o menu nem tira o foco do lugar', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'comportamento só do celular');
    await botaoMenu(page).focus();
    await page.keyboard.press('Escape');
    await expect(botaoMenu(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(botaoMenu(page)).toBeFocused();
  });

  test('girar ou redimensionar a tela troca entre menu compacto e menu em linha sem travar', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'começa no celular e alarga a tela');
    await botaoMenu(page).click();
    await expect(botaoMenu(page)).toHaveAttribute('aria-expanded', 'true');

    // Largura de desktop: o botão some e os links ficam em linha, visíveis.
    await page.setViewportSize({ width: 1024, height: 800 });
    await expect(botaoMenu(page)).toBeHidden();
    for (const { titulo } of SECOES) {
      await expect(linkDoMenu(page, titulo)).toBeVisible();
    }
    expect((await medirEstouroHorizontal(page)).estourados).toEqual([]);

    // De volta ao celular: o botão volta e continua abrindo e fechando a lista.
    await page.setViewportSize({ width: 412, height: 800 });
    await expect(botaoMenu(page)).toBeVisible();
    await botaoMenu(page).click();
    await expect(botaoMenu(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(linksDoMenu(page).first()).toBeHidden();
  });

  // BUG CONHECIDO (T-016): no celular, com a lista do menu aberta, tocar na marca (nome do George)
  // leva ao Início mas a lista continua aberta, cobrindo o começo da página. Os links do menu fecham
  // a lista ao serem escolhidos; a marca, que também navega, não fecha (o `fechar` do Menu só está
  // ligado aos links da lista). Esperado: lista fechada (aria-expanded="false"). Obtido: "true".
  test('no celular, tocar na marca com a lista aberta fecha o menu', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'comportamento só do celular');
    test.fail();
    await page.goto('/#contato');
    await botaoMenu(page).click();
    await marca(page).click();
    await expect(page).toHaveURL(/#inicio$/);
    await expect(botaoMenu(page)).toHaveAttribute('aria-expanded', 'false', { timeout: 2000 });
  });
});

test.describe('abrir o site direto numa âncora (achado da T-012, pente-fino da T-016)', () => {
  // Sem beforeEach: aqui o endereço com âncora é a PRIMEIRA visita da página (como quem abre um
  // link compartilhado). O teste "abrir a página já numa âncora..." acima não pega o problema
  // porque o beforeEach dele abre "/" antes, e o segundo goto só troca a âncora na mesma página.
  //
  // BUG CONHECIDO (T-016): abrir o site direto em /#servicos (ou qualquer outra seção) deixa a
  // página no topo. O navegador procura a âncora quando o HTML chega, mas as seções só existem
  // depois que o React monta a página; ninguém rola até ela depois disso.
  // Esperado: o título da seção abaixo do cabeçalho, como ao clicar no menu. Obtido: rolagem 0
  // (o título de Serviços fica ~2.500 px abaixo da janela).
  for (const id of ['servicos', 'contato'] as const) {
    test(`abrir /#${id} numa visita nova mostra a seção na tela`, async ({ page }) => {
      test.fail();
      await page.goto(`/#${id}`);
      await esperarSecaoNaTela(page, id);
    });
  }
});

test.describe('menu do celular em paisagem com pouca altura (pente-fino da T-016)', () => {
  test.skip(({ isMobile }) => !isMobile, 'comportamento só do celular');

  test('640x360 (celular comum deitado): a lista aberta cabe inteira na tela', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('/');
    await botaoMenu(page).click();
    for (const { titulo } of SECOES) {
      await expect(linkDoMenu(page, titulo)).toBeInViewport({ ratio: 1 });
    }
  });

  // BUG CONHECIDO (T-016): com a tela mais baixa que o cabeçalho + a lista (~360 px), como um
  // celular pequeno deitado (568x320), o fim da lista fica fora da janela e não há como rolar até
  // ele: a lista é `position: absolute` dentro do cabeçalho preso ao topo (sticky), então rolar a
  // página não a move. Esperado: todos os links inteiros na tela (ou a lista rolando por dentro).
  // Obtido: o link "Contato" termina em y=360, abaixo da janela de 320 px (só ~8 px dele aparecem).
  test('568x320 (celular pequeno deitado): a lista aberta cabe na tela ou rola por dentro', async ({ page }) => {
    test.fail();
    await page.setViewportSize({ width: 568, height: 320 });
    await page.goto('/');
    await botaoMenu(page).click();
    const ultimo = linkDoMenu(page, SECOES[SECOES.length - 1].titulo);
    await ultimo.scrollIntoViewIfNeeded();
    await expect(ultimo).toBeInViewport({ ratio: 1, timeout: 2000 });
  });
});
