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
});
