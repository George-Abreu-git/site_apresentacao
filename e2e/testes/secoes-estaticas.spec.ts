// Testes de aceitação das seções com conteúdo estático (T-008): Início (RF-02), Sobre (RF-03),
// Serviços (RF-07), Contato (RF-08) e textos vindos do arquivo de conteúdo (RF-09).
// Os textos esperados são lidos do próprio arquivo de conteúdo: quando o George trocar uma
// frase ou o endereço do LinkedIn lá, estes testes continuam valendo sem mudança.
// Cada teste roda nos dois projetos do playwright.config.ts (celular e desktop).
import { expect, test, type Locator, type Page } from '@playwright/test';
import { ptBR } from '../../apps/web/src/conteudo/pt-BR';
import { contraste } from '../apoio/cores';
import { esperarFocoVisivel, esperarSecaoNaTela } from '../apoio/pagina';

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
