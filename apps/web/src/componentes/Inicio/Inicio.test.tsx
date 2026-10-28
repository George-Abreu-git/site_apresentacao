import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { conteudo } from '../../conteudo';
import estilosGlobais from '../../index.css?raw';
import Inicio from './Inicio';
// `?raw` traz o CSS como texto: o jsdom não calcula layout, então o teste confere as regras.
import estilosDoInicio from './Inicio.module.css?raw';

const { pessoa, inicio } = conteudo;

/** Tira os comentários, para um exemplo dentro de um comentário não contar como regra. */
function semComentarios(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** O corpo da regra de um seletor exato (ex.: `.titulo`), ou '' se ela não existir. */
function regra(css: string, seletor: string): string {
  const encontrada = [...semComentarios(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    ([, nome]) => nome.trim() === seletor,
  );
  return encontrada?.[2] ?? '';
}

/** O valor de `line-height` declarado no corpo de uma regra, ou undefined. */
function entrelinha(corpoDaRegra: string): string | undefined {
  return /line-height:\s*([^;]+);/.exec(corpoDaRegra)?.[1].trim();
}

describe('Inicio (RF-02)', () => {
  it('é a seção #inicio, com o nome do George como título de nível 1', () => {
    render(<Inicio />);

    const regiao = screen.getByRole('region', { name: pessoa.nome });
    expect(regiao).toHaveAttribute('id', 'inicio');
    expect(screen.getByRole('heading', { level: 1, name: pessoa.nome })).toBeInTheDocument();
  });

  it('mostra o título profissional e a frase de apresentação', () => {
    render(<Inicio />);

    expect(screen.getByText(inicio.tituloProfissional)).toBeInTheDocument();
    expect(screen.getByText(inicio.frase)).toBeInTheDocument();
  });

  it('tem atalhos para as seções Projetos e Contato', () => {
    render(<Inicio />);

    expect(screen.getByRole('link', { name: inicio.atalhoProjetos })).toHaveAttribute('href', '#projetos');
    expect(screen.getByRole('link', { name: inicio.atalhoContato })).toHaveAttribute('href', '#contato');
  });

  it('mostra os elementos na ordem de leitura: nome, título profissional, frase e atalhos', () => {
    const { container } = render(<Inicio />);

    const textos = [...container.querySelectorAll('h1, p, a')].map((elemento) => elemento.textContent);
    expect(textos).toEqual([
      pessoa.nome,
      inicio.tituloProfissional,
      inicio.frase,
      inicio.atalhoProjetos,
      inicio.atalhoContato,
    ]);
  });

  it('o atalho para Projetos é o principal e o de Contato é o secundário', () => {
    render(<Inicio />);

    expect(screen.getByRole('link', { name: inicio.atalhoProjetos }).className).toMatch(/principal/);
    expect(screen.getByRole('link', { name: inicio.atalhoContato }).className).toMatch(/secundario/);
  });

  it('tem só os dois atalhos e nenhum subtítulo de nível 2 (o Início não é uma Secao comum)', () => {
    render(<Inicio />);

    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  // T-039 (decisão Q7 do George): com o nome completo, a 200% e em 360px, o título quebra em
  // 4 linhas na DejaVu Sans (Linux) e a base dele passava do fim da janela. A entrelinha 1,2
  // só no <h1> de Início encurta o bloco sem mexer no texto corrido nem nos outros títulos.
  describe('entrelinha do título (T-039)', () => {
    it('o título de Início tem entrelinha 1,2', () => {
      expect(entrelinha(regra(estilosDoInicio, '.titulo'))).toBe('1.2');
    });

    it('a entrelinha do título é um número sem unidade, para acompanhar o tamanho da fonte no zoom', () => {
      // Com `px` ou `em` o valor seria calculado uma vez e herdado fixo; sem unidade, cada
      // elemento multiplica o próprio font-size (que cresce com o clamp e com o texto ampliado).
      expect(entrelinha(regra(estilosDoInicio, '.titulo'))).toMatch(/^\d+(\.\d+)?$/);
    });

    it('só o título muda: título profissional, frase e atalhos herdam a entrelinha do texto corrido', () => {
      for (const seletor of ['.inicio', '.tituloProfissional', '.frase', '.atalhos']) {
        expect(entrelinha(regra(estilosDoInicio, seletor)), seletor).toBeUndefined();
      }
    });

    it('o texto corrido da página continua com entrelinha 1,5 (leitura confortável)', () => {
      expect(entrelinha(regra(estilosGlobais, 'body'))).toBe('1.5');
    });

    it('a correção não encolhe o título: o tamanho da fonte continua o mesmo', () => {
      expect(regra(estilosDoInicio, '.titulo')).toMatch(/font-size:\s*clamp\(2rem,\s*6vw,\s*3\.5rem\);/);
    });
  });
});
