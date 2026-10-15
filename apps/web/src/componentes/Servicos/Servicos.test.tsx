import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { conteudo } from '../../conteudo';
import Servicos from './Servicos';

const { secoes, servicos } = conteudo;

describe('Servicos (RF-07)', () => {
  it('é a seção #servicos, com o título de nível 2', () => {
    render(<Servicos />);

    expect(screen.getByRole('region', { name: secoes.servicos })).toHaveAttribute('id', 'servicos');
  });

  it('mostra o que é oferecido, em lista', () => {
    render(<Servicos />);

    expect(screen.getByRole('heading', { level: 3, name: servicos.oQueOfereco.titulo })).toBeInTheDocument();
    for (const item of servicos.oQueOfereco.itens) {
      expect(screen.getByText(item).tagName).toBe('LI');
    }
  });

  it('mostra para quem é o serviço', () => {
    render(<Servicos />);

    expect(screen.getByRole('heading', { level: 3, name: servicos.paraQuem.titulo })).toBeInTheDocument();
    expect(screen.getByText(servicos.paraQuem.texto)).toBeInTheDocument();
  });

  it('mostra como funciona, em passos numerados (lista ordenada)', () => {
    render(<Servicos />);

    expect(screen.getByRole('heading', { level: 3, name: servicos.comoFunciona.titulo })).toBeInTheDocument();
    const passos = servicos.comoFunciona.itens.map((passo) => screen.getByText(passo));
    for (const passo of passos) {
      expect(passo.closest('ol')).not.toBeNull();
    }
  });

  it('tem um botão que leva à seção Contato', () => {
    render(<Servicos />);

    const regiao = screen.getByRole('region', { name: secoes.servicos });
    expect(within(regiao).getByRole('link', { name: servicos.botaoContato })).toHaveAttribute('href', '#contato');
  });
});
