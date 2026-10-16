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

  // BUG CONHECIDO (T-016): o front confia no formato de cada projeto que a API devolve
  // (src/api/projetos.ts só confere que é uma lista) e não há error boundary. Um item fora do formato
  // (ex.: sem `stacks`) faz o CartaoDeProjeto lançar erro e o React desmonta a PÁGINA INTEIRA (tela em branco).
  // Esperado (RF-05): mensagem amigável na seção Projetos e o resto da página de pé.
  // Obtido: nenhum elemento na tela (nem o <h1>).
  it.fails('um projeto fora do formato na resposta da API não derruba a página inteira', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify([{ titulo: 'Sem stacks', descricao: 'Item fora do formato' }]), { status: 200 }),
      ),
    );
    const captura = capturarErrosDeRenderizacao();

    try {
      render(<App />);
      // Espera a resposta da API ser tratada (o aviso de carregamento some, de um jeito ou de outro).
      await waitFor(() => expect(screen.queryByText(conteudo.projetos.carregando)).not.toBeInTheDocument());

      expect(screen.getByRole('heading', { level: 1, name: conteudo.pessoa.nome })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: conteudo.secoes.projetos })).toBeInTheDocument();
    } finally {
      captura.parar();
    }
  });
});
