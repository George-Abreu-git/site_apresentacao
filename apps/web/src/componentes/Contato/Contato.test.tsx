import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { conteudo } from '../../conteudo';
import Contato from './Contato';

const { secoes, contato, links, geral } = conteudo;

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

  it('tem exatamente três canais, numa lista, na ordem LinkedIn, e-mail e GitHub', () => {
    render(<Contato />);

    const itens = within(within(regiaoContato()).getByRole('list')).getAllByRole('listitem');
    expect(itens).toHaveLength(3);
    expect(itens.map((item) => within(item).getByRole('link').getAttribute('href'))).toEqual([
      links.linkedin,
      `mailto:${links.email}`,
      links.github,
    ]);
  });

  it('os links externos protegem a página (rel="noopener noreferrer") e avisam o leitor de tela da nova aba', () => {
    render(<Contato />);

    const linkedin = screen.getByRole('link', { name: `${contato.linkLinkedin} ${geral.abreEmNovaAba}` });
    const github = screen.getByRole('link', { name: `${contato.linkGithub} ${geral.abreEmNovaAba}` });
    expect(linkedin).toHaveAttribute('rel', 'noopener noreferrer');
    expect(github).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('o link de e-mail não diz que abre nova aba (ele abre o programa de e-mail)', () => {
    render(<Contato />);

    expect(screen.getByRole('link', { name: contato.linkEmail })).toHaveAccessibleName(contato.linkEmail);
  });
});
