import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { conteudo } from '../../conteudo';
import Rodape from './Rodape';

describe('Rodape', () => {
  it('é o rodapé da página (contentinfo) com o nome do George e o ano atual', () => {
    render(<Rodape />);

    const rodape = screen.getByRole('contentinfo');
    expect(rodape.tagName).toBe('FOOTER');
    expect(rodape).toHaveTextContent(conteudo.pessoa.nome);
    expect(rodape).toHaveTextContent(String(new Date().getFullYear()));
  });
});
