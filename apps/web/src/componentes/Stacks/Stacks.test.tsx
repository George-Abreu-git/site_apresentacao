import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { conteudo } from '../../conteudo';
import type { CategoriaDeStack } from '../../conteudo';
import Stacks from './Stacks';

const { secoes, stacks } = conteudo;

describe('Stacks (RF-04)', () => {
  it('é a seção #stacks, com o título de nível 2', () => {
    render(<Stacks />);

    expect(screen.getByRole('region', { name: secoes.stacks })).toHaveAttribute('id', 'stacks');
  });

  it('o arquivo de conteúdo tem categorias, e nenhuma está vazia', () => {
    expect(stacks.categorias.length).toBeGreaterThan(0);
    for (const categoria of stacks.categorias) {
      expect(categoria.tecnologias.length).toBeGreaterThan(0);
    }
  });

  it('mostra cada categoria do arquivo de conteúdo como subtítulo de nível 3', () => {
    render(<Stacks />);

    for (const categoria of stacks.categorias) {
      expect(screen.getByRole('heading', { level: 3, name: categoria.titulo })).toBeInTheDocument();
    }
  });

  it('mostra as tecnologias de cada categoria numa lista própria', () => {
    render(<Stacks />);

    const listas = screen.getAllByRole('list');
    expect(listas).toHaveLength(stacks.categorias.length);

    stacks.categorias.forEach((categoria, indice) => {
      // A lista é rotulada pelo subtítulo: o leitor de tela anuncia "lista Front-end, 3 itens".
      const lista = screen.getByRole('list', { name: categoria.titulo });
      expect(lista).toBe(listas[indice]);
      const itens = within(lista).getAllByRole('listitem').map((item) => item.textContent);
      expect(itens).toEqual(categoria.tecnologias);
    });
  });

  it('uma tecnologia nova no conteúdo aparece na tela sem mudar o componente', () => {
    const categoriasComNovidade: CategoriaDeStack[] = [
      { titulo: 'Banco de dados', tecnologias: ['PostgreSQL'] },
      { titulo: 'Front-end', tecnologias: ['React', 'Tecnologia nova'] },
    ];

    render(<Stacks categorias={categoriasComNovidade} />);

    const lista = screen.getByRole('list', { name: 'Front-end' });
    expect(within(lista).getByText('Tecnologia nova').tagName).toBe('LI');
    expect(screen.getByRole('list', { name: 'Banco de dados' })).toHaveTextContent('PostgreSQL');
  });
});
