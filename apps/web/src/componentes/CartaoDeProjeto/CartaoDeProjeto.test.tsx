import type { Projeto } from '@site-apresentacao/shared';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { conteudo } from '../../conteudo';
import CartaoDeProjeto from './CartaoDeProjeto';

const textos = conteudo.projetos;

const PROJETO_COMPLETO: Projeto = {
  titulo: 'Site de apresentação',
  descricao: 'Portfólio pessoal com front-end e API.',
  stacks: ['React', 'NestJS', 'TypeScript'],
  repositorio: 'https://github.com/George-Abreu-git/site_apresentacao',
  demo: 'https://site.exemplo.com',
  github: {
    disponivel: true,
    linguagem: 'TypeScript',
    estrelas: 1234,
    // Meio-dia em UTC: em qualquer fuso do Brasil continua sendo o dia 1º.
    ultimaAtualizacao: '2026-10-01T12:00:00Z',
  },
};

const PROJETO_SO_CURADO: Projeto = {
  titulo: 'Projeto sem repositório',
  descricao: 'Só os dados do arquivo curado.',
  stacks: ['Node.js'],
};

/** O valor (<dd>) que vem logo depois de um rótulo (<dt>) na lista de dados vivos. */
function valorDoDado(rotulo: string): string | null | undefined {
  return screen.getByText(rotulo, { selector: 'dt' }).nextElementSibling?.textContent;
}

describe('CartaoDeProjeto (RF-05)', () => {
  it('é um artigo com o nome do projeto, e o título é de nível 3', () => {
    render(<CartaoDeProjeto projeto={PROJETO_COMPLETO} />);

    const cartao = screen.getByRole('article', { name: PROJETO_COMPLETO.titulo });
    expect(within(cartao).getByRole('heading', { level: 3, name: PROJETO_COMPLETO.titulo })).toBeInTheDocument();
  });

  it('mostra a descrição', () => {
    render(<CartaoDeProjeto projeto={PROJETO_COMPLETO} />);

    expect(screen.getByText(PROJETO_COMPLETO.descricao).tagName).toBe('P');
  });

  it('mostra as stacks numa lista com nome, na ordem da API', () => {
    render(<CartaoDeProjeto projeto={PROJETO_COMPLETO} />);

    const lista = screen.getByRole('list', { name: textos.rotuloStacks });
    const itens = within(lista).getAllByRole('listitem').map((item) => item.textContent);
    expect(itens).toEqual(PROJETO_COMPLETO.stacks);
  });

  it('tem os links do repositório e da demo, abrindo em nova aba', () => {
    render(<CartaoDeProjeto projeto={PROJETO_COMPLETO} />);

    const repositorio = screen.getByRole('link', { name: new RegExp(textos.linkRepositorio) });
    expect(repositorio).toHaveAttribute('href', PROJETO_COMPLETO.repositorio);
    expect(repositorio).toHaveAttribute('target', '_blank');

    const demo = screen.getByRole('link', { name: new RegExp(textos.linkDemo) });
    expect(demo).toHaveAttribute('href', PROJETO_COMPLETO.demo);
    expect(demo).toHaveAttribute('target', '_blank');
  });

  it('mostra os dados vivos do GitHub: linguagem, estrelas e data da última atualização', () => {
    render(<CartaoDeProjeto projeto={PROJETO_COMPLETO} />);

    expect(valorDoDado(textos.linguagem)).toBe('TypeScript');
    // Número no formato brasileiro, com ponto separando o milhar.
    expect(valorDoDado(textos.estrelas)).toBe('1.234');
    expect(valorDoDado(textos.ultimaAtualizacao)).toBe('01/10/2026');
  });

  it('a data vai num <time> com o valor original, legível por máquinas', () => {
    render(<CartaoDeProjeto projeto={PROJETO_COMPLETO} />);

    expect(screen.getByText('01/10/2026').closest('time')).toHaveAttribute('datetime', '2026-10-01T12:00:00Z');
  });

  it('sem linguagem identificada pelo GitHub, mostra só estrelas e data', () => {
    const projeto: Projeto = {
      ...PROJETO_COMPLETO,
      github: { disponivel: true, linguagem: null, estrelas: 0, ultimaAtualizacao: '2026-10-01T12:00:00Z' },
    };

    render(<CartaoDeProjeto projeto={projeto} />);

    expect(screen.queryByText(textos.linguagem)).not.toBeInTheDocument();
    expect(valorDoDado(textos.estrelas)).toBe('0');
  });

  it('com o GitHub indisponível, mostra só os dados curados', () => {
    render(<CartaoDeProjeto projeto={{ ...PROJETO_COMPLETO, github: { disponivel: false } }} />);

    expect(screen.queryByText(textos.estrelas)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: PROJETO_COMPLETO.titulo })).toBeInTheDocument();
  });

  it('projeto só com dados curados: sem links e sem dados vivos', () => {
    render(<CartaoDeProjeto projeto={PROJETO_SO_CURADO} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText(textos.estrelas)).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: textos.rotuloStacks })).toHaveTextContent('Node.js');
  });
});
