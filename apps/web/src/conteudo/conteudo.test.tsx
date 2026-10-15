import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { conteudo } from '.';

/** Junta todos os textos do arquivo de conteúdo, em qualquer nível do objeto. */
function textosDoConteudo(valor: unknown): string[] {
  if (typeof valor === 'string') return [valor];
  if (Array.isArray(valor)) return valor.flatMap(textosDoConteudo);
  if (valor && typeof valor === 'object') return Object.values(valor).flatMap(textosDoConteudo);
  return [];
}

/** Todos os pedaços de texto que aparecem na página (cada nó de texto do DOM). */
function textosNaPagina(raiz: HTMLElement): string[] {
  // TreeWalker percorre a árvore do DOM; com SHOW_TEXT ele visita só os nós de texto.
  const caminhante = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  const textos: string[] = [];
  while (caminhante.nextNode()) {
    const texto = caminhante.currentNode.textContent?.trim();
    if (texto) textos.push(texto);
  }
  return textos;
}

/** Números e símbolos não são idioma (ex.: o "©" e o ano no rodapé). */
const SEM_IDIOMA = /^[\d\s©]+$/;

describe('textos separados do código (RF-09)', () => {
  it('todo texto visível na página vem do arquivo de conteúdo', () => {
    const { container } = render(<App />);
    const permitidos = new Set(textosDoConteudo(conteudo));

    const textosForaDoConteudo = textosNaPagina(container).filter(
      (texto) => !permitidos.has(texto) && !SEM_IDIOMA.test(texto),
    );

    expect(textosForaDoConteudo).toEqual([]);
  });

  it('os rótulos lidos pelo leitor de tela (aria-label) também vêm do arquivo de conteúdo', () => {
    const { container } = render(<App />);
    const permitidos = new Set(textosDoConteudo(conteudo));

    const rotulos = [...container.querySelectorAll('[aria-label]')].map((el) => el.getAttribute('aria-label'));

    expect(rotulos.length).toBeGreaterThan(0);
    for (const rotulo of rotulos) {
      expect(permitidos).toContain(rotulo);
    }
  });
});
