import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { conteudo } from '../../conteudo';
import Sobre from './Sobre';

const { secoes, sobre, links } = conteudo;

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
});
