import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import estilosGlobais from '../../index.css?raw';
import tema from '../../tema.css?raw';
import Cabecalho from './Cabecalho';
import { VARIAVEL_DA_ALTURA } from './useAlturaDoCabecalho';

// T-030: o `scroll-padding-top` era fixo em 4rem, mas com o texto a 200% em 360px o cabeçalho quebra
// em várias linhas e fica mais alto. O hook mede o cabeçalho de verdade e publica a altura numa
// variável de CSS, que o `scroll-padding-top` do <html> usa.
//
// O jsdom não calcula layout (toda caixa mede 0) nem tem ResizeObserver: aqui o cabeçalho ganha uma
// altura de mentira e um observador falso que o teste dispara quando quer.

let alturaDoCabecalho = 0;

/** Um ResizeObserver falso: guarda o que observa e só avisa quando o teste chama `avisar()`. */
class ObservadorFalso {
  static instancias: ObservadorFalso[] = [];
  observados: Element[] = [];
  opcoes: ResizeObserverOptions | undefined;
  desligado = false;

  constructor(private readonly aoMudar: ResizeObserverCallback) {
    ObservadorFalso.instancias.push(this);
  }

  observe(elemento: Element, opcoes?: ResizeObserverOptions) {
    this.observados.push(elemento);
    this.opcoes = opcoes;
  }

  disconnect() {
    this.desligado = true;
  }

  avisar() {
    this.aoMudar([], this as unknown as ResizeObserver);
  }
}

/** O valor da variável no <html> ("" quando não está definida). */
function alturaPublicada(): string {
  return document.documentElement.style.getPropertyValue(VARIAVEL_DA_ALTURA);
}

/** O observador ligado agora (o StrictMode do dev pode criar e desligar um antes). */
function observadorAtivo(): ObservadorFalso {
  const ativos = ObservadorFalso.instancias.filter((observador) => !observador.desligado);
  expect(ativos).toHaveLength(1);
  return ativos[0];
}

beforeEach(() => {
  alturaDoCabecalho = 64.4;
  ObservadorFalso.instancias = [];
  vi.stubGlobal('ResizeObserver', ObservadorFalso);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return { height: this.tagName === 'HEADER' ? alturaDoCabecalho : 0 } as DOMRect;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

describe('altura real do cabeçalho no scroll-padding-top (useAlturaDoCabecalho)', () => {
  it('ao montar, publica no <html> a altura do cabeçalho arredondada para cima', () => {
    render(<Cabecalho />);

    // 64,4px vira 65px: arredondar para baixo deixaria o título 0,4px atrás do cabeçalho.
    expect(alturaPublicada()).toBe('65px');
  });

  it('quando o cabeçalho muda de altura (texto ampliado, nome que quebra a linha), atualiza o valor', () => {
    render(<Cabecalho />);
    const observador = observadorAtivo();
    expect(observador.observados).toEqual([document.querySelector('header')]);
    // A borda de baixo entra na conta: observa a caixa inteira, não só o conteúdo.
    expect(observador.opcoes).toEqual({ box: 'border-box' });

    alturaDoCabecalho = 249;
    observador.avisar();

    expect(alturaPublicada()).toBe('249px');
  });

  it('ao desmontar, para de observar e tira a variável: volta a valer o valor fixo do CSS', () => {
    const { unmount } = render(<Cabecalho />);
    const observador = observadorAtivo();

    unmount();

    expect(observador.desligado).toBe(true);
    expect(alturaPublicada()).toBe('');
  });

  it('sem ResizeObserver (navegador antigo), mede uma vez e não quebra a página', () => {
    vi.stubGlobal('ResizeObserver', undefined);

    expect(() => render(<Cabecalho />)).not.toThrow();
    expect(alturaPublicada()).toBe('65px');
  });

  it('o scroll-padding-top usa a altura medida, com 4rem de reserva, e ela já vale quando a âncora inicial rola', () => {
    expect(estilosGlobais).toMatch(/scroll-padding-top:\s*var\(--altura-real-do-cabecalho\)/);
    // Sem JavaScript (ou antes de medir), vale a altura do cabeçalho numa linha.
    expect(tema).toMatch(/--altura-real-do-cabecalho:\s*var\(--altura-cabecalho\)/);

    // Abrir em /#contato: o useAncoraInicial (T-023) rola logo na montagem. A altura tem de estar
    // publicada antes disso, senão o título ficaria atrás do cabeçalho alto.
    alturaDoCabecalho = 300;
    const alturasAoRolar: string[] = [];
    Element.prototype.scrollIntoView = () => {
      alturasAoRolar.push(alturaPublicada());
    };
    window.history.replaceState(null, '', '/#contato');

    try {
      render(<App />);
    } finally {
      // @ts-expect-error -- o jsdom não tem scrollIntoView; tiramos o nosso para não vazar.
      delete Element.prototype.scrollIntoView;
    }

    expect(alturasAoRolar).toEqual(['300px']);
  });
});
