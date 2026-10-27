import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { conteudo } from '../../conteudo';
import { SECOES } from '../../secoes';
import estilosGlobais from '../../index.css?raw';
import Cabecalho from './Cabecalho';
// `?raw` traz o arquivo como texto (liberado só para CSS em vite.config.ts): o teste lê as regras.
import estilosDoCabecalho from './Cabecalho.module.css?raw';

describe('Cabecalho', () => {
  it('é o cabeçalho da página (banner) e contém a navegação principal', () => {
    render(<Cabecalho />);

    const cabecalho = screen.getByRole('banner');
    expect(cabecalho.tagName).toBe('HEADER');
    expect(within(cabecalho).getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
  });

  it('tem o nome do George como link de volta ao início', () => {
    render(<Cabecalho />);

    expect(screen.getByRole('link', { name: conteudo.pessoa.nome })).toHaveAttribute('href', '#inicio');
  });

  it('leva a todas as seis seções pelo menu', () => {
    render(<Cabecalho />);

    const navegacao = screen.getByRole('navigation', { name: 'Navegação principal' });
    expect(within(navegacao).getAllByRole('link')).toHaveLength(6);
  });

  it('os links do menu seguem a lista de seções (SECOES), na mesma ordem e com as mesmas âncoras', () => {
    render(<Cabecalho />);

    const navegacao = screen.getByRole('navigation', { name: 'Navegação principal' });
    const links = within(navegacao).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual(
      SECOES.map((secao) => [secao.titulo, `#${secao.id}`]),
    );
  });

  it('fica preso ao topo ao rolar (sticky), para o menu continuar ao alcance (RF-01)', () => {
    expect(estilosDoCabecalho).toMatch(/position:\s*sticky/);
    expect(estilosDoCabecalho).toMatch(/top:\s*0/);
    // Ao seguir uma âncora, o título da seção não fica escondido atrás do cabeçalho
    // (a altura medida vem do useAlturaDoCabecalho; T-030).
    expect(estilosGlobais).toMatch(/scroll-padding-top:\s*var\(--altura-real-do-cabecalho\)/);
  });

  // T-022 (BUG-Q1 da T-016): a marca também navega (leva ao Início), então, como os links do menu,
  // ela fecha a lista aberta no celular, que senão cobriria o começo da página.
  describe('a marca e a lista do menu (T-022)', () => {
    function marca() {
      return screen.getByRole('link', { name: conteudo.pessoa.nome });
    }

    function botaoDoMenu() {
      return screen.getByRole('button', { name: 'Menu' });
    }

    it('tocar na marca com a lista aberta fecha a lista', () => {
      render(<Cabecalho />);

      fireEvent.click(botaoDoMenu());
      expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(marca());

      expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByRole('list').className).not.toMatch(/aberta/);
    });

    it('tocar na marca com a lista fechada (desktop) não a abre', () => {
      render(<Cabecalho />);

      fireEvent.click(marca());

      expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'false');
    });

    it('depois de a marca fechar a lista, o botão Menu volta a abri-la', () => {
      render(<Cabecalho />);

      fireEvent.click(botaoDoMenu());
      fireEvent.click(marca());
      fireEvent.click(botaoDoMenu());

      expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'true');
    });

    it('pelo teclado, o foco fica na marca escolhida (não é levado para outro lugar)', () => {
      render(<Cabecalho />);

      fireEvent.click(botaoDoMenu());
      marca().focus();
      // Enter num link dispara o evento de clique; o jsdom não faz essa conversão, então simulamos o clique.
      fireEvent.click(marca());

      expect(marca()).toHaveFocus();
      expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'false');
    });

    it('Esc continua fechando a lista e devolvendo o foco ao botão', () => {
      render(<Cabecalho />);

      fireEvent.click(botaoDoMenu());
      fireEvent.click(marca());
      fireEvent.click(botaoDoMenu());
      const link = within(screen.getByRole('navigation')).getByRole('link', { name: 'Contato' });
      link.focus();
      fireEvent.keyDown(link, { key: 'Escape' });

      expect(botaoDoMenu()).toHaveAttribute('aria-expanded', 'false');
      expect(botaoDoMenu()).toHaveFocus();
    });
  });
});
