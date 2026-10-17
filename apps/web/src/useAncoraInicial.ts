// Abrir o site direto numa âncora (ex.: um link compartilhado para /#contato) leva até a seção (T-023).
//
// Por que é preciso: o navegador procura o elemento da âncora quando o HTML termina de chegar,
// mas o index.html só tem a <div id="root"> vazia. As seções nascem depois, quando o React monta
// a página, e o navegador não procura de novo: a página ficava no topo. Aqui fazemos essa busca
// uma vez, logo depois de o React pôr as seções na página.
import { useLayoutEffect } from 'react';

/**
 * O elemento indicado pela âncora do endereço ("#contato" → o elemento com id="contato"),
 * ou `null` se não houver âncora ou nenhum elemento com aquele id.
 *
 * Como o navegador, tenta primeiro o id do jeito que veio e depois decodificado
 * (no endereço, "#seção" chega como "#se%C3%A7%C3%A3o").
 */
export function elementoDaAncora(ancora: string, documento: Document = document): HTMLElement | null {
  const id = ancora.replace(/^#/, '');
  if (id === '') return null;
  return documento.getElementById(id) ?? documento.getElementById(decodificar(id));
}

/** Rola a página até o elemento da âncora, se ele existir; senão, não faz nada. */
export function rolarAteAncora(ancora: string, documento: Document = document): void {
  // `instant`: quem acabou de chegar vê a seção direto, sem a animação da rolagem suave
  // (scroll-behavior: smooth, em index.css), como o navegador faz com uma âncora na carga.
  // O `scroll-padding-top` do <html> continua valendo: o título não fica atrás do cabeçalho.
  elementoDaAncora(ancora, documento)?.scrollIntoView({ behavior: 'instant', block: 'start' });
}

/**
 * Na primeira montagem da página, rola até a âncora do endereço.
 * `useLayoutEffect` (e não `useEffect`) roda antes de a tela ser pintada: a pessoa não vê
 * o topo da página piscar antes de ir para a seção.
 */
export function useAncoraInicial(): void {
  useLayoutEffect(() => {
    rolarAteAncora(window.location.hash);
  }, []);
}

/** `decodeURIComponent` lança erro com um "%" solto (ex.: "#100%"); aí fica o id original. */
function decodificar(id: string): string {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}
