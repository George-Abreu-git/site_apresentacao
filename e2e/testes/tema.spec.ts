// Testes de aceitação do tema (RNF-04, T-007; pente-fino da T-016): tema escuro único, com todas
// as cores vindas das variáveis de apps/web/src/tema.css. O teste unitário tema.test.ts confere o
// CSS escrito; aqui conferimos as cores que o navegador de fato calcula, com a página inteira
// montada (inclusive os cards de projetos).
// Cada teste roda nos dois projetos do playwright.config.ts (celular e desktop).
import type { Page } from '@playwright/test';
import { ptBR } from '../../apps/web/src/conteudo/pt-BR';
import { PROJETOS_DE_EXEMPLO, simularApi } from '../apoio/api';
import { lerRgb, luminancia } from '../apoio/cores';
import { expect, test } from '../apoio/teste';

/** As variáveis de cor de tema.css. */
const VARIAVEIS_DE_COR = [
  '--cor-fundo',
  '--cor-superficie',
  '--cor-borda',
  '--cor-texto',
  '--cor-texto-suave',
  '--cor-destaque',
  '--cor-foco',
] as const;

/**
 * O valor de cada variável de cor já no formato do getComputedStyle ("rgb(15, 17, 21)"): um
 * elemento de apoio recebe `color: var(--x)` e o navegador faz a conversão.
 */
async function coresDoTema(page: Page): Promise<Record<string, string>> {
  return page.evaluate((variaveis) => {
    const apoio = document.createElement('span');
    document.body.append(apoio);
    const cores = Object.fromEntries(
      variaveis.map((variavel) => {
        apoio.style.color = `var(${variavel})`;
        return [variavel, getComputedStyle(apoio).color];
      }),
    );
    apoio.remove();
    return cores;
  }, VARIAVEIS_DE_COR);
}

async function abrirComCards(page: Page) {
  await simularApi(page, PROJETOS_DE_EXEMPLO);
  await page.goto('/');
  await expect(page.getByRole('article')).toHaveCount(PROJETOS_DE_EXEMPLO.length);
}

test.describe('Tema (RNF-04)', () => {
  test('a página é escura: color-scheme dark, fundo escuro e texto claro', async ({ page }) => {
    await page.goto('/');
    const tema = await page.evaluate(() => ({
      esquema: getComputedStyle(document.documentElement).colorScheme,
      fundo: getComputedStyle(document.body).backgroundColor,
      texto: getComputedStyle(document.body).color,
    }));
    // color-scheme avisa o navegador: barras de rolagem e controles nativos também ficam escuros.
    expect(tema.esquema).toBe('dark');
    expect(luminancia(lerRgb(tema.fundo))).toBeLessThan(0.05);
    expect(luminancia(lerRgb(tema.texto))).toBeGreaterThan(0.7);
  });

  test('as sete variáveis de cor existem e o corpo da página usa --cor-fundo e --cor-texto', async ({ page }) => {
    await page.goto('/');
    const valores = await page.evaluate(
      (variaveis) => variaveis.map((variavel) => getComputedStyle(document.documentElement).getPropertyValue(variavel).trim()),
      VARIAVEIS_DE_COR,
    );
    for (const [i, valor] of valores.entries()) {
      expect(valor, VARIAVEIS_DE_COR[i]).not.toBe('');
    }
    const cores = await coresDoTema(page);
    const corpo = await page.evaluate(() => ({
      fundo: getComputedStyle(document.body).backgroundColor,
      texto: getComputedStyle(document.body).color,
    }));
    expect(corpo).toEqual({ fundo: cores['--cor-fundo'], texto: cores['--cor-texto'] });
  });

  test('com a página inteira (e os cards), toda cor de texto, fundo e borda é uma cor do tema', async ({ page }) => {
    await abrirComCards(page);
    const paleta = new Set([...Object.values(await coresDoTema(page)), 'rgba(0, 0, 0, 0)']);

    const usadas = await page.evaluate(() => {
      const encontradas: { elemento: string; propriedade: string; cor: string }[] = [];
      for (const el of document.querySelectorAll('body, body *')) {
        const estilo = getComputedStyle(el);
        for (const propriedade of ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor'] as const) {
          encontradas.push({ elemento: el.tagName.toLowerCase(), propriedade, cor: estilo[propriedade] });
        }
      }
      return encontradas;
    });
    const foraDoTema = usadas.filter(({ cor }) => !paleta.has(cor));
    expect(foraDoTema, 'cores calculadas que não vêm de tema.css').toEqual([]);
  });

  test('o contorno de foco do teclado usa --cor-foco em links, atalhos e no botão do menu', async ({ page, isMobile }) => {
    await page.goto('/');
    const corDoFoco = (await coresDoTema(page))['--cor-foco'];
    const alvos = [
      page.getByRole('banner').getByRole('link', { name: ptBR.pessoa.nome, exact: true }),
      isMobile
        ? page.getByRole('button', { name: ptBR.navegacao.botaoMenu })
        : page.getByRole('navigation').getByRole('link', { name: ptBR.secoes.sobre, exact: true }),
      page.getByRole('link', { name: ptBR.inicio.atalhoProjetos }),
      page.getByRole('link', { name: ptBR.inicio.atalhoContato }),
    ];
    // Foco vindo do teclado (Tab), que é quando o :focus-visible desenha o contorno.
    for (const alvo of alvos) {
      for (let passo = 0; passo < 10 && !(await alvo.evaluate((el) => el === document.activeElement)); passo++) {
        await page.keyboard.press('Tab');
      }
      await expect(alvo).toBeFocused();
      expect(await alvo.evaluate((el) => getComputedStyle(el).outlineColor)).toBe(corDoFoco);
    }
  });

  test('o tema é único na v1: com o sistema em modo claro, a página continua escura', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const cores = await coresDoTema(page);
    const fundo = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(fundo).toBe(cores['--cor-fundo']);
    expect(luminancia(lerRgb(fundo))).toBeLessThan(0.05);
  });

  test('cabeçalho e cards usam --cor-superficie, destacados do fundo da página', async ({ page }) => {
    await abrirComCards(page);
    const cores = await coresDoTema(page);
    const fundoDoCabecalho = await page.getByRole('banner').evaluate((el) => getComputedStyle(el).backgroundColor);
    const fundoDoCard = await page.getByRole('article').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(fundoDoCabecalho).toBe(cores['--cor-superficie']);
    expect(fundoDoCard).toBe(cores['--cor-superficie']);
    expect(cores['--cor-superficie']).not.toBe(cores['--cor-fundo']);
  });
});
