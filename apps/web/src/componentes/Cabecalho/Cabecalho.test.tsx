import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Cabecalho from './Cabecalho';

describe('Cabecalho', () => {
  it('é o cabeçalho da página (banner) e contém a navegação principal', () => {
    render(<Cabecalho />);

    const cabecalho = screen.getByRole('banner');
    expect(cabecalho.tagName).toBe('HEADER');
    expect(within(cabecalho).getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
  });

  it('tem o nome do George como link de volta ao início', () => {
    render(<Cabecalho />);

    expect(screen.getByRole('link', { name: 'George Siqueira' })).toHaveAttribute('href', '#inicio');
  });

  it('leva a todas as seis seções pelo menu', () => {
    render(<Cabecalho />);

    const navegacao = screen.getByRole('navigation', { name: 'Navegação principal' });
    expect(within(navegacao).getAllByRole('link')).toHaveLength(6);
  });
});
