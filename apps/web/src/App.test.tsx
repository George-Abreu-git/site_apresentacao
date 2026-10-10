import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App (página placeholder)', () => {
  it('mostra o nome do George como título principal', () => {
    render(<App />);

    // Buscar pelo papel (role) é como um leitor de tela enxerga a página.
    expect(screen.getByRole('heading', { level: 1, name: 'George Siqueira' })).toBeInTheDocument();
  });

  it('avisa que o site está em construção dentro do conteúdo principal', () => {
    render(<App />);

    expect(screen.getByRole('main')).toHaveTextContent(/site em construção/i);
  });
});
