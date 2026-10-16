// Testes de aceitação da seção Projetos (T-012): cards montados a partir de GET /api/projetos
// (RF-05), aviso de carregamento sem segurar o resto da página (RNF-03) e mensagem amigável
// quando a API falha. A API é simulada com `page.route`: o Playwright intercepta a requisição
// no navegador e responde o que o teste quiser (sucesso, demora, erro), sem subir a API de verdade.
// A simulação de cada teste substitui a padrão do `test` de e2e/apoio/teste.ts (API sem resposta).
// Os textos esperados são lidos do arquivo de conteúdo, como nos outros testes.
// Cada teste roda nos dois projetos do playwright.config.ts (celular e desktop).
import type { Locator, Page } from '@playwright/test';
import { ptBR } from '../../apps/web/src/conteudo/pt-BR';
import { PROJETOS_DE_EXEMPLO as PROJETOS, ROTA_DA_API, responder, simularApi } from '../apoio/api';
import { contraste } from '../apoio/cores';
import { esperarFocoVisivel, medirEstouroHorizontal } from '../apoio/pagina';
import { expect, test } from '../apoio/teste';

const { pessoa, secoes, sobre, servicos, contato, geral } = ptBR;
const textos = ptBR.projetos;

/**
 * Simula a API "acordando" (partida a frio): a requisição fica pendurada até o teste chamar
 * `liberar()`, devolvido por esta função.
 */
async function simularApiDemorada(page: Page, corpo: unknown = PROJETOS) {
  let liberar!: () => void;
  const liberada = new Promise<void>((resolver) => (liberar = resolver));
  await page.route(ROTA_DA_API, async (rota) => {
    await liberada;
    // O StrictMode do desenvolvimento cancela a 1ª requisição; responder a ela daria erro.
    await responder(rota, corpo).catch(() => {});
  });
  return liberar;
}

function secaoProjetos(page: Page): Locator {
  return page.getByRole('region', { name: secoes.projetos, exact: true });
}

function aviso(page: Page): Locator {
  return secaoProjetos(page).getByRole('status');
}

function listaDeCards(page: Page): Locator {
  return secaoProjetos(page).getByRole('list', { name: secoes.projetos, exact: true });
}

/** Só os itens da lista de cards: os cards têm listas próprias (stacks, links) dentro deles. */
function itensDaLista(page: Page): Locator {
  return listaDeCards(page).locator(':scope > li');
}

function cartao(page: Page, titulo: string): Locator {
  return secaoProjetos(page).getByRole('article', { name: titulo, exact: true });
}

/** Link pelo texto visível; o nome acessível termina com o aviso de nova aba. */
function link(dentroDe: Locator, texto: string): Locator {
  return dentroDe.getByRole('link', { name: texto });
}

/** O conteúdo estático (Início, Sobre, Stacks, Serviços, Contato) já está na tela (RNF-03). */
async function esperarConteudoEstatico(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: pessoa.nome })).toBeVisible();
  await expect(page.getByText(sobre.paragrafos[0], { exact: true })).toBeAttached();
  await expect(page.getByRole('heading', { level: 2, name: secoes.stacks, exact: true })).toBeAttached();
  await expect(page.getByRole('heading', { level: 3, name: servicos.oQueOfereco.titulo })).toBeAttached();
  await expect(page.getByRole('link', { name: contato.linkEmail, exact: true })).toBeAttached();
}

/** Cor de fundo efetiva: sobe pelos ancestrais até achar um fundo que não seja transparente. */
async function fundoEfetivo(elemento: Locator): Promise<string> {
  return elemento.evaluate((el) => {
    for (let atual: Element | null = el; atual; atual = atual.parentElement) {
      const cor = getComputedStyle(atual).backgroundColor;
      if (cor !== 'rgba(0, 0, 0, 0)' && cor !== 'transparent') return cor;
    }
    return 'rgb(255, 255, 255)';
  });
}

async function contrasteDe(elemento: Locator): Promise<number> {
  const cor = await elemento.evaluate((el) => getComputedStyle(el).color);
  return contraste(cor, await fundoEfetivo(elemento));
}

/** Aperta Tab até o elemento receber o foco; falha se não chegar em `limite` passos. */
async function tabAte(page: Page, alvo: Locator, limite = 60) {
  for (let passo = 0; passo < limite; passo++) {
    await page.keyboard.press('Tab');
    if (await alvo.evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error(`o Tab não chegou ao elemento em ${limite} passos`);
}

test.describe('Projetos (RF-05): cards montados com a resposta da API', () => {
  test.beforeEach(async ({ page }) => {
    await simularApi(page, PROJETOS);
    await page.goto('/#projetos');
  });

  test('busca GET /api/projetos e mostra um card por projeto, na ordem da API', async ({ page }) => {
    await expect(itensDaLista(page)).toHaveCount(PROJETOS.length);
    // Cada card tem o título como <h3>, abaixo do <h2> da seção.
    await expect(secaoProjetos(page).getByRole('heading', { level: 3 })).toHaveText(PROJETOS.map((p) => p.titulo));
    for (const projeto of PROJETOS) {
      await expect(cartao(page, projeto.titulo)).toBeVisible();
    }
  });

  test('a requisição vai para /api/projetos com GET', async ({ page }) => {
    // Nova visita para capturar a requisição desde o início.
    const [requisicao] = await Promise.all([page.waitForRequest(ROTA_DA_API), page.reload()]);
    expect(requisicao.method()).toBe('GET');
    expect(new URL(requisicao.url()).pathname).toBe('/api/projetos');
  });

  test('card completo: título, descrição, stacks, links e dados vivos do GitHub', async ({ page }) => {
    const [projeto] = PROJETOS;
    const card = cartao(page, projeto.titulo);

    await expect(card.getByRole('heading', { level: 3, name: projeto.titulo })).toBeVisible();
    await expect(card.getByText(projeto.descricao, { exact: true })).toBeVisible();
    // As stacks são uma lista nomeada, com os itens na ordem da API.
    await expect(card.getByRole('list', { name: textos.rotuloStacks, exact: true }).getByRole('listitem')).toHaveText(projeto.stacks);

    // Dados vivos como pares rótulo/valor (<dt>/<dd>), formatados em pt-BR.
    await expect(card.locator('dt')).toHaveText([textos.linguagem, textos.estrelas, textos.ultimaAtualizacao]);
    await expect(card.locator('dd')).toHaveText(['TypeScript', '1.234', '01/10/2026']);
    await expect(card.locator('time')).toHaveAttribute('datetime', '2026-10-01T12:00:00Z');

    // Links do repositório e da demo: nova aba segura e aviso para o leitor de tela.
    for (const [texto, endereco] of [
      [textos.linkRepositorio, projeto.repositorio!],
      [textos.linkDemo, projeto.demo!],
    ]) {
      const alvo = link(card, texto);
      await expect(alvo).toBeVisible();
      await expect(alvo).toHaveAttribute('href', endereco);
      await expect(alvo).toHaveAttribute('target', '_blank');
      await expect(alvo).toHaveAttribute('rel', /\bnoopener\b/);
      await expect(alvo).toHaveAttribute('rel', /\bnoreferrer\b/);
      await expect(alvo).toHaveAccessibleName(`${texto} ${geral.abreEmNovaAba}`);
    }
  });

  test('o que a API não mandou não aparece no card', async ({ page }) => {
    // Sem linguagem: os outros dados vivos aparecem, inclusive zero estrelas.
    const semLinguagem = cartao(page, PROJETOS[1].titulo);
    await expect(semLinguagem.locator('dt')).toHaveText([textos.estrelas, textos.ultimaAtualizacao]);
    await expect(semLinguagem.locator('dd')).toHaveText(['0', '15/09/2026']);
    await expect(link(semLinguagem, textos.linkRepositorio)).toBeVisible();
    await expect(link(semLinguagem, textos.linkDemo)).toHaveCount(0);

    // GitHub indisponível: só os dados curados (com o link do repositório).
    const githubForaDoAr = cartao(page, PROJETOS[2].titulo);
    await expect(githubForaDoAr.getByText(PROJETOS[2].descricao, { exact: true })).toBeVisible();
    await expect(githubForaDoAr.locator('dl')).toHaveCount(0);
    await expect(link(githubForaDoAr, textos.linkRepositorio)).toBeVisible();

    // Sem repositório: nem dados vivos nem links.
    const semRepositorio = cartao(page, PROJETOS[3].titulo);
    await expect(semRepositorio.getByRole('list', { name: textos.rotuloStacks }).getByRole('listitem')).toHaveText(PROJETOS[3].stacks);
    await expect(semRepositorio.locator('dl')).toHaveCount(0);
    await expect(semRepositorio.getByRole('link')).toHaveCount(0);
  });

  test('com os cards na tela, o aviso fica vazio (sem carregando nem erro)', async ({ page }) => {
    await expect(listaDeCards(page)).toBeVisible();
    await expect(aviso(page)).toHaveText('');
  });

  test('clicar no repositório abre o GitHub em nova aba, sem sair do site', async ({ page }) => {
    // Páginas de fora do site respondem com uma página vazia: o teste não depende da internet.
    await page.context().route(
      (url) => url.hostname !== 'localhost',
      (rota) => rota.fulfill({ contentType: 'text/html', body: '<title>site externo</title>' }),
    );
    const card = cartao(page, PROJETOS[0].titulo);
    const [novaAba] = await Promise.all([page.context().waitForEvent('page'), link(card, textos.linkRepositorio).click()]);
    await novaAba.waitForLoadState();
    expect(novaAba.url()).toBe(PROJETOS[0].repositorio);
    await novaAba.close();
    await expect(page).toHaveURL(/\/#projetos$/);
  });

  test('os títulos continuam sem pular níveis com os cards na tela', async ({ page }) => {
    await expect(listaDeCards(page)).toBeVisible();
    const niveis = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((titulos) => titulos.map((t) => Number(t.tagName[1])));
    for (let i = 1; i < niveis.length; i++) {
      expect(niveis[i], `título ${i + 1} (h${niveis[i]}) depois de um h${niveis[i - 1]}`).toBeLessThanOrEqual(niveis[i - 1] + 1);
    }
  });
});

test.describe('Projetos: carregamento (RNF-03)', () => {
  test('enquanto a API não responde, aparece o aviso de carregamento e o resto da página já está pronto', async ({ page }) => {
    const liberar = await simularApiDemorada(page);
    await page.goto('/');

    await expect(aviso(page)).toHaveText(textos.carregando);
    await esperarConteudoEstatico(page);
    await expect(listaDeCards(page)).toHaveCount(0);

    // A API responde: os cards aparecem e o aviso some.
    liberar();
    await expect(itensDaLista(page)).toHaveCount(PROJETOS.length);
    await expect(aviso(page)).toHaveText('');
  });

  test('partida a frio: depois de um minuto e meio esperando, continua carregando e mostra os cards quando a API acorda', async ({ page }) => {
    // O relógio simulado deixa "passar" 90 segundos na página sem o teste esperar de verdade:
    // se o front tivesse um tempo limite próprio, ele desistiria aqui.
    await page.clock.install();
    const liberar = await simularApiDemorada(page);
    await page.goto('/#projetos');
    await expect(aviso(page)).toHaveText(textos.carregando);

    await page.clock.fastForward('01:30');
    await expect(aviso(page)).toHaveText(textos.carregando);
    await esperarConteudoEstatico(page);

    liberar();
    await expect(itensDaLista(page)).toHaveCount(PROJETOS.length);
  });

  test('o menu e os atalhos funcionam durante o carregamento', async ({ page }) => {
    await simularApiDemorada(page);
    await page.goto('/');
    await expect(aviso(page)).toHaveText(textos.carregando);
    await page.getByRole('region', { name: pessoa.nome }).getByRole('link', { name: ptBR.inicio.atalhoContato }).click();
    await expect(page).toHaveURL(/#contato$/);
    await expect(page.getByRole('link', { name: contato.linkEmail, exact: true })).toBeInViewport();
  });
});

test.describe('Projetos: falha da API', () => {
  const FALHAS: { nome: string; simular: (page: Page) => Promise<void> }[] = [
    { nome: 'erro 500', simular: (page) => simularApi(page, { mensagem: 'erro interno' }, 500) },
    { nome: 'erro 404', simular: (page) => simularApi(page, { mensagem: 'não encontrado' }, 404) },
    { nome: 'API fora do ar (falha de rede)', simular: (page) => page.route(ROTA_DA_API, (rota) => rota.abort('connectionrefused')) },
    { nome: 'resposta que não é uma lista', simular: (page) => simularApi(page, { projetos: PROJETOS }) },
    { nome: 'resposta que não é JSON', simular: (page) => simularApi(page, '<html>Bad Gateway</html>') },
  ];

  for (const { nome, simular } of FALHAS) {
    test(`${nome}: mensagem amigável, sem cards e sem quebrar a página`, async ({ page }) => {
      const errosDaPagina: Error[] = [];
      page.on('pageerror', (erro) => errosDaPagina.push(erro));
      await simular(page);
      await page.goto('/#projetos');

      await expect(aviso(page)).toHaveText(textos.erro);
      await expect(aviso(page)).toBeVisible();
      await expect(listaDeCards(page)).toHaveCount(0);
      await expect(secaoProjetos(page).getByRole('heading', { level: 2, name: secoes.projetos })).toBeVisible();
      await esperarConteudoEstatico(page);
      expect(errosDaPagina, 'erros de JavaScript não tratados na página').toEqual([]);
    });
  }

  test('lista vazia: aviso de que não há projetos, sem mensagem de erro', async ({ page }) => {
    await simularApi(page, []);
    await page.goto('/#projetos');
    await expect(aviso(page)).toHaveText(textos.vazio);
    await expect(listaDeCards(page)).toHaveCount(0);
  });
});

test.describe('Projetos: responsivo (RNF-01)', () => {
  const TELAS = [
    { largura: 360, altura: 640, colunas: 1 },
    { largura: 768, altura: 1024, colunas: 2 },
    { largura: 1440, altura: 900, colunas: 3 },
  ];

  for (const { largura, altura, colunas } of TELAS) {
    test(`${largura}px: ${colunas} card(s) por linha e sem rolagem horizontal`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: altura });
      await simularApi(page, PROJETOS);
      await page.goto('/#projetos');
      await expect(itensDaLista(page)).toHaveCount(PROJETOS.length);

      const posicoes = await secaoProjetos(page)
        .getByRole('article')
        .evaluateAll((cards) => cards.map((card) => Math.round(card.getBoundingClientRect().left)));
      expect(new Set(posicoes).size).toBe(colunas);

      const medida = await medirEstouroHorizontal(page);
      expect(medida.estourados, 'elementos que passam da borda da tela').toEqual([]);
      expect(medida.larguraDoConteudo).toBeLessThanOrEqual(medida.larguraDaTela);
    });
  }

  test('360px: os links do card têm alvo de toque de pelo menos 44px de altura', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await simularApi(page, PROJETOS);
    await page.goto('/#projetos');
    for (const texto of [textos.linkRepositorio, textos.linkDemo]) {
      const caixa = (await link(cartao(page, PROJETOS[0].titulo), texto).boundingBox())!;
      expect(caixa.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('Projetos: acessibilidade', () => {
  test('pelo teclado: Tab chega aos links do card com foco visível', async ({ page }) => {
    await simularApi(page, PROJETOS);
    await page.goto('/');
    const card = cartao(page, PROJETOS[0].titulo);
    await expect(card).toBeAttached();

    const repositorio = link(card, textos.linkRepositorio);
    await tabAte(page, repositorio);
    await esperarFocoVisivel(repositorio);
    await page.keyboard.press('Tab');
    await esperarFocoVisivel(link(card, textos.linkDemo));
  });

  test('textos do card têm contraste suficiente (WCAG AA) e o foco tem pelo menos 3:1', async ({ page }) => {
    await simularApi(page, PROJETOS);
    await page.goto('/#projetos');
    const card = cartao(page, PROJETOS[0].titulo);
    await expect(card).toBeVisible();

    const elementos = [
      card.getByRole('heading', { level: 3 }),
      card.getByText(PROJETOS[0].descricao, { exact: true }),
      card.getByRole('list', { name: textos.rotuloStacks }).getByRole('listitem').first(),
      card.locator('dt').first(),
      card.locator('dd').first(),
      link(card, textos.linkRepositorio),
    ];
    for (const elemento of elementos) {
      expect(await contrasteDe(elemento)).toBeGreaterThanOrEqual(4.5);
    }

    const repositorio = link(card, textos.linkRepositorio);
    await repositorio.focus();
    const corDoFoco = await repositorio.evaluate((el) => getComputedStyle(el).outlineColor);
    expect(contraste(corDoFoco, await fundoEfetivo(repositorio))).toBeGreaterThanOrEqual(3);
  });

  test('os avisos de carregamento e de erro têm contraste suficiente e ficam numa região viva', async ({ page }) => {
    // Primeiro a API demora (carregando); quando o teste libera, responde com erro 500.
    let liberar!: () => void;
    const liberada = new Promise<void>((resolver) => (liberar = resolver));
    await page.route(ROTA_DA_API, async (rota) => {
      await liberada;
      await responder(rota, { mensagem: 'erro' }, 500).catch(() => {});
    });
    await page.goto('/#projetos');

    const regiaoViva = aviso(page);
    await expect(regiaoViva).toHaveText(textos.carregando);
    expect(await contrasteDe(regiaoViva)).toBeGreaterThanOrEqual(4.5);

    // É o mesmo elemento que muda de texto (o leitor de tela anuncia a mudança).
    await regiaoViva.evaluate((el) => el.setAttribute('data-teste', 'mesma-regiao'));
    liberar();
    await expect(regiaoViva).toHaveText(textos.erro);
    await expect(regiaoViva).toHaveAttribute('data-teste', 'mesma-regiao');
    expect(await contrasteDe(regiaoViva)).toBeGreaterThanOrEqual(4.5);
  });
});
