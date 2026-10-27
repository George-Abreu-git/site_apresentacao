import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { ItemDeSecao } from '../../secoes';
import Menu from './Menu';
// `?raw` traz o CSS como texto: o jsdom não calcula layout, então o teste confere as regras.
import estilosDoMenu from './Menu.module.css?raw';

/** O CSS sem comentários, para um exemplo dentro de um comentário não contar como regra. */
const cssDoMenu = estilosDoMenu.replace(/\/\*[\s\S]*?\*\//g, '');

/** O corpo da primeira regra de um seletor exato (ex.: `.aberta`), fora das media queries. */
function regraDoCelular(seletor: string): string {
  const inicioDaMedia = cssDoMenu.indexOf('@media');
  const base = inicioDaMedia === -1 ? cssDoMenu : cssDoMenu.slice(0, inicioDaMedia);
  const regra = [...base.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(([, nome]) => nome.trim() === seletor);
  return regra?.[2] ?? '';
}

/** O texto do bloco `@media (min-width: 48rem)` (tablet/desktop). */
function blocoDoDesktop(): string {
  const inicio = cssDoMenu.indexOf('@media (min-width: 48rem)');
  return inicio === -1 ? '' : cssDoMenu.slice(inicio);
}

const ITENS: ItemDeSecao[] = [
  { id: 'inicio', titulo: 'Início' },
  { id: 'contato', titulo: 'Contato' },
];

/**
 * O Menu é controlado (o estado "aberto" vem de quem o usa, o Cabecalho; T-022).
 * Este invólucro guarda o estado como o Cabecalho faz, para testar o Menu sozinho.
 */
function MenuComEstado({ itens }: { itens: readonly ItemDeSecao[] }) {
  const [aberto, setAberto] = useState(false);
  return (
    <Menu
      itens={itens}
      aberto={aberto}
      aoAlternar={() => setAberto((estavaAberto) => !estavaAberto)}
      aoFechar={() => setAberto(false)}
    />
  );
}

/** O botão que abre e fecha a lista no celular. */
function botaoDoMenu() {
  return screen.getByRole('button', { name: 'Menu' });
}

describe('Menu', () => {
  it('é uma navegação com nome, para o leitor de tela anunciar "Navegação principal"', () => {
    render(<MenuComEstado itens={ITENS} />);

    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
  });

  it('tem um link para cada seção, apontando para a âncora do id', () => {
    render(<MenuComEstado itens={ITENS} />);

    const navegacao = screen.getByRole('navigation');
    expect(within(navegacao).getByRole('link', { name: 'Início' })).toHaveAttribute('href', '#inicio');
    expect(within(navegacao).getByRole('link', { name: 'Contato' })).toHaveAttribute('href', '#contato');
  });

  it('começa fechado e diz qual lista o botão controla', () => {
    render(<MenuComEstado itens={ITENS} />);

    const botao = botaoDoMenu();
    expect(botao).toHaveAttribute('aria-expanded', 'false');

    // aria-controls aponta para o id da lista: é assim que a tecnologia assistiva liga os dois.
    const idDaLista = botao.getAttribute('aria-controls');
    expect(idDaLista).toBeTruthy();
    expect(document.getElementById(idDaLista!)).toBe(screen.getByRole('list'));
  });

  it('abre e fecha a lista ao clicar no botão', () => {
    render(<MenuComEstado itens={ITENS} />);

    fireEvent.click(botaoDoMenu());
    expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(botaoDoMenu());
    expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'false');
  });

  it('fecha a lista ao escolher uma seção', () => {
    render(<MenuComEstado itens={ITENS} />);

    fireEvent.click(botaoDoMenu());
    fireEvent.click(screen.getByRole('link', { name: 'Contato' }));

    expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'false');
  });

  it('fecha com Esc e devolve o foco ao botão, para quem navega pelo teclado', () => {
    render(<MenuComEstado itens={ITENS} />);

    fireEvent.click(botaoDoMenu());
    const link = screen.getByRole('link', { name: 'Início' });
    link.focus();
    fireEvent.keyDown(link, { key: 'Escape' });

    expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'false');
    expect(botaoDoMenu()).toHaveFocus();
  });

  it('Esc com a lista fechada não mexe no foco (não "rouba" o foco de quem está em outro lugar)', () => {
    render(<MenuComEstado itens={ITENS} />);

    const link = screen.getByRole('link', { name: 'Contato' });
    link.focus();
    fireEvent.keyDown(link, { key: 'Escape' });

    expect(link).toHaveFocus();
    expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'false');
  });

  it('outras teclas (Enter, Tab) não fecham a lista aberta', () => {
    render(<MenuComEstado itens={ITENS} />);

    fireEvent.click(botaoDoMenu());
    const link = screen.getByRole('link', { name: 'Início' });
    fireEvent.keyDown(link, { key: 'Enter' });
    fireEvent.keyDown(link, { key: 'Tab' });

    expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'true');
  });

  it('escolher uma seção com a lista fechada (desktop) não a abre', () => {
    render(<MenuComEstado itens={ITENS} />);

    fireEvent.click(screen.getByRole('link', { name: 'Início' }));

    expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'false');
  });

  it('mantém a ordem recebida, com cada link dentro de um item de lista', () => {
    const itens: ItemDeSecao[] = [
      { id: 'sobre', titulo: 'Sobre' },
      { id: 'stacks', titulo: 'Stacks' },
      { id: 'projetos', titulo: 'Projetos' },
    ];
    render(<MenuComEstado itens={itens} />);

    const itensDaLista = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(itensDaLista.map((item) => item.textContent)).toEqual(['Sobre', 'Stacks', 'Projetos']);
    for (const item of itensDaLista) {
      expect(within(item).getByRole('link')).toBeInTheDocument();
    }
  });

  it('com a lista aberta, a lista ganha a classe "aberta" (que o CSS usa para mostrá-la no celular)', () => {
    render(<MenuComEstado itens={ITENS} />);

    // Nos testes o CSS não é processado, mas o nome da classe continua no className.
    expect(screen.getByRole('list').className).not.toMatch(/aberta/);
    fireEvent.click(botaoDoMenu());
    expect(screen.getByRole('list').className).toMatch(/aberta/);
  });

  it('usa elementos nativos (button e a href), que já recebem foco pelo Tab', () => {
    render(<MenuComEstado itens={ITENS} />);

    expect(botaoDoMenu().tagName).toBe('BUTTON');
    expect(botaoDoMenu()).toHaveAttribute('type', 'button');
    for (const link of screen.getAllByRole('link')) {
      expect(link.tagName).toBe('A');
    }
  });

  // T-024 (BUG-Q3 da T-016): a lista aberta é `absolute` dentro do cabeçalho preso ao topo (sticky),
  // então rolar a página não a move. Numa tela baixa (celular deitado, ou o texto a 200%), ela
  // precisa caber na altura que sobra abaixo do cabeçalho e rolar por dentro.
  describe('lista aberta numa tela baixa (T-024)', () => {
    it('no celular, a altura máxima é a da janela menos a do cabeçalho (medida de verdade, T-030)', () => {
      expect(regraDoCelular('.aberta')).toMatch(
        /max-height:\s*calc\(100dvh - var\(--altura-real-do-cabecalho\) \+ 1px\)/,
      );
    });

    it('no celular, o que não cabe rola por dentro da lista (e nada é escondido)', () => {
      expect(regraDoCelular('.aberta')).toMatch(/overflow-y:\s*auto/);
      expect(regraDoCelular('.aberta')).not.toMatch(/overflow(-y)?:\s*(hidden|clip)/);
    });

    it('ao chegar ao fim da lista, a rolagem não passa para a página por baixo', () => {
      expect(regraDoCelular('.aberta')).toMatch(/overscroll-behavior:\s*contain/);
    });

    it('a linha de baixo da lista não ocupa espaço da área que rola (sombra, não borda)', () => {
      expect(regraDoCelular('.aberta')).toMatch(/box-shadow:\s*0 1px 0 var\(--cor-borda\)/);
      expect(regraDoCelular('.aberta')).not.toMatch(/border-bottom/);
    });

    it('a partir de 48rem a lista fica em linha, sem limite de altura nem rolagem própria', () => {
      const desktop = blocoDoDesktop();

      expect(desktop).toMatch(/\.lista,\s*\.aberta\s*\{[^}]*max-height:\s*none/);
      expect(desktop).toMatch(/\.lista,\s*\.aberta\s*\{[^}]*overflow-y:\s*visible/);
      expect(desktop).toMatch(/\.lista,\s*\.aberta\s*\{[^}]*box-shadow:\s*none/);
    });
  });
});
