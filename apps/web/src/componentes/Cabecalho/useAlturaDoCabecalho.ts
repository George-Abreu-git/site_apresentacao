// Mantém o `scroll-padding-top` do <html> igual à altura REAL do cabeçalho (T-030).
//
// Por que é preciso: o cabeçalho fica preso ao topo (sticky) e cobre o que passa por baixo dele.
// O `scroll-padding-top` diz ao navegador quanto espaço deixar no topo ao rolar até uma âncora
// (menu, link compartilhado, Tab). Um valor fixo (4rem, a altura numa linha) não basta: com o texto
// a 200% numa tela estreita, a marca e o botão Menu quebram em várias linhas e o cabeçalho cresce.
// O CSS não sabe ler a altura de um elemento, então medimos aqui e publicamos numa variável de CSS.
import { useLayoutEffect, type RefObject } from 'react';

/** A variável de CSS com a altura do cabeçalho (valor padrão em tema.css; lida em index.css). */
export const VARIAVEL_DA_ALTURA = '--altura-real-do-cabecalho';

/**
 * Publica a altura do cabeçalho em `--altura-real-do-cabecalho` e a atualiza sempre que ela mudar.
 *
 * `useLayoutEffect` (e não `useEffect`): roda antes de a tela ser pintada e antes do efeito do App,
 * que é o pai (o React roda os efeitos dos filhos primeiro). Assim a altura já vale quando o
 * `useAncoraInicial` rola até a âncora do endereço.
 */
export function useAlturaDoCabecalho(cabecalhoRef: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const cabecalho = cabecalhoRef.current;
    if (!cabecalho) return;

    const raiz = document.documentElement;
    const publicar = () => raiz.style.setProperty(VARIAVEL_DA_ALTURA, `${alturaEmPixels(cabecalho)}px`);
    const tirar = () => raiz.style.removeProperty(VARIAVEL_DA_ALTURA);

    publicar();
    // Navegador sem ResizeObserver: fica a primeira medida (e, sem JavaScript, o padrão de tema.css).
    if (typeof ResizeObserver === 'undefined') return tirar;

    // O ResizeObserver avisa a cada mudança de tamanho: texto ampliado, fonte que terminou de
    // carregar, tela girada. `border-box` inclui a borda de baixo, que também cobre o conteúdo.
    const observador = new ResizeObserver(publicar);
    observador.observe(cabecalho, { box: 'border-box' });
    return () => {
      observador.disconnect();
      tirar();
    };
  }, [cabecalhoRef]);
}

/** Arredonda para cima: com 64,4px, reservar só 64 deixaria o título 0,4px atrás do cabeçalho. */
function alturaEmPixels(elemento: HTMLElement): number {
  return Math.ceil(elemento.getBoundingClientRect().height);
}
