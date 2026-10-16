import type { Projeto } from '@site-apresentacao/shared';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { conteudo } from '../../conteudo';
import Projetos from './Projetos';

const { secoes } = conteudo;
const textos = conteudo.projetos;

const PROJETOS: Projeto[] = [
  { titulo: 'Projeto A', descricao: 'Descrição A', stacks: ['React'] },
  { titulo: 'Projeto B', descricao: 'Descrição B', stacks: ['NestJS'], github: { disponivel: false } },
];

// A API é simulada trocando o `fetch` do navegador (vi.stubGlobal). Sem troca,
// o padrão de configurar-testes.ts é uma API que nunca responde.
function simularApiRespondendo(corpo: unknown, status = 200) {
  const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } }),
  );
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

describe('Projetos (RF-05, RNF-03)', () => {
  it('é a seção #projetos, com o título de nível 2', () => {
    render(<Projetos />);

    expect(screen.getByRole('region', { name: secoes.projetos })).toHaveAttribute('id', 'projetos');
  });

  it('enquanto a API não responde, mostra o aviso de carregamento num status (anunciado pelo leitor de tela)', () => {
    render(<Projetos />);

    expect(screen.getByRole('status')).toHaveTextContent(textos.carregando);
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('busca os projetos em GET /api/projetos, no endereço configurado', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.exemplo.com');
    const fetchFalso = simularApiRespondendo(PROJETOS);

    render(<Projetos />);

    expect(fetchFalso).toHaveBeenCalledWith('https://api.exemplo.com/api/projetos', expect.anything());
  });

  it('quando a API responde, mostra um card por projeto, na ordem recebida, e tira o aviso', async () => {
    simularApiRespondendo(PROJETOS);

    render(<Projetos />);

    // `findBy...` espera o elemento aparecer: a resposta chega depois da primeira renderização.
    const lista = await screen.findByRole('list', { name: secoes.projetos });
    const titulos = within(lista)
      .getAllByRole('article')
      .map((cartao) => within(cartao).getByRole('heading', { level: 3 }).textContent);
    expect(titulos).toEqual(['Projeto A', 'Projeto B']);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('quando a API responde com erro, mostra a mensagem amigável e a seção continua de pé', async () => {
    simularApiRespondendo({ message: 'Internal Server Error' }, 500);

    render(<Projetos />);

    expect(await screen.findByText(textos.erro)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(textos.erro);
    expect(screen.getByRole('region', { name: secoes.projetos })).toBeInTheDocument();
  });

  it('quando a rede falha (API fora do ar), mostra a mesma mensagem amigável', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch')));

    render(<Projetos />);

    expect(await screen.findByText(textos.erro)).toBeInTheDocument();
  });

  it('quando a API responde com a lista vazia, avisa que não há projetos', async () => {
    simularApiRespondendo([]);

    render(<Projetos />);

    expect(await screen.findByText(textos.vazio)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: secoes.projetos })).not.toBeInTheDocument();
  });

  it('cancela a requisição se a seção sair da tela antes da resposta', () => {
    const { unmount } = render(<Projetos />);
    const [, opcoes] = vi.mocked(fetch).mock.calls[0];

    unmount();

    expect(opcoes?.signal?.aborted).toBe(true);
  });

  it('busca os projetos uma única vez, mesmo com a seção renderizada de novo', () => {
    const fetchFalso = simularApiRespondendo(PROJETOS);

    const { rerender } = render(<Projetos />);
    rerender(<Projetos />);

    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  it('uma resposta que chega depois de a seção sair da tela é ignorada, sem erro nem aviso', async () => {
    // Promessa "pendurada": o teste decide quando a API responde.
    let responder: (resposta: Response) => void = () => undefined;
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(() => new Promise<Response>((resolver) => (responder = resolver))));
    const avisos = vi.spyOn(console, 'error');

    try {
      const { unmount } = render(<Projetos />);
      unmount();
      responder(new Response(JSON.stringify(PROJETOS), { status: 200 }));
      // Deixa a fila de promessas andar, para o .then() do hook rodar.
      await new Promise((resolver) => setTimeout(resolver, 0));

      expect(avisos).not.toHaveBeenCalled();
    } finally {
      avisos.mockRestore();
    }
  });

  it('resposta 200 que não é JSON (ex.: página HTML de erro de um proxy) mostra a mensagem amigável', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 200 })),
    );

    render(<Projetos />);

    expect(await screen.findByText(textos.erro)).toBeInTheDocument();
  });

  // BUG CONHECIDO (T-016): a lista usa o título como `key` do React (`key={projeto.titulo}`), mas nada
  // garante títulos únicos (a validação do arquivo curado na API não confere repetição). Com dois projetos
  // de mesmo título, o React avisa "Encountered two children with the same key" e pode trocar ou repetir
  // cards em atualizações da lista. Esperado: nenhum aviso. Obtido: aviso de chave duplicada no console.
  it.fails('dois projetos com o mesmo título não geram aviso de chave duplicada', async () => {
    simularApiRespondendo([
      { titulo: 'Mesmo título', descricao: 'Primeiro', stacks: ['React'] },
      { titulo: 'Mesmo título', descricao: 'Segundo', stacks: ['NestJS'] },
    ]);
    const avisos = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      render(<Projetos />);
      expect(await screen.findAllByRole('article')).toHaveLength(2);
      expect(avisos).not.toHaveBeenCalled();
    } finally {
      avisos.mockRestore();
    }
  });
});
