// RNF-04: as cores só podem ser escritas em tema.css, como variáveis.
// Os outros arquivos de CSS usam essas variáveis (ex.: `color: var(--cor-texto)`).
//
// `import.meta.glob` é um recurso do Vite (o Vitest usa o mesmo motor): junta vários
// arquivos de uma vez. Com `query: '?raw'`, cada arquivo chega como texto puro.
import { describe, expect, it } from 'vitest';

const arquivosCss = import.meta.glob<string>('./**/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/**
 * Formas de escrever uma cor "na mão": #rgb/#rrggbb, rgb(), hsl() e afins, e alguns nomes comuns.
 * Os nomes não podem estar colados a um hífen: assim `white-space` (propriedade) não conta como cor.
 */
const COR_FIXA =
  /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(|(?<![\w-])(?:white|black|red|green|blue|gray|grey)(?![\w-])/i;

/** Comentários podem citar cores como exemplo; eles não contam. */
function semComentarios(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('tema escuro (RNF-04)', () => {
  it('define as cores do tema em variáveis de CSS', () => {
    const tema = arquivosCss['./tema.css'];
    expect(tema).toBeDefined();
    expect(tema).toMatch(/color-scheme:\s*dark/);
    for (const variavel of ['--cor-fundo', '--cor-texto', '--cor-destaque', '--cor-foco']) {
      expect(tema).toContain(`${variavel}:`);
    }
  });

  it('não tem nenhuma cor fixa fora de tema.css', () => {
    const outrosArquivos = Object.entries(arquivosCss).filter(([caminho]) => caminho !== './tema.css');
    expect(outrosArquivos.length).toBeGreaterThan(0);

    for (const [caminho, conteudo] of outrosArquivos) {
      // A mensagem mostra o arquivo culpado, se o teste falhar.
      expect(semComentarios(conteudo), caminho).not.toMatch(COR_FIXA);
    }
  });
});
