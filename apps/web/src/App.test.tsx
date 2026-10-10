import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App (layout base da página única)', () => {
  it('mostra o nome do George como único título principal', () => {
    render(<App />);

    // Buscar pelo papel (role) é como um leitor de tela enxerga a página.
    expect(screen.getByRole('heading', { level: 1, name: 'George Siqueira' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('avisa que o site está em construção dentro do conteúdo principal', () => {
    render(<App />);

    expect(screen.getByRole('main')).toHaveTextContent(/site em construção/i);
  });

  it('tem a estrutura semântica: um cabeçalho, uma navegação, um conteúdo principal e um rodapé', () => {
    render(<App />);

    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
  });

  it('tem as seis seções dentro do conteúdo principal', () => {
    render(<App />);

    const principal = screen.getByRole('main');
    const secoes = within(principal).getAllByRole('region');
    expect(secoes.map((secao) => secao.id)).toEqual([
      'inicio',
      'sobre',
      'stacks',
      'projetos',
      'servicos',
      'contato',
    ]);
  });

  it('cada link do menu leva a uma seção que existe na página', () => {
    render(<App />);

    const navegacao = screen.getByRole('navigation', { name: 'Navegação principal' });
    const links = within(navegacao).getAllByRole('link');
    expect(links).toHaveLength(6);

    for (const link of links) {
      const alvo = link.getAttribute('href')!.replace('#', '');
      expect(document.getElementById(alvo)?.tagName).toBe('SECTION');
    }
  });
});
