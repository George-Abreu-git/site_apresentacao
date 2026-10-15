import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { conteudo } from '../../conteudo';
import Contato from './Contato';

const { secoes, contato, links } = conteudo;

function regiaoContato() {
  return screen.getByRole('region', { name: secoes.contato });
}

describe('Contato (RF-08)', () => {
  it('é a seção #contato, com o título de nível 2 e um texto de convite', () => {
    render(<Contato />);

    expect(regiaoContato()).toHaveAttribute('id', 'contato');
    expect(screen.getByText(contato.texto)).toBeInTheDocument();
  });

  it('tem o e-mail como link mailto:, que abre o cliente de e-mail com o endereço preenchido', () => {
    render(<Contato />);

    const email = within(regiaoContato()).getByRole('link', { name: new RegExp(contato.linkEmail) });
    expect(email).toHaveAttribute('href', `mailto:${links.email}`);
    // mailto: abre o programa de e-mail, não uma página: não faz sentido abrir nova aba.
    expect(email).not.toHaveAttribute('target');
  });

  it('tem LinkedIn e GitHub abrindo em nova aba', () => {
    render(<Contato />);

    const linkedin = within(regiaoContato()).getByRole('link', { name: new RegExp(contato.linkLinkedin) });
    const github = within(regiaoContato()).getByRole('link', { name: new RegExp(contato.linkGithub) });

    expect(linkedin).toHaveAttribute('href', links.linkedin);
    expect(linkedin).toHaveAttribute('target', '_blank');
    expect(github).toHaveAttribute('href', links.github);
    expect(github).toHaveAttribute('target', '_blank');
  });
});
