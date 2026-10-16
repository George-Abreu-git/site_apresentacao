import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { conteudo } from '../../conteudo';
import Sobre from './Sobre';

const { secoes, sobre, links, geral } = conteudo;

describe('Sobre (RF-03)', () => {
  it('é a seção #sobre, com o título de nível 2', () => {
    render(<Sobre />);

    expect(screen.getByRole('region', { name: secoes.sobre })).toHaveAttribute('id', 'sobre');
    expect(screen.getByRole('heading', { level: 2, name: secoes.sobre })).toBeInTheDocument();
  });

  it('mostra o resumo profissional', () => {
    render(<Sobre />);

    for (const paragrafo of sobre.paragrafos) {
      expect(screen.getByText(paragrafo)).toBeInTheDocument();
    }
  });

  it('tem links para o LinkedIn e o GitHub, abrindo em nova aba', () => {
    render(<Sobre />);

    const regiao = screen.getByRole('region', { name: secoes.sobre });
    const linkedin = within(regiao).getByRole('link', { name: new RegExp(sobre.linkLinkedin) });
    const github = within(regiao).getByRole('link', { name: new RegExp(sobre.linkGithub) });

    expect(linkedin).toHaveAttribute('href', links.linkedin);
    expect(github).toHaveAttribute('href', links.github);
    expect(linkedin).toHaveAttribute('target', '_blank');
    expect(github).toHaveAttribute('target', '_blank');
  });

  it('os parágrafos aparecem como <p>, na ordem do arquivo de conteúdo', () => {
    render(<Sobre />);

    const regiao = screen.getByRole('region', { name: secoes.sobre });
    const paragrafos = [...regiao.querySelectorAll('p')].map((p) => p.textContent);
    expect(paragrafos).toEqual(sobre.paragrafos);
  });

  it('os links abrem em nova aba com segurança (rel="noopener noreferrer")', () => {
    render(<Sobre />);

    const links = within(screen.getByRole('region', { name: secoes.sobre })).getAllByRole('link');
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('o nome lido pelo leitor de tela avisa que o link abre em nova aba', () => {
    render(<Sobre />);

    expect(screen.getByRole('link', { name: `${sobre.linkLinkedin} ${geral.abreEmNovaAba}` })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: `${sobre.linkGithub} ${geral.abreEmNovaAba}` })).toBeInTheDocument();
  });
});
