import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { conteudo } from '../../conteudo';
import Inicio from './Inicio';

const { pessoa, inicio } = conteudo;

describe('Inicio (RF-02)', () => {
  it('é a seção #inicio, com o nome do George como título de nível 1', () => {
    render(<Inicio />);

    const regiao = screen.getByRole('region', { name: pessoa.nome });
    expect(regiao).toHaveAttribute('id', 'inicio');
    expect(screen.getByRole('heading', { level: 1, name: pessoa.nome })).toBeInTheDocument();
  });

  it('mostra o título profissional e a frase de apresentação', () => {
    render(<Inicio />);

    expect(screen.getByText(inicio.tituloProfissional)).toBeInTheDocument();
    expect(screen.getByText(inicio.frase)).toBeInTheDocument();
  });

  it('tem atalhos para as seções Projetos e Contato', () => {
    render(<Inicio />);

    expect(screen.getByRole('link', { name: inicio.atalhoProjetos })).toHaveAttribute('href', '#projetos');
    expect(screen.getByRole('link', { name: inicio.atalhoContato })).toHaveAttribute('href', '#contato');
  });
});
