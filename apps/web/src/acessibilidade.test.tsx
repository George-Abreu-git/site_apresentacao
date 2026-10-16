// RNF-02: HTML semântico, alt em imagens, navegação por teclado, foco visível.
// Estes testes olham a página INTEIRA (App), com os cards de projetos já carregados,
// para pegar problemas que só aparecem quando os componentes estão juntos (ex.: id repetido).
import type { Projeto } from '@site-apresentacao/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import paginaHtml from '../index.html?raw';
import App from './App';
import { conteudo } from './conteudo';
import estilosGlobais from './index.css?raw';

const PROJETOS: Projeto[] = [
  {
    titulo: 'Projeto com tudo',
    descricao: 'Com links e dados vivos.',
    stacks: ['React'],
    repositorio: 'https://github.com/dono/repo',
    demo: 'https://demo.exemplo.com',
    github: { disponivel: true, linguagem: 'TypeScript', estrelas: 3, ultimaAtualizacao: '2026-10-01T12:00:00Z' },
  },
  { titulo: 'Projeto só curado', descricao: 'Sem links.', stacks: ['Node.js'] },
];

const arquivosCss = import.meta.glob<string>('./**/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Renderiza a página com a API respondendo os projetos e espera os cards aparecerem. */
async function renderizarPaginaCompleta() {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(PROJETOS), { status: 200 })),
  );
  const resultado = render(<App />);
  await screen.findAllByRole('article');
  return resultado;
}

describe('acessibilidade da página inteira (RNF-02)', () => {
  it('os títulos não pulam nível (h1 → h2 → h3), para o leitor de tela montar o sumário da página', async () => {
    const { container } = await renderizarPaginaCompleta();

    const niveis = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((titulo) => Number(titulo.tagName[1]));
    expect(niveis[0]).toBe(1);
    niveis.forEach((nivel, indice) => {
      if (indice > 0) expect(nivel).toBeLessThanOrEqual(niveis[indice - 1] + 1);
    });
  });

  it('nenhum id se repete na página (aria-labelledby e âncoras dependem de ids únicos)', async () => {
    const { container } = await renderizarPaginaCompleta();

    const ids = [...container.querySelectorAll('[id]')].map((elemento) => elemento.id);
    const repetidos = ids.filter((id, indice) => ids.indexOf(id) !== indice);
    expect(repetidos).toEqual([]);
  });

  it('toda referência de aria-labelledby e aria-controls aponta para um elemento que existe', async () => {
    const { container } = await renderizarPaginaCompleta();

    const referencias = [...container.querySelectorAll('[aria-labelledby], [aria-controls]')].flatMap((elemento) =>
      [elemento.getAttribute('aria-labelledby'), elemento.getAttribute('aria-controls')].filter(Boolean),
    );
    expect(referencias.length).toBeGreaterThan(0);
    for (const id of referencias) {
      expect(document.getElementById(id!), `id "${id}"`).not.toBeNull();
    }
  });

  it('todo link e todo botão têm um nome para o leitor de tela', async () => {
    await renderizarPaginaCompleta();

    const interativos = [...screen.getAllByRole('link'), ...screen.getAllByRole('button')];
    for (const elemento of interativos) {
      // Sem argumento, o matcher confere que o nome acessível existe e não é vazio.
      expect(elemento).toHaveAccessibleName();
    }
  });

  it('todo link que abre nova aba usa rel="noopener noreferrer" e avisa o leitor de tela', async () => {
    const { container } = await renderizarPaginaCompleta();

    const novasAbas = [...container.querySelectorAll('a[target="_blank"]')];
    expect(novasAbas.length).toBeGreaterThan(0);
    for (const link of novasAbas) {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAccessibleName(expect.stringContaining(conteudo.geral.abreEmNovaAba));
    }
  });

  it('a ordem do Tab é a da página: nenhum tabindex positivo, e toda imagem tem alt', async () => {
    const { container } = await renderizarPaginaCompleta();

    const tabindexPositivo = [...container.querySelectorAll('[tabindex]')].filter(
      (elemento) => Number(elemento.getAttribute('tabindex')) > 0,
    );
    expect(tabindexPositivo).toEqual([]);
    for (const imagem of container.querySelectorAll('img')) {
      expect(imagem).toHaveAttribute('alt');
    }
  });

  it('a página declara o idioma (lang), para o leitor de tela usar a pronúncia certa', () => {
    expect(paginaHtml).toMatch(/<html lang="pt-BR">/);
  });

  it('o foco é visível (:focus-visible com a cor de foco) e nenhum CSS tira o contorno de foco', () => {
    expect(estilosGlobais).toMatch(/:focus-visible\s*\{[^}]*outline:[^;]*var\(--cor-foco\)/);

    for (const [arquivo, css] of Object.entries(arquivosCss)) {
      expect(css, arquivo).not.toMatch(/outline:\s*(none|0)\b/);
    }
  });
});
