import { render, screen, within } from '@testing-library/react';
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
});
