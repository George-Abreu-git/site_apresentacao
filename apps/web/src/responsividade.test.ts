// RNF-01: do celular (360px) ao desktop (1280px+), mobile-first, sem rolagem horizontal.
// O jsdom não calcula layout, então aqui o teste lê o TEXTO do CSS e confere as regras que
// garantem isso. Quem confere na tela de verdade, em várias larguras, são os testes de ponta a ponta (e2e/).
import { describe, expect, it } from 'vitest';
import paginaHtml from '../index.html?raw';

// Mesmo recurso de tema.test.ts: todos os arquivos de CSS como texto puro.
const arquivosCss = import.meta.glob<string>('./**/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function semComentarios(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Todas as ocorrências de um padrão em todos os arquivos de CSS, com o arquivo de origem. */
function ocorrencias(padrao: RegExp): { arquivo: string; trecho: string }[] {
  return Object.entries(arquivosCss).flatMap(([arquivo, css]) =>
    [...semComentarios(css).matchAll(padrao)].map((encontrado) => ({ arquivo, trecho: encontrado[0] })),
  );
}

/** O texto do bloco `@media (min-width: <largura>) { ... }` de um arquivo (chaves aninhadas incluídas). */
function blocoDeMedia(css: string, largura: string): string {
  const inicio = css.indexOf(`@media (min-width: ${largura})`);
  if (inicio === -1) return '';
  let profundidade = 0;
  for (let i = css.indexOf('{', inicio); i < css.length; i++) {
    if (css[i] === '{') profundidade++;
    if (css[i] === '}') profundidade--;
    if (profundidade === 0) return css.slice(inicio, i + 1);
  }
  return '';
}

/** O CSS sem os blocos `@media`: só as regras que valem desde o celular (a base do mobile-first). */
function semMediaQueries(css: string): string {
  const texto = semComentarios(css);
  let base = '';
  let posicao = 0;
  for (let inicio = texto.indexOf('@media'); inicio !== -1; inicio = texto.indexOf('@media', posicao)) {
    base += texto.slice(posicao, inicio);
    // Pula o bloco inteiro da media query, contando as chaves aninhadas (as regras dentro dela).
    let profundidade = 0;
    let fim = texto.indexOf('{', inicio);
    for (; fim < texto.length; fim++) {
      if (texto[fim] === '{') profundidade++;
      if (texto[fim] === '}') profundidade--;
      if (profundidade === 0) break;
    }
    posicao = fim + 1;
  }
  return base + texto.slice(posicao);
}

/** As regras de um CSS (seletor e corpo entre chaves), fora das media queries. */
function regrasDaBase(css: string): { seletor: string; corpo: string }[] {
  return [...semMediaQueries(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, seletor, corpo]) => ({
    seletor: seletor.trim(),
    corpo,
  }));
}

/** O corpo da regra de um seletor exato (ex.: `.dado`), fora das media queries. */
function corpoDaRegra(css: string, seletor: string): string {
  return regrasDaBase(css).find((regra) => regra.seletor === seletor)?.corpo ?? '';
}

describe('responsividade (RNF-01)', () => {
  it('o index.html pede ao celular a largura real da tela (meta viewport)', () => {
    expect(paginaHtml).toMatch(/<meta name="viewport" content="width=device-width, initial-scale=1(\.0)?"/);
  });

  it('é mobile-first: toda media query de largura usa min-width (nunca max-width)', () => {
    const consultas = ocorrencias(/@media[^{]*width[^{]*/g);

    expect(consultas.length).toBeGreaterThan(0);
    for (const { arquivo, trecho } of consultas) {
      expect(trecho, arquivo).toMatch(/min-width/);
      expect(trecho, arquivo).not.toMatch(/max-width/);
    }
  });

  it('os pontos de quebra usam rem, que acompanham o tamanho de fonte escolhido pelo usuário', () => {
    for (const { arquivo, trecho } of ocorrencias(/@media[^{]*width[^{]*/g)) {
      expect(trecho, arquivo).toMatch(/width:\s*[\d.]+rem/);
    }
  });

  it('nenhuma largura fixa em px maior que a menor tela suportada (360px)', () => {
    const larguras = ocorrencias(/(?<![\w-])(?:min-)?width:\s*(\d+(?:\.\d+)?)px/g);

    for (const { arquivo, trecho } of larguras) {
      const pixels = Number(trecho.match(/(\d+(?:\.\d+)?)px/)![1]);
      expect(pixels, `${arquivo}: ${trecho}`).toBeLessThan(360);
    }
  });

  it('toda grade (grid) usa colunas que podem encolher, minmax(0, 1fr), para um texto longo não alargar a tela', () => {
    const grades = ocorrencias(/grid-template-columns:[^;]+;/g);

    expect(grades.length).toBeGreaterThan(0);
    for (const { arquivo, trecho } of grades) {
      expect(trecho, arquivo).toMatch(/minmax\(0,\s*1fr\)/);
    }
  });

  it('estilos globais evitam estouro: border-box e quebra de palavras longas', () => {
    const globais = semComentarios(arquivosCss['./index.css']);

    expect(globais).toMatch(/box-sizing:\s*border-box/);
    expect(globais).toMatch(/overflow-wrap:\s*break-word/);
  });

  it('menu: no celular a lista começa escondida atrás do botão; a partir de 48rem o botão some e a lista aparece', () => {
    const menu = semComentarios(arquivosCss['./componentes/Menu/Menu.module.css']);
    const desktop = blocoDeMedia(menu, '48rem');

    // Fora da media query (celular): a lista fechada não aparece.
    expect(menu).toMatch(/\.lista\s*\{[^}]*display:\s*none/);
    // Dentro dela (tablet/desktop): botão escondido e lista visível.
    expect(desktop).toMatch(/\.botao\s*\{[^}]*display:\s*none/);
    expect(desktop).toMatch(/\.lista,\s*\.aberta\s*\{[^}]*display:\s*flex/);
  });

  // T-025 (BUG-Q4 da T-016): sem colunas declaradas, a grade cria uma coluna implícita (`auto`), que
  // cresce até caber a maior palavra do conteúdo. Por isso a coluna que encolhe precisa valer já no celular.
  describe('texto longo ou ampliado não alarga a tela (T-025)', () => {
    const cartao = arquivosCss['./componentes/CartaoDeProjeto/CartaoDeProjeto.module.css'];

    it('toda grade já declara colunas que podem encolher no celular, fora das media queries', () => {
      const grades = Object.entries(arquivosCss).flatMap(([arquivo, css]) =>
        regrasDaBase(css)
          .filter(({ corpo }) => /display:\s*grid/.test(corpo))
          .map((regra) => ({ arquivo, ...regra })),
      );

      expect(grades.length).toBeGreaterThan(0);
      for (const { arquivo, seletor, corpo } of grades) {
        expect(corpo, `${arquivo} ${seletor}`).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
      }
    });

    it('lista de projetos: uma coluna no celular, duas a partir de 36rem e três a partir de 60rem', () => {
      const projetos = semComentarios(arquivosCss['./componentes/Projetos/Projetos.module.css']);

      expect(corpoDaRegra(projetos, '.lista')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\);/);
      expect(blocoDeMedia(projetos, '36rem')).toMatch(/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
      expect(blocoDeMedia(projetos, '60rem')).toMatch(/grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
    });

    it('card de projeto: rótulo e valor dos dados vivos podem ir para linhas separadas (flex-wrap)', () => {
      expect(corpoDaRegra(cartao, '.dado')).toMatch(/flex-wrap:\s*wrap/);
    });

    it('card de projeto: toda fileira flex quebra a linha quando falta espaço', () => {
      // Fileira = flex em linha (sem flex-direction: column). `inline-flex` (o link) tem um só texto dentro.
      const fileiras = regrasDaBase(cartao).filter(
        ({ corpo }) => /display:\s*flex/.test(corpo) && !/flex-direction:\s*column/.test(corpo),
      );

      expect(fileiras.length).toBeGreaterThan(0);
      for (const { seletor, corpo } of fileiras) {
        expect(corpo, seletor).toMatch(/flex-wrap:\s*wrap/);
      }
    });

    it('card de projeto: o texto quebra em vez de ser cortado ou escondido', () => {
      // Esconder o que sobra (overflow: hidden, reticências, nowrap) também tira a rolagem lateral,
      // mas some com parte do conteúdo — o que a ampliação de texto (WCAG 1.4.4) não permite.
      expect(semComentarios(cartao)).not.toMatch(/overflow(-x)?:\s*(hidden|clip)|text-overflow|white-space:\s*nowrap/);
    });
  });

  // T-029: em 360px com o texto a 200%, a marca + o botão Menu não cabem lado a lado, e a palavra
  // "Repositório" sozinha é mais larga que o card. Só aparece com fontes largas (DejaVu Sans, a
  // padrão do runner Linux do CI), por isso as regras são conferidas aqui, sem depender da fonte.
  describe('cabeçalho e links-botão com texto ampliado (T-029)', () => {
    const cabecalho = semComentarios(arquivosCss['./componentes/Cabecalho/Cabecalho.module.css']);
    const menu = semComentarios(arquivosCss['./componentes/Menu/Menu.module.css']);

    it('cabeçalho: a marca e o menu descem para linhas separadas quando não cabem lado a lado', () => {
      // Vale desde o celular (fora das media queries), onde a falta de espaço acontece.
      expect(corpoDaRegra(cabecalho, '.conteudo')).toMatch(/flex-wrap:\s*wrap/);
    });

    it('cabeçalho: mantém a altura normal e dá respiro em cima e embaixo quando quebra em linhas', () => {
      const conteudo = corpoDaRegra(cabecalho, '.conteudo');

      expect(conteudo).toMatch(/min-height:\s*var\(--altura-cabecalho\)/);
      // Com `border-box`, o padding vertical cabe dentro da altura mínima (4rem): sem quebra, nada muda.
      expect(conteudo).toMatch(/padding:\s*0\.5rem var\(--espaco-lateral\)/);
    });

    it('cabeçalho e menu: nada é cortado ou escondido para caber', () => {
      for (const css of [cabecalho, menu]) {
        expect(css).not.toMatch(/overflow(-x)?:\s*(hidden|clip)|text-overflow|white-space:\s*nowrap/);
      }
    });

    it('todo link com cara de botão (inline-flex) deixa uma palavra maior que o espaço quebrar dentro dele', () => {
      // `break-word` (do body) quebra a palavra só depois de medir o tamanho mínimo do elemento com ela
      // inteira; `anywhere` entra nessa medida, então o botão pode encolher até a largura da tela.
      const botoes = Object.entries(arquivosCss).flatMap(([arquivo, css]) =>
        regrasDaBase(css)
          .filter(({ corpo }) => /display:\s*inline-flex/.test(corpo))
          .map((regra) => ({ arquivo, ...regra })),
      );

      expect(botoes.map(({ arquivo }) => arquivo)).toEqual(
        expect.arrayContaining(['./componentes/CartaoDeProjeto/CartaoDeProjeto.module.css']),
      );
      for (const { arquivo, seletor, corpo } of botoes) {
        expect(corpo, `${arquivo} ${seletor}`).toMatch(/overflow-wrap:\s*anywhere/);
      }
    });

    it('a quebra em qualquer ponto fica só nos links-botão: o resto da página continua com break-word', () => {
      // Com `anywhere` na página toda, a marca do cabeçalho encolheria e quebraria no meio do nome
      // em vez de o menu descer para a linha de baixo.
      const globais = semComentarios(arquivosCss['./index.css']);

      expect(globais).toMatch(/overflow-wrap:\s*break-word/);
      expect(globais).not.toMatch(/overflow-wrap:\s*anywhere/);
      expect(cabecalho).not.toMatch(/overflow-wrap:\s*anywhere/);
      expect(menu).not.toMatch(/overflow-wrap:\s*anywhere/);
    });
  });
});
