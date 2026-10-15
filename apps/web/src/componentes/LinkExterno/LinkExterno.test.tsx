import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { conteudo } from '../../conteudo';
import LinkExterno from './LinkExterno';

describe('LinkExterno', () => {
  it('abre o endereço em nova aba, sem dar à outra página acesso a esta (rel="noopener noreferrer")', () => {
    render(<LinkExterno href="https://github.com/exemplo">GitHub</LinkExterno>);

    const link = screen.getByRole('link', { name: /GitHub/ });
    expect(link).toHaveAttribute('href', 'https://github.com/exemplo');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('avisa o leitor de tela que o link abre em nova aba', () => {
    render(<LinkExterno href="https://github.com/exemplo">GitHub</LinkExterno>);

    expect(screen.getByRole('link')).toHaveAccessibleName(`GitHub ${conteudo.geral.abreEmNovaAba}`);
  });
});
