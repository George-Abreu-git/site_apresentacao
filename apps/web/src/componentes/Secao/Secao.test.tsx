import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Secao from './Secao';

describe('Secao', () => {
  it('é uma região com o id da âncora e o nome tirado do próprio título', () => {
    render(<Secao id="sobre" titulo="Sobre" />);

    // Um <section> só vira região (landmark) quando tem nome; aqui o nome vem do <h2>.
    const regiao = screen.getByRole('region', { name: 'Sobre' });
    expect(regiao.tagName).toBe('SECTION');
    expect(regiao).toHaveAttribute('id', 'sobre');
  });

  it('mostra o título como subtítulo de nível 2 (o nível 1 é o nome do George)', () => {
    render(<Secao id="stacks" titulo="Stacks" />);

    expect(screen.getByRole('heading', { level: 2, name: 'Stacks' })).toBeInTheDocument();
  });

  it('mostra o conteúdo recebido', () => {
    render(
      <Secao id="contato" titulo="Contato">
        <p>Conteúdo de teste</p>
      </Secao>,
    );

    expect(screen.getByRole('region', { name: 'Contato' })).toHaveTextContent('Conteúdo de teste');
  });
});
