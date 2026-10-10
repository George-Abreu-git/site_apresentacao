// Funções de apoio dos testes e2e para medir contraste de cores (acessibilidade, WCAG 2.x).
// Ficam fora de e2e/testes/ porque não são testes: o Playwright só roda os arquivos *.spec.ts.

/** Converte "rgb(26, 26, 26)" (formato do getComputedStyle) em [26, 26, 26]. */
export function lerRgb(cor: string): [number, number, number] {
  const numeros = cor.match(/\d+(\.\d+)?/g);
  if (!numeros || numeros.length < 3) {
    throw new Error(`Cor em formato inesperado: ${cor}`);
  }
  return [Number(numeros[0]), Number(numeros[1]), Number(numeros[2])];
}

/** Luminância relativa de uma cor, pela fórmula das WCAG 2.x. */
export function luminancia([r, g, b]: [number, number, number]): number {
  const [rl, gl, bl] = [r, g, b].map((canal) => {
    const c = canal / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** Razão de contraste entre duas cores no formato do getComputedStyle (de 1 a 21). */
export function contraste(corA: string, corB: string): number {
  const [clara, escura] = [luminancia(lerRgb(corA)), luminancia(lerRgb(corB))].sort((a, b) => b - a);
  return (clara + 0.05) / (escura + 0.05);
}
