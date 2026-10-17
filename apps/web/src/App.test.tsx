import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { capturarErrosDeRenderizacao } from './apoio-de-testes/capturar-erros-de-renderizacao';
import App from './App';
import { conteudo } from './conteudo';
import { IDS_DAS_SECOES } from './secoes';

describe('App (layout base da página única)', () => {
  it('mostra o nome do George como único título principal', () => {
    render(<App />);

    // Buscar pelo papel (role) é como um leitor de tela enxerga a página.
    expect(screen.getByRole('heading', { level: 1, name: conteudo.pessoa.nome })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('mostra a frase de apresentação do Início dentro do conteúdo principal', () => {
    render(<App />);

    expect(screen.getByRole('main')).toHaveTextContent(conteudo.inicio.frase);
  });

  it('tem a estrutura semântica: um cabeçalho, uma navegação, um conteúdo principal e um rodapé', () => {
    render(<App />);

    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
  });

  it('tem as seis seções dentro do conteúdo principal, na mesma ordem do menu', () => {
    render(<App />);

    const principal = screen.getByRole('main');
    const secoes = within(principal).getAllByRole('region');
    expect(secoes.map((secao) => secao.id)).toEqual([...IDS_DAS_SECOES]);
  });

  it('cada link do menu leva a uma seção que existe na página', () => {
    render(<App />);

    const navegacao = screen.getByRole('navigation', { name: 'Navegação principal' });
    const links = within(navegacao).getAllByRole('link');
    expect(links).toHaveLength(6);

    for (const link of links) {
      const alvo = link.getAttribute('href')!.replace('#', '');
      expect(document.getElementById(alvo)?.tagName).toBe('SECTION');
    }
  });

  it('não espera a API: com ela ainda sem responder, o conteúdo estático já está na tela (RNF-03)', () => {
    // O fetch padrão dos testes nunca responde (configurar-testes.ts): é a partida a frio da API.
    render(<App />);

    expect(screen.getByRole('region', { name: conteudo.secoes.projetos })).toHaveTextContent(
      conteudo.projetos.carregando,
    );
    expect(screen.getByRole('region', { name: conteudo.secoes.sobre })).toHaveTextContent(
      conteudo.sobre.paragrafos[0],
    );
    expect(screen.getByRole('region', { name: conteudo.secoes.contato })).toHaveTextContent(conteudo.contato.texto);
  });

  it('com a API fora do ar, só a seção Projetos mostra o erro; o resto da página continua (RF-05)', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch')));

    render(<App />);

    expect(await screen.findByText(conteudo.projetos.erro)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: conteudo.pessoa.nome })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getAllByRole('region')).toHaveLength(IDS_DAS_SECOES.length);
  });

  // T-018 (BUG-1 da T-016): antes, um item fora do formato (ex.: sem `stacks`) fazia o CartaoDeProjeto
  // lançar erro e o React desmontava a PÁGINA INTEIRA (tela em branco, sem o <h1>).
  it('um projeto fora do formato na resposta da API não derruba a página: só Projetos mostra o erro (RF-05)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify([{ titulo: 'Sem stacks', descricao: 'Item fora do formato' }]), { status: 200 }),
      ),
    );

    render(<App />);

    const projetos = screen.getByRole('region', { name: conteudo.secoes.projetos });
    await waitFor(() => expect(within(projetos).getByRole('status')).toHaveTextContent(conteudo.projetos.erro));
    expect(within(projetos).queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: conteudo.pessoa.nome })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getAllByRole('region')).toHaveLength(IDS_DAS_SECOES.length);
  });

  it('um erro ao desenhar um card fica contido na seção Projetos; o resto da página continua (RF-05)', async () => {
    // Data que passa na conferência de formato (é um texto), mas faz o Intl lançar RangeError ao
    // formatar (BUG-2, corrigido no card pela T-019). Aqui o que importa é a contenção do erro.
    const projetoComDataInvalida = {
      titulo: 'Data inválida',
      descricao: 'O card lança erro ao desenhar',
      stacks: ['React'],
      github: { disponivel: true, linguagem: 'TypeScript', estrelas: 1, ultimaAtualizacao: 'não é uma data' },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify([projetoComDataInvalida]), { status: 200 })),
    );
    const captura = capturarErrosDeRenderizacao();

    try {
      render(<App />);

      const projetos = screen.getByRole('region', { name: conteudo.secoes.projetos });
      await waitFor(() => expect(within(projetos).getByRole('status')).toHaveTextContent(conteudo.projetos.erro));
      expect(screen.getByRole('heading', { level: 1, name: conteudo.pessoa.nome })).toBeInTheDocument();
      expect(within(screen.getByRole('main')).getAllByRole('region')).toHaveLength(IDS_DAS_SECOES.length);
    } finally {
      captura.parar();
    }
  });
});
