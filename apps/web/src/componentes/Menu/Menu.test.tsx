import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ItemDeSecao } from '../../secoes';
import Menu from './Menu';

const ITENS: ItemDeSecao[] = [
  { id: 'inicio', titulo: 'Início' },
  { id: 'contato', titulo: 'Contato' },
];

/** O botão que abre e fecha a lista no celular. */
function botaoDoMenu() {
  return screen.getByRole('button', { name: 'Menu' });
}

describe('Menu', () => {
  it('é uma navegação com nome, para o leitor de tela anunciar "Navegação principal"', () => {
    render(<Menu itens={ITENS} />);

    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
  });

  it('tem um link para cada seção, apontando para a âncora do id', () => {
    render(<Menu itens={ITENS} />);

    const navegacao = screen.getByRole('navigation');
    expect(within(navegacao).getByRole('link', { name: 'Início' })).toHaveAttribute('href', '#inicio');
    expect(within(navegacao).getByRole('link', { name: 'Contato' })).toHaveAttribute('href', '#contato');
  });

  it('começa fechado e diz qual lista o botão controla', () => {
    render(<Menu itens={ITENS} />);

    const botao = botaoDoMenu();
    expect(botao).toHaveAttribute('aria-expanded', 'false');

    // aria-controls aponta para o id da lista: é assim que a tecnologia assistiva liga os dois.
    const idDaLista = botao.getAttribute('aria-controls');
    expect(idDaLista).toBeTruthy();
    expect(document.getElementById(idDaLista!)).toBe(screen.getByRole('list'));
  });

  it('abre e fecha a lista ao clicar no botão', () => {
    render(<Menu itens={ITENS} />);

    fireEvent.click(botaoDoMenu());
    expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(botaoDoMenu());
    expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'false');
  });

  it('fecha a lista ao escolher uma seção', () => {
    render(<Menu itens={ITENS} />);

    fireEvent.click(botaoDoMenu());
    fireEvent.click(screen.getByRole('link', { name: 'Contato' }));

    expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'false');
  });

  it('fecha com Esc e devolve o foco ao botão, para quem navega pelo teclado', () => {
    render(<Menu itens={ITENS} />);

    fireEvent.click(botaoDoMenu());
    const link = screen.getByRole('link', { name: 'Início' });
    link.focus();
    fireEvent.keyDown(link, { key: 'Escape' });

    expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'false');
    expect(botaoDoMenu()).toHaveFocus();
  });

  it('Esc com a lista fechada não mexe no foco (não "rouba" o foco de quem está em outro lugar)', () => {
    render(<Menu itens={ITENS} />);

    const link = screen.getByRole('link', { name: 'Contato' });
    link.focus();
    fireEvent.keyDown(link, { key: 'Escape' });

    expect(link).toHaveFocus();
    expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'false');
  });

  it('outras teclas (Enter, Tab) não fecham a lista aberta', () => {
    render(<Menu itens={ITENS} />);

    fireEvent.click(botaoDoMenu());
    const link = screen.getByRole('link', { name: 'Início' });
    fireEvent.keyDown(link, { key: 'Enter' });
    fireEvent.keyDown(link, { key: 'Tab' });

    expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'true');
  });

  it('escolher uma seção com a lista fechada (desktop) não a abre', () => {
    render(<Menu itens={ITENS} />);

    fireEvent.click(screen.getByRole('link', { name: 'Início' }));

    expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'false');
  });

  it('mantém a ordem recebida, com cada link dentro de um item de lista', () => {
    const itens: ItemDeSecao[] = [
      { id: 'sobre', titulo: 'Sobre' },
      { id: 'stacks', titulo: 'Stacks' },
      { id: 'projetos', titulo: 'Projetos' },
    ];
    render(<Menu itens={itens} />);

    const itensDaLista = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(itensDaLista.map((item) => item.textContent)).toEqual(['Sobre', 'Stacks', 'Projetos']);
    for (const item of itensDaLista) {
      expect(within(item).getByRole('link')).toBeInTheDocument();
    }
  });

  it('com a lista aberta, a lista ganha a classe "aberta" (que o CSS usa para mostrá-la no celular)', () => {
    render(<Menu itens={ITENS} />);

    // Nos testes o CSS não é processado, mas o nome da classe continua no className.
    expect(screen.getByRole('list').className).not.toMatch(/aberta/);
    fireEvent.click(botaoDoMenu());
    expect(screen.getByRole('list').className).toMatch(/aberta/);
  });

  it('usa elementos nativos (button e a href), que já recebem foco pelo Tab', () => {
    render(<Menu itens={ITENS} />);

    expect(botaoDoMenu().tagName).toBe('BUTTON');
    expect(botaoDoMenu()).toHaveAttribute('type', 'button');
    for (const link of screen.getAllByRole('link')) {
      expect(link.tagName).toBe('A');
    }
  });
});
