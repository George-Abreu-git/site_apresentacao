import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Inicio from './Inicio';

describe('Inicio', () => {
  it('é a seção #inicio, com o nome do George como título de nível 1', () => {
    render(<Inicio />);

    const regiao = screen.getByRole('region', { name: 'George Siqueira' });
    expect(regiao).toHaveAttribute('id', 'inicio');
    expect(screen.getByRole('heading', { level: 1, name: 'George Siqueira' })).toBeInTheDocument();
  });

  it('avisa que o site está em construção', () => {
    render(<Inicio />);

    expect(screen.getByText('Site em construção.')).toBeInTheDocument();
  });
});
