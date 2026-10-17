// Testes de aceitação das seções com conteúdo estático (T-008): Início (RF-02), Sobre (RF-03),
// Serviços (RF-07), Contato (RF-08) e textos vindos do arquivo de conteúdo (RF-09).
// Os textos esperados são lidos do próprio arquivo de conteúdo: quando o George trocar uma
// frase ou o endereço do LinkedIn lá, estes testes continuam valendo sem mudança.
// Cada teste roda nos dois projetos do playwright.config.ts (celular e desktop).
import type { Locator, Page } from '@playwright/test';
import { ptBR } from '../../apps/web/src/conteudo/pt-BR';
import { PROJETOS_DE_EXEMPLO, simularApi } from '../apoio/api';
import { contraste } from '../apoio/cores';
import {
  ENDERECO_LONGO,
  esperarFocoVisivel,
  esperarSecaoNaTela,
  larguras,
  medirEstouroHorizontal,
  medirTexto,
  PALAVRA_LONGA,
  trocarTexto,
} from '../apoio/pagina';
import { expect, test } from '../apoio/teste';

const { pessoa, inicio, sobre, servicos, contato, links, secoes, geral } = ptBR;

function regiao(page: Page, nome: string): Locator {
  return page.getByRole('region', { name: nome, exact: true });
}

/** Link pelo texto visível. O nome acessível dos links externos termina com o aviso de nova aba. */
function link(dentroDe: Locator, texto: string): Locator {
  return dentroDe.getByRole('link', { name: texto });
}

/**
 * Aperta Tab até o elemento receber o foco (como faz quem navega pelo teclado).
 * Falha se não chegar nele em `limite` passos.
 */
async function tabAte(page: Page, alvo: Locator, limite = 40) {
  for (let passo = 0; passo < limite; passo++) {
    await page.keyboard.press('Tab');
    if (await alvo.evaluate((el) => el === document.activeElement)) {
      return;
    }
  }
  throw new Error(`o Tab não chegou ao elemento em ${limite} passos`);
}

/**
 * Responde às páginas de fora do site (LinkedIn, GitHub) com uma página vazia, para os testes
 * de "abre em nova aba" não dependerem da internet nem dos sites de terceiros.
 */
async function simularSitesExternos(page: Page) {
  await page
    .context()
    .route(
      (url) => url.hostname !== 'localhost',
      (rota) => rota.fulfill({ contentType: 'text/html', body: '<title>site externo</title>' }),
    );
}

/** Clica no link e devolve a nova aba aberta por ele, já com o endereço carregado. */
async function abrirEmNovaAba(page: Page, alvo: Locator): Promise<Page> {
  const [novaAba] = await Promise.all([page.context().waitForEvent('page'), alvo.click()]);
  await novaAba.waitForLoadState();
  return novaAba;
}

/** Confere os atributos de um link externo seguro e acessível (RF-03, RF-08). */
async function conferirLinkExterno(alvo: Locator, endereco: string) {
  await expect(alvo).toBeVisible();
  await expect(alvo).toHaveAttribute('href', endereco);
  await expect(alvo).toHaveAttribute('target', '_blank');
  // `noopener`: a aba nova não controla esta; `noreferrer`: não recebe o endereço de origem.
  await expect(alvo).toHaveAttribute('rel', /\bnoopener\b/);
  await expect(alvo).toHaveAttribute('rel', /\bnoreferrer\b/);
  // Quem usa leitor de tela ouve o aviso de nova aba no nome do link.
  await expect(alvo).toHaveAccessibleName(new RegExp(`${geral.abreEmNovaAba.replace(/[()]/g, '\\$&')}$`));
}

async function corDeFundoDaPagina(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

async function corDoTexto(elemento: Locator): Promise<string> {
  return elemento.evaluate((el) => getComputedStyle(el).color);
}

test.describe('Início (RF-02)', () => {
  // Telas de RNF-01 (360px é o menor celular) até o desktop largo, em pé.
  const TELAS = [
    { largura: 360, altura: 640 },
    { largura: 390, altura: 844 },
    { largura: 768, altura: 1024 },
    { largura: 1280, altura: 720 },
    { largura: 1920, altura: 1080 },
  ];

  for (const { largura, altura } of TELAS) {
    test(`${largura}x${altura}: nome, título, frase e atalhos aparecem sem rolar`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: altura });
      await page.goto('/');
      expect(await page.evaluate(() => window.scrollY)).toBe(0);

      const secao = regiao(page, pessoa.nome);
      const elementos = [
        secao.getByRole('heading', { level: 1, name: pessoa.nome }),
        secao.getByText(inicio.tituloProfissional, { exact: true }),
        secao.getByText(inicio.frase, { exact: true }),
        secao.getByRole('link', { name: inicio.atalhoProjetos }),
        secao.getByRole('link', { name: inicio.atalhoContato }),
      ];
      const baseDoCabecalho = (await page.getByRole('banner').boundingBox())!;
      for (const elemento of elementos) {
        // Inteiro na janela (ratio 1) e abaixo do cabeçalho preso ao topo.
        await expect(elemento).toBeInViewport({ ratio: 1 });
        const caixa = (await elemento.boundingBox())!;
        expect(caixa.y).toBeGreaterThanOrEqual(baseDoCabecalho.y + baseDoCabecalho.height - 1);
      }
    });
  }

  test('os atalhos levam às seções Projetos e Contato', async ({ page }) => {
    await page.goto('/');
    const secao = regiao(page, pessoa.nome);

    await expect(secao.getByRole('link', { name: inicio.atalhoProjetos })).toHaveAttribute('href', '#projetos');
    await secao.getByRole('link', { name: inicio.atalhoProjetos }).click();
    await expect(page).toHaveURL(/#projetos$/);
    await esperarSecaoNaTela(page, 'projetos');

    await page.goto('/');
    await expect(secao.getByRole('link', { name: inicio.atalhoContato })).toHaveAttribute('href', '#contato');
    await secao.getByRole('link', { name: inicio.atalhoContato }).click();
    await expect(page).toHaveURL(/#contato$/);
    await esperarSecaoNaTela(page, 'contato');
  });

  test('pelo teclado: Tab chega aos atalhos com foco visível e Enter leva à seção', async ({ page }) => {
    await page.goto('/');
    const secao = regiao(page, pessoa.nome);
    const atalhoProjetos = secao.getByRole('link', { name: inicio.atalhoProjetos });
    const atalhoContato = secao.getByRole('link', { name: inicio.atalhoContato });

    await tabAte(page, atalhoProjetos);
    await esperarFocoVisivel(atalhoProjetos);
    await page.keyboard.press('Tab');
    await esperarFocoVisivel(atalhoContato);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#contato$/);
    await esperarSecaoNaTela(page, 'contato');
  });

  test('título, frase e atalhos têm contraste suficiente (WCAG AA)', async ({ page }) => {
    await page.goto('/');
    const fundo = await corDeFundoDaPagina(page);
    const secao = regiao(page, pessoa.nome);

    expect(contraste(await corDoTexto(secao.getByText(inicio.tituloProfissional, { exact: true })), fundo)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(await corDoTexto(secao.getByText(inicio.frase, { exact: true })), fundo)).toBeGreaterThanOrEqual(4.5);

    // O atalho principal é preenchido: o texto é medido contra o fundo do próprio botão.
    const principal = secao.getByRole('link', { name: inicio.atalhoProjetos });
    const fundoDoPrincipal = await principal.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(contraste(await corDoTexto(principal), fundoDoPrincipal)).toBeGreaterThanOrEqual(4.5);
    // O secundário só tem contorno: o texto fica sobre o fundo da página.
    const secundario = secao.getByRole('link', { name: inicio.atalhoContato });
    expect(contraste(await corDoTexto(secundario), fundo)).toBeGreaterThanOrEqual(4.5);
  });
});

test.describe('Sobre (RF-03)', () => {
  test.beforeEach(async ({ page }) => {
    await simularSitesExternos(page);
    await page.goto('/#sobre');
  });

  test('mostra o resumo profissional', async ({ page }) => {
    const secao = regiao(page, secoes.sobre);
    for (const paragrafo of sobre.paragrafos) {
      await expect(secao.getByText(paragrafo, { exact: true })).toBeVisible();
    }
    expect(contraste(await corDoTexto(secao.getByText(sobre.paragrafos[0], { exact: true })), await corDeFundoDaPagina(page))).toBeGreaterThanOrEqual(4.5);
  });

  test('os links do LinkedIn e do GitHub apontam para os perfis, com nova aba segura', async ({ page }) => {
    const secao = regiao(page, secoes.sobre);
    await conferirLinkExterno(link(secao, sobre.linkLinkedin), links.linkedin);
    await conferirLinkExterno(link(secao, sobre.linkGithub), links.github);
  });

  test('clicar nos links abre os perfis em nova aba, sem sair do site', async ({ page }) => {
    const secao = regiao(page, secoes.sobre);
    for (const [texto, endereco] of [
      [sobre.linkLinkedin, links.linkedin],
      [sobre.linkGithub, links.github],
    ]) {
      const novaAba = await abrirEmNovaAba(page, link(secao, texto));
      expect(novaAba.url()).toBe(endereco);
      await novaAba.close();
      // A aba do site continua no mesmo endereço.
      await expect(page).toHaveURL(/\/#sobre$/);
    }
  });
});

test.describe('Serviços (RF-07)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#servicos');
  });

  test('mostra o que é oferecido, para quem e como funciona', async ({ page }) => {
    const secao = regiao(page, secoes.servicos);
    for (const bloco of [servicos.oQueOfereco, servicos.paraQuem, servicos.comoFunciona]) {
      // Subtítulos <h3> abaixo do <h2> da seção: hierarquia que o leitor de tela usa para navegar.
      await expect(secao.getByRole('heading', { level: 3, name: bloco.titulo })).toBeVisible();
    }
    for (const item of servicos.oQueOfereco.itens) {
      await expect(secao.getByRole('listitem').filter({ hasText: item })).toBeVisible();
    }
    await expect(secao.getByText(servicos.paraQuem.texto, { exact: true })).toBeVisible();
    // Os passos são uma lista numerada (<ol>), na ordem do arquivo de conteúdo.
    const passos = secao.locator('ol > li');
    await expect(passos).toHaveText([...servicos.comoFunciona.itens]);
  });

  test('o botão leva à seção Contato', async ({ page }) => {
    const botao = regiao(page, secoes.servicos).getByRole('link', { name: servicos.botaoContato });
    await expect(botao).toHaveAttribute('href', '#contato');
    await botao.click();
    await expect(page).toHaveURL(/#contato$/);
    await esperarSecaoNaTela(page, 'contato');
  });

  test('pelo teclado: o botão recebe foco visível e Enter leva ao Contato', async ({ page }) => {
    await page.goto('/');
    const botao = regiao(page, secoes.servicos).getByRole('link', { name: servicos.botaoContato });
    await tabAte(page, botao);
    await esperarFocoVisivel(botao);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#contato$/);
    await esperarSecaoNaTela(page, 'contato');
  });
});

test.describe('Contato (RF-08)', () => {
  test.beforeEach(async ({ page }) => {
    await simularSitesExternos(page);
    await page.goto('/#contato');
  });

  test('o e-mail usa mailto: com o endereço preenchido e abre na mesma aba', async ({ page }) => {
    const email = regiao(page, secoes.contato).getByRole('link', { name: contato.linkEmail, exact: true });
    await expect(email).toBeVisible();
    await expect(email).toHaveAttribute('href', `mailto:${links.email}`);
    // mailto: entrega o endereço ao programa de e-mail; não deve abrir aba nova.
    await expect(email).not.toHaveAttribute('target', /.+/);
    const destinatario = await email.evaluate((el) => new URL((el as HTMLAnchorElement).href).pathname);
    expect(destinatario).toBe(links.email);
    expect(destinatario).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  test('LinkedIn e GitHub apontam para os perfis, com nova aba segura', async ({ page }) => {
    const secao = regiao(page, secoes.contato);
    await conferirLinkExterno(link(secao, contato.linkLinkedin), links.linkedin);
    await conferirLinkExterno(link(secao, contato.linkGithub), links.github);
  });

  test('clicar no LinkedIn e no GitHub abre os perfis em nova aba', async ({ page }) => {
    const secao = regiao(page, secoes.contato);
    for (const [texto, endereco] of [
      [contato.linkLinkedin, links.linkedin],
      [contato.linkGithub, links.github],
    ]) {
      const novaAba = await abrirEmNovaAba(page, link(secao, texto));
      expect(novaAba.url()).toBe(endereco);
      await novaAba.close();
      await expect(page).toHaveURL(/\/#contato$/);
    }
  });

  test('pelo teclado: Tab percorre os três canais com foco visível', async ({ page }) => {
    await page.goto('/');
    const secao = regiao(page, secoes.contato);
    const canais = [
      link(secao, contato.linkLinkedin),
      secao.getByRole('link', { name: contato.linkEmail, exact: true }),
      link(secao, contato.linkGithub),
    ];
    await tabAte(page, canais[0], 60);
    await esperarFocoVisivel(canais[0]);
    for (const canal of canais.slice(1)) {
      await page.keyboard.press('Tab');
      await esperarFocoVisivel(canal);
    }
  });

  test('o texto e os canais têm contraste suficiente; o foco tem pelo menos 3:1', async ({ page }) => {
    const secao = regiao(page, secoes.contato);
    const fundo = await corDeFundoDaPagina(page);
    expect(contraste(await corDoTexto(secao.getByText(contato.texto, { exact: true })), fundo)).toBeGreaterThanOrEqual(4.5);
    const email = secao.getByRole('link', { name: contato.linkEmail, exact: true });
    expect(contraste(await corDoTexto(email), fundo)).toBeGreaterThanOrEqual(4.5);
    await email.focus();
    const corDoFoco = await email.evaluate((el) => getComputedStyle(el).outlineColor);
    expect(contraste(corDoFoco, fundo)).toBeGreaterThanOrEqual(3);
  });
});

test.describe('textos do arquivo de conteúdo (RF-09)', () => {
  /** Todos os textos do arquivo de conteúdo, menos os endereços (que viram `href`, não texto). */
  function textosDoConteudo(valor: unknown): string[] {
    if (typeof valor === 'string') return [valor];
    if (Array.isArray(valor)) return valor.flatMap(textosDoConteudo);
    if (valor && typeof valor === 'object') return Object.values(valor).flatMap(textosDoConteudo);
    return [];
  }

  test('cada texto do arquivo de conteúdo aparece na página', async ({ page }) => {
    await page.goto('/');
    // Ficam de fora: os textos de Projetos, que dependem da resposta da API (carregando, erro,
    // vazio, rótulos dos cards) e são conferidos estado a estado em projetos.spec.ts; e a
    // `localidade`, que não é texto da tela (é o idioma usado para formatar datas e números).
    const textos = textosDoConteudo({ ...ptBR, links: undefined, projetos: undefined, geral: { ...ptBR.geral, localidade: undefined } });
    // textContent inclui o texto oculto para leitor de tela; os aria-label entram à parte.
    const textoDaPagina = await page.evaluate(() =>
      [document.body.textContent ?? '', ...[...document.querySelectorAll('[aria-label]')].map((el) => el.getAttribute('aria-label') ?? '')].join('\n'),
    );
    const ausentes = textos.filter((texto) => !textoDaPagina.includes(texto));
    expect(ausentes, 'textos do conteúdo que não aparecem na página').toEqual([]);
  });

  test('os títulos seguem uma hierarquia sem pular níveis', async ({ page }) => {
    await page.goto('/');
    const niveis = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((titulos) => titulos.map((t) => Number(t.tagName[1])));
    expect(niveis[0]).toBe(1);
    for (let i = 1; i < niveis.length; i++) {
      expect(niveis[i], `título ${i + 1} (h${niveis[i]}) depois de um h${niveis[i - 1]}`).toBeLessThanOrEqual(niveis[i - 1] + 1);
    }
  });
});

test.describe('Sobre (RF-03): pente-fino da T-016', () => {
  test('é a região #sobre, com o título de nível 2 e os parágrafos em <p>, na ordem do arquivo', async ({ page }) => {
    await page.goto('/#sobre');
    const secao = regiao(page, secoes.sobre);
    await expect(secao).toHaveAttribute('id', 'sobre');
    await expect(secao.getByRole('heading', { level: 2, name: secoes.sobre, exact: true })).toBeVisible();
    await expect(secao.locator('p')).toHaveText([...sobre.paragrafos]);
  });

  test('pelo teclado: Tab chega ao LinkedIn e ao GitHub com foco visível', async ({ page }) => {
    await page.goto('/');
    const secao = regiao(page, secoes.sobre);
    await tabAte(page, link(secao, sobre.linkLinkedin));
    await esperarFocoVisivel(link(secao, sobre.linkLinkedin));
    await page.keyboard.press('Tab');
    await esperarFocoVisivel(link(secao, sobre.linkGithub));
  });

  test('os links têm contraste suficiente e o contorno de foco pelo menos 3:1', async ({ page }) => {
    await page.goto('/#sobre');
    const secao = regiao(page, secoes.sobre);
    const fundo = await corDeFundoDaPagina(page);
    for (const texto of [sobre.linkLinkedin, sobre.linkGithub]) {
      expect(contraste(await corDoTexto(link(secao, texto)), fundo), texto).toBeGreaterThanOrEqual(4.5);
    }
    await link(secao, sobre.linkGithub).focus();
    const corDoFoco = await link(secao, sobre.linkGithub).evaluate((el) => getComputedStyle(el).outlineColor);
    expect(contraste(corDoFoco, fundo)).toBeGreaterThanOrEqual(3);
  });
});

test.describe('Serviços (RF-07): pente-fino da T-016', () => {
  test('360px: a seção cabe na tela e o botão tem alvo de toque de pelo menos 44px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/#servicos');
    const secao = regiao(page, secoes.servicos);
    const botao = secao.getByRole('link', { name: servicos.botaoContato });
    await expect(botao).toBeVisible();
    expect((await botao.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const caixa = (await secao.boundingBox())!;
    expect(caixa.x).toBeGreaterThanOrEqual(0);
    expect(caixa.x + caixa.width).toBeLessThanOrEqual(360);
  });

  test('subtítulos, textos e o botão têm contraste suficiente (WCAG AA)', async ({ page }) => {
    await page.goto('/#servicos');
    const secao = regiao(page, secoes.servicos);
    const fundo = await corDeFundoDaPagina(page);
    const elementos = [
      secao.getByRole('heading', { level: 3, name: servicos.oQueOfereco.titulo }),
      secao.getByRole('listitem').filter({ hasText: servicos.oQueOfereco.itens[0] }),
      secao.getByText(servicos.paraQuem.texto, { exact: true }),
      secao.locator('ol > li').first(),
    ];
    for (const elemento of elementos) {
      expect(contraste(await corDoTexto(elemento), fundo)).toBeGreaterThanOrEqual(4.5);
    }
    // O botão é preenchido: o texto é medido contra o fundo dele.
    const botao = secao.getByRole('link', { name: servicos.botaoContato });
    const fundoDoBotao = await botao.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(contraste(await corDoTexto(botao), fundoDoBotao)).toBeGreaterThanOrEqual(4.5);
  });
});

// T-025: no celular a grade dos blocos de Serviços não declarava colunas; a coluna implícita
// (`auto`) cresceria com uma palavra longa. O texto é trocado direto na página, como se o George
// o tivesse escrito no arquivo de conteúdo.
test.describe('Serviços (RF-07): texto longo (T-025)', () => {
  test('360px: palavra longa no subtítulo e num item da lista quebra no bloco, sem rolagem horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/#servicos');
    const secao = regiao(page, secoes.servicos);
    // Localizados pela posição (não pelo texto, que vai mudar).
    const subtitulo = secao.getByRole('heading', { level: 3 }).first();
    const item = secao.locator('ul > li').first();
    await expect(subtitulo).toHaveText(servicos.oQueOfereco.titulo);
    await expect(item).toHaveText(servicos.oQueOfereco.itens[0]);
    await trocarTexto(subtitulo, PALAVRA_LONGA);
    await trocarTexto(item, `Sites e ${PALAVRA_LONGA}`);

    for (const elemento of [subtitulo, item]) {
      const texto = await medirTexto(elemento);
      expect(texto.cabeNaCaixa, `"${texto.texto}" passa da caixa dele`).toBe(true);
      expect(texto.linhas).toBeGreaterThan(1);
    }
    const estouro = await medirEstouroHorizontal(page);
    expect(estouro.estourados, 'elementos que passam da borda da tela').toEqual([]);
    expect(estouro.larguraDoConteudo).toBeLessThanOrEqual(estouro.larguraDaTela);
  });

  test('360px: palavra longa e endereço no texto "Para quem" quebram no bloco, sem rolagem horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/#servicos');
    // O parágrafo logo abaixo do subtítulo "Para quem", localizado pela posição (o texto vai mudar).
    const paragrafo = regiao(page, secoes.servicos).locator('h3 + p');
    await expect(paragrafo).toHaveText(servicos.paraQuem.texto);
    // Sozinho, o endereço cabia neste bloco mesmo sem a correção (conferido na T-025); a palavra longa, não.
    const textoLongo = `Exemplo: ${PALAVRA_LONGA}. ${ENDERECO_LONGO}`;
    await trocarTexto(paragrafo, textoLongo);

    const texto = await medirTexto(paragrafo);
    expect(texto.texto).toBe(textoLongo);
    expect(texto.cabeNaCaixa, 'o parágrafo passa da caixa dele').toBe(true);
    const estouro = await medirEstouroHorizontal(page);
    expect(estouro.estourados, 'elementos que passam da borda da tela').toEqual([]);
    expect(estouro.larguraDoConteudo).toBeLessThanOrEqual(estouro.larguraDaTela);
  });

  test('1280px: uma palavra longa num bloco não alarga a coluna dele; os 3 blocos têm a mesma largura', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/#servicos');
    const secao = regiao(page, secoes.servicos);
    await trocarTexto(secao.getByRole('heading', { level: 3, name: servicos.oQueOfereco.titulo }), PALAVRA_LONGA);

    // Cada bloco é um filho direto da grade (o <div> com o subtítulo e o conteúdo).
    const blocos = secao.getByRole('heading', { level: 3 }).locator('xpath=..');
    await expect(blocos).toHaveCount(3);
    const posicoes = await blocos.evaluateAll((lista) => lista.map((bloco) => Math.round(bloco.getBoundingClientRect().left)));
    expect(new Set(posicoes).size).toBe(3);
    expect(new Set(await larguras(blocos)).size, 'blocos com larguras diferentes').toBe(1);
    expect((await medirEstouroHorizontal(page)).estourados).toEqual([]);
  });
});

test.describe('Contato (RF-08): pente-fino da T-016', () => {
  test('o mailto: leva só o destinatário (sem cópia, assunto ou corpo escondidos)', async ({ page }) => {
    await page.goto('/#contato');
    const email = regiao(page, secoes.contato).getByRole('link', { name: contato.linkEmail, exact: true });
    const href = (await email.getAttribute('href'))!;
    expect(href).toBe(`mailto:${links.email}`);
    expect(href).not.toMatch(/[?&](cc|bcc|subject|body)=/i);
  });

  test('360px: os três canais cabem na tela, com alvo de toque de pelo menos 44px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/#contato');
    const secao = regiao(page, secoes.contato);
    const canais = [link(secao, contato.linkLinkedin), secao.getByRole('link', { name: contato.linkEmail, exact: true }), link(secao, contato.linkGithub)];
    for (const canal of canais) {
      const caixa = (await canal.boundingBox())!;
      expect(caixa.height).toBeGreaterThanOrEqual(44);
      expect(caixa.x).toBeGreaterThanOrEqual(0);
      expect(caixa.x + caixa.width).toBeLessThanOrEqual(360);
    }
  });
});

test.describe('textos do arquivo de conteúdo (RF-09): pente-fino da T-016', () => {
  /** Todos os textos de um valor (objeto, lista ou texto), em qualquer profundidade. */
  function todosOsTextos(valor: unknown): string[] {
    if (typeof valor === 'string') return [valor];
    if (Array.isArray(valor)) return valor.flatMap(todosOsTextos);
    if (valor && typeof valor === 'object') return Object.values(valor).flatMap(todosOsTextos);
    return [];
  }

  test('nenhum texto visível nasce no código: cada trecho com letras vem do conteúdo ou da API', async ({ page }) => {
    // Com os cards na tela, os textos da API (títulos, descrições, stacks, linguagem) também contam.
    await simularApi(page, PROJETOS_DE_EXEMPLO);
    await page.goto('/');
    await expect(page.getByRole('article')).toHaveCount(PROJETOS_DE_EXEMPLO.length);

    const permitidos = new Set([...todosOsTextos(ptBR), ...todosOsTextos(PROJETOS_DE_EXEMPLO)]);
    // Cada nó de texto da página (o React gera um nó por trecho: "© ", "2026", " ", nome).
    const trechos = await page.evaluate(() => {
      const caminhante = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const lista: string[] = [];
      while (caminhante.nextNode()) lista.push((caminhante.currentNode.textContent ?? '').trim());
      return lista;
    });
    // Números, datas e símbolos ("1.234", "01/10/2026", "©") não são frases: ficam de fora.
    const comLetras = trechos.filter((trecho) => /\p{L}/u.test(trecho));
    const foraDoConteudo = comLetras.filter((trecho) => !permitidos.has(trecho));
    expect(foraDoConteudo, 'textos na página que não estão no arquivo de conteúdo').toEqual([]);
  });

  test('o idioma da página (lang) é o mesmo do conteúdo (geral.localidade)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', geral.localidade);
  });

  test('o rodapé mostra o ano atual e o nome do arquivo de conteúdo', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('contentinfo')).toHaveText(`© ${new Date().getFullYear()} ${pessoa.nome}`);
  });

  test('o nome da navegação e o botão do menu vêm do conteúdo (lidos pelo leitor de tela)', async ({ page }) => {
    await page.goto('/');
    const navegacao = page.getByRole('navigation', { name: ptBR.navegacao.rotulo, exact: true });
    await expect(navegacao).toHaveCount(1);
    await expect(navegacao.getByRole('button', { includeHidden: true })).toHaveText(ptBR.navegacao.botaoMenu);
  });
});
