// RNF-04: as cores só podem ser escritas em tema.css, como variáveis.
// Os outros arquivos de CSS usam essas variáveis (ex.: `color: var(--cor-texto)`).
//
// `import.meta.glob` é um recurso do Vite (o Vitest usa o mesmo motor): junta vários
// arquivos de uma vez. Com `query: '?raw'`, cada arquivo chega como texto puro.
import { describe, expect, it } from 'vitest';
import pontoDeEntrada from './main.tsx?raw';

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

  it('toda variável usada no CSS (var(--...)) está definida em tema.css (pega erro de digitação)', () => {
    const definidas = new Set(Object.keys(variaveisDoTema()));

    for (const [caminho, css] of Object.entries(arquivosCss)) {
      for (const [, nome] of semComentarios(css).matchAll(/var\(\s*(--[\w-]+)/g)) {
        expect(definidas, `${caminho} usa ${nome}`).toContain(nome);
      }
    }
  });

  it.each([
    ['--cor-texto', '--cor-fundo'],
    ['--cor-texto', '--cor-superficie'],
    ['--cor-texto-suave', '--cor-fundo'],
    ['--cor-texto-suave', '--cor-superficie'],
    ['--cor-destaque', '--cor-fundo'],
    ['--cor-destaque', '--cor-superficie'],
    // Atalho principal: texto na cor do fundo sobre o botão na cor de destaque.
    ['--cor-fundo', '--cor-destaque'],
  ])('texto em %s sobre %s tem contraste de pelo menos 4,5:1 (WCAG AA)', (texto, fundo) => {
    const cores = variaveisDoTema();

    expect(contraste(cores[texto], cores[fundo])).toBeGreaterThanOrEqual(4.5);
  });

  it('o contorno de foco se destaca do fundo e da superfície (pelo menos 3:1, como pede a WCAG para foco)', () => {
    const cores = variaveisDoTema();

    expect(contraste(cores['--cor-foco'], cores['--cor-fundo'])).toBeGreaterThanOrEqual(3);
    expect(contraste(cores['--cor-foco'], cores['--cor-superficie'])).toBeGreaterThanOrEqual(3);
  });

  it('o tema é carregado antes dos estilos globais no ponto de entrada (main.tsx)', () => {
    expect(pontoDeEntrada.indexOf("import './tema.css'")).toBeGreaterThan(-1);
    expect(pontoDeEntrada.indexOf("import './tema.css'")).toBeLessThan(pontoDeEntrada.indexOf("import './index.css'"));
  });
});

/** As variáveis declaradas em tema.css, ex.: { "--cor-fundo": "#0f1115" }. */
function variaveisDoTema(): Record<string, string> {
  const tema = semComentarios(arquivosCss['./tema.css']);
  return Object.fromEntries([...tema.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, nome, valor]) => [nome, valor.trim()]));
}

/**
 * Razão de contraste da WCAG entre duas cores #rrggbb: vai de 1:1 (iguais) a 21:1 (preto e branco).
 * Fórmula: (L1 + 0,05) / (L2 + 0,05), com L a luminância relativa da cor mais clara (L1) e da mais escura (L2).
 */
function contraste(corA: string, corB: string): number {
  const [clara, escura] = [luminancia(corA), luminancia(corB)].sort((a, b) => b - a);
  return (clara + 0.05) / (escura + 0.05);
}

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((inicio) => {
    const canal = parseInt(hex.slice(inicio, inicio + 2), 16) / 255;
    // Converte do sRGB para luz "linear", como o olho percebe a intensidade.
    return canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
