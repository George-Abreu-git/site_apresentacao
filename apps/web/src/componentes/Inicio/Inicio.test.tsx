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

  it('mostra os elementos na ordem de leitura: nome, título profissional, frase e atalhos', () => {
    const { container } = render(<Inicio />);

    const textos = [...container.querySelectorAll('h1, p, a')].map((elemento) => elemento.textContent);
    expect(textos).toEqual([
      pessoa.nome,
      inicio.tituloProfissional,
      inicio.frase,
      inicio.atalhoProjetos,
      inicio.atalhoContato,
    ]);
  });

  it('o atalho para Projetos é o principal e o de Contato é o secundário', () => {
    render(<Inicio />);

    expect(screen.getByRole('link', { name: inicio.atalhoProjetos }).className).toMatch(/principal/);
    expect(screen.getByRole('link', { name: inicio.atalhoContato }).className).toMatch(/secundario/);
  });

  it('tem só os dois atalhos e nenhum subtítulo de nível 2 (o Início não é uma Secao comum)', () => {
    render(<Inicio />);

    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });
});
