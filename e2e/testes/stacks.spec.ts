// Testes de aceitação da seção Stacks (T-009, RF-04): tecnologias agrupadas por categoria,
// vindas do arquivo de conteúdo. As categorias e tecnologias esperadas são lidas do próprio
// arquivo: quando o George incluir uma tecnologia lá, estes testes passam a exigir que ela
// apareça na página, sem nenhuma mudança aqui nem no código da tela.
// Cada teste roda nos dois projetos do playwright.config.ts (celular e desktop).
import { expect, test, type Locator, type Page } from '@playwright/test';
import { ptBR } from '../../apps/web/src/conteudo/pt-BR';
import { contraste } from '../apoio/cores';
import { medirEstouroHorizontal } from '../apoio/pagina';

const { secoes, stacks } = ptBR;

function secaoStacks(page: Page): Locator {
  return page.getByRole('region', { name: secoes.stacks, exact: true });
}

/** Quantas colunas o grid de categorias tem: conta as posições horizontais distintas dos subtítulos. */
async function contarColunas(secao: Locator): Promise<number> {
  const posicoes = await secao
    .getByRole('heading', { level: 3 })
    .evaluateAll((titulos) => titulos.map((t) => Math.round(t.getBoundingClientRect().left)));
  return new Set(posicoes).size;
}

test.describe('Stacks (RF-04)', () => {
  test('é a seção #stacks, alvo do menu, com o título de nível 2', async ({ page }) => {
    await page.goto('/#stacks');
    const secao = secaoStacks(page);
    await expect(secao).toHaveAttribute('id', 'stacks');
    await expect(secao.getByRole('heading', { level: 2, name: secoes.stacks, exact: true })).toBeVisible();
  });

  test('cada categoria do arquivo de conteúdo aparece como subtítulo, na ordem do arquivo', async ({ page }) => {
    await page.goto('/#stacks');
    const titulos = secaoStacks(page).getByRole('heading', { level: 3 });
    await expect(titulos).toHaveText(stacks.categorias.map((categoria) => categoria.titulo));
  });

  test('as tecnologias de cada categoria ficam numa lista própria, com o nome da categoria', async ({ page }) => {
    await page.goto('/#stacks');
    const secao = secaoStacks(page);
    // Uma lista por categoria, nada a mais nem a menos.
    await expect(secao.getByRole('list')).toHaveCount(stacks.categorias.length);

    for (const categoria of stacks.categorias) {
      // A lista é nomeada pelo subtítulo (aria-labelledby): o leitor de tela anuncia "lista Front-end".
      const lista = secao.getByRole('list', { name: categoria.titulo, exact: true });
      await expect(lista).toBeVisible();
      // Os itens são <li> (lista semântica), com o texto e a ordem do arquivo de conteúdo.
      await expect(lista.getByRole('listitem')).toHaveText(categoria.tecnologias);
    }
  });

  test('o arquivo de conteúdo não tem categoria vazia nem tecnologia repetida na mesma categoria', () => {
    expect(stacks.categorias.length).toBeGreaterThan(0);
    const titulos = stacks.categorias.map((categoria) => categoria.titulo);
    expect(new Set(titulos).size, 'títulos de categoria repetidos').toBe(titulos.length);
    for (const categoria of stacks.categorias) {
      expect(categoria.titulo.trim(), 'categoria sem título').not.toBe('');
      expect(categoria.tecnologias.length, `categoria "${categoria.titulo}" sem tecnologias`).toBeGreaterThan(0);
      expect(new Set(categoria.tecnologias).size, `tecnologia repetida em "${categoria.titulo}"`).toBe(categoria.tecnologias.length);
    }
  });

  // Mobile-first (RNF-01): 1 coluna no celular, 2 a partir de 36rem (576px) e 4 a partir de 60rem (960px).
  const LAYOUTS = [
    { largura: 320, altura: 640, colunas: 1 },
    { largura: 360, altura: 640, colunas: 1 },
    { largura: 768, altura: 1024, colunas: 2 },
    { largura: 1280, altura: 720, colunas: 4 },
    { largura: 1920, altura: 1080, colunas: 4 },
  ];

  for (const { largura, altura, colunas } of LAYOUTS) {
    test(`${largura}x${altura}: categorias em ${colunas} coluna(s), sem rolagem horizontal`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: altura });
      await page.goto('/#stacks');
      const secao = secaoStacks(page);
      await expect(secao.getByRole('heading', { level: 3 }).first()).toBeVisible();

      expect(await contarColunas(secao)).toBe(Math.min(colunas, stacks.categorias.length));

      const estouro = await medirEstouroHorizontal(page);
      expect(estouro.estourados, 'elementos que passam da borda da tela').toEqual([]);
      expect(estouro.larguraDoConteudo).toBeLessThanOrEqual(estouro.larguraDaTela);
    });
  }

  test('as etiquetas de tecnologia têm contraste suficiente (WCAG AA)', async ({ page }) => {
    await page.goto('/#stacks');
    const itens = secaoStacks(page).getByRole('listitem');
    await expect(itens.first()).toBeVisible();
    const cores = await itens.evaluateAll((lis) =>
      lis.map((li) => {
        const estilo = getComputedStyle(li);
        return { texto: li.textContent ?? '', cor: estilo.color, fundo: estilo.backgroundColor };
      }),
    );
    for (const { texto, cor, fundo } of cores) {
      expect(contraste(cor, fundo), `contraste de "${texto}"`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('os subtítulos das categorias têm contraste suficiente com o fundo da página', async ({ page }) => {
    await page.goto('/#stacks');
    const fundo = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const coresDosTitulos = await secaoStacks(page)
      .getByRole('heading', { level: 3 })
      .evaluateAll((titulos) => titulos.map((t) => getComputedStyle(t).color));
    for (const cor of coresDosTitulos) {
      expect(contraste(cor, fundo)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('pelo teclado: a seção não tem elementos focáveis que prendam o Tab', async ({ page }) => {
    await page.goto('/');
    // As etiquetas são texto, não botões nem links: o Tab passa direto pela seção.
    const focaveis = await secaoStacks(page)
      .locator('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      .count();
    expect(focaveis).toBe(0);
  });
});
