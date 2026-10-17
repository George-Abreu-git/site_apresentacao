import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { elementoDaAncora, rolarAteAncora } from './useAncoraInicial';

// T-023 (BUG-Q2 da T-016): abrir o site direto em /#<secao> deixava a página no topo.
// O jsdom não rola nem implementa `scrollIntoView`; trocamos por um espião para saber
// QUAL elemento foi pedido para aparecer e COMO (a rolagem de verdade é conferida no e2e).
const rolar = vi.fn<Element['scrollIntoView']>();

/** Os ids dos elementos que pediram para rolar até eles, na ordem. */
function idsRolados(): string[] {
  return rolar.mock.contexts.map((elemento) => (elemento as Element).id);
}

/** Simula o endereço com que a página foi aberta (sem recarregar nada). */
function abrirEm(endereco: string) {
  window.history.replaceState(null, '', endereco);
}

beforeEach(() => {
  rolar.mockClear();
  Element.prototype.scrollIntoView = rolar;
});

afterEach(() => {
  // @ts-expect-error -- o jsdom não tem scrollIntoView; tiramos o espião para não vazar para outros arquivos.
  delete Element.prototype.scrollIntoView;
  abrirEm('/');
  document.body.innerHTML = '';
});

describe('abrir o site direto numa âncora (useAncoraInicial)', () => {
  it('com /#contato, rola uma vez até a seção Contato, sem animação e pelo topo', () => {
    abrirEm('/#contato');

    render(<App />);

    expect(idsRolados()).toEqual(['contato']);
    expect(rolar).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' });
    expect(rolar.mock.contexts[0]).toBe(document.getElementById('contato'));
  });

  it('sem âncora no endereço, não rola: a página abre no topo', () => {
    abrirEm('/');

    render(<App />);

    expect(rolar).not.toHaveBeenCalled();
  });

  it('com uma âncora que não existe, não rola nem lança erro', () => {
    abrirEm('/#secao-que-nao-existe');

    expect(() => render(<App />)).not.toThrow();
    expect(rolar).not.toHaveBeenCalled();
  });

  it('só rola na primeira montagem: redesenhar a página não puxa a pessoa de volta para a âncora', () => {
    abrirEm('/#servicos');
    const { rerender } = render(<App />);
    rerender(<App />);

    expect(idsRolados()).toEqual(['servicos']);
  });

  it('acha o id com acento (chega codificado no endereço) e não quebra com um "%" solto', () => {
    document.body.innerHTML = '<div id="seção"></div><div id="100%"></div>';

    expect(elementoDaAncora('#se%C3%A7%C3%A3o')?.id).toBe('seção');
    // "%" sem os dois dígitos depois faz o decodeURIComponent lançar URIError: fica o id como veio.
    expect(elementoDaAncora('#100%')?.id).toBe('100%');
    expect(() => rolarAteAncora('#%E0%A4%A')).not.toThrow();
    // "#" sozinho não é âncora de nenhum elemento.
    expect(elementoDaAncora('#')).toBeNull();
  });
});
