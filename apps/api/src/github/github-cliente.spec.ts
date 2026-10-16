import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { ConfiguracaoDoGithub } from './configuracao-do-github.js';
import { GithubCliente, GithubIndisponivelError } from './github-cliente.js';

const TOKEN = 'token-secreto-de-teste';

const configuracao: ConfiguracaoDoGithub = {
  token: TOKEN,
  validadeDoCacheEmMs: 60_000,
  tempoLimiteDaRequisicaoEmMs: 50,
};

const repositorio = { dono: 'George-Abreu-git', nome: 'site_apresentacao' };

/** Trecho da resposta real de GET /repos/{dono}/{nome} (a original tem dezenas de campos). */
const respostaDoGithub = {
  full_name: 'George-Abreu-git/site_apresentacao',
  language: 'TypeScript',
  stargazers_count: 7,
  pushed_at: '2026-10-01T12:00:00Z',
  updated_at: '2026-10-05T08:00:00Z',
};

function respostaJson(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Roda a busca esperando erro e devolve o erro, para os testes conferirem tipo e mensagem. */
async function erroDaBusca(cliente: GithubCliente): Promise<Error> {
  const erro = await cliente.buscarRepositorio(repositorio).then(
    () => {
      throw new Error('era esperado um erro, mas a busca deu certo');
    },
    (motivo: unknown) => motivo,
  );
  expect(erro).toBeInstanceOf(GithubIndisponivelError);
  return erro as Error;
}

describe('GithubCliente', () => {
  let fetchSimulado: MockInstance<typeof fetch>;

  beforeEach(() => {
    // Nenhum teste vai à internet: o fetch global é trocado por um simulado.
    fetchSimulado = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('busca o repositório na API do GitHub e devolve linguagem, estrelas e último push', async () => {
    fetchSimulado.mockResolvedValue(respostaJson(respostaDoGithub));

    const dados = await new GithubCliente(configuracao).buscarRepositorio(repositorio);

    expect(dados).toEqual({
      linguagem: 'TypeScript',
      estrelas: 7,
      ultimaAtualizacao: '2026-10-01T12:00:00Z',
    });
    expect(fetchSimulado).toHaveBeenCalledWith(
      'https://api.github.com/repos/George-Abreu-git/site_apresentacao',
      expect.anything(),
    );
  });

  it('aceita linguagem null (repositório sem código reconhecido)', async () => {
    fetchSimulado.mockResolvedValue(respostaJson({ ...respostaDoGithub, language: null }));

    const dados = await new GithubCliente(configuracao).buscarRepositorio(repositorio);

    expect(dados.linguagem).toBeNull();
  });

  it('envia o token no cabeçalho Authorization e os cabeçalhos pedidos pelo GitHub', async () => {
    fetchSimulado.mockResolvedValue(respostaJson(respostaDoGithub));

    await new GithubCliente(configuracao).buscarRepositorio(repositorio);

    const cabecalhos = new Headers(fetchSimulado.mock.calls[0][1]?.headers);
    expect(cabecalhos.get('authorization')).toBe(`Bearer ${TOKEN}`);
    expect(cabecalhos.get('accept')).toBe('application/vnd.github+json');
    expect(cabecalhos.get('x-github-api-version')).toBeTruthy();
    expect(cabecalhos.get('user-agent')).toBeTruthy();
  });

  it('sem token, não envia o cabeçalho Authorization', async () => {
    fetchSimulado.mockResolvedValue(respostaJson(respostaDoGithub));

    await new GithubCliente({ ...configuracao, token: undefined }).buscarRepositorio(repositorio);

    const cabecalhos = new Headers(fetchSimulado.mock.calls[0][1]?.headers);
    expect(cabecalhos.has('authorization')).toBe(false);
  });

  it.each([
    [403, 'limite de requisições atingido'],
    [429, 'limite de requisições atingido'],
    [404, 'repositório não encontrado'],
    [500, 'erro no GitHub'],
    [503, 'erro no GitHub'],
  ])('resposta %i vira GithubIndisponivelError (%s)', async (status, motivo) => {
    fetchSimulado.mockResolvedValue(respostaJson({ message: 'erro' }, status));

    const erro = await erroDaBusca(new GithubCliente(configuracao));

    expect(erro.message).toContain(`GitHub respondeu ${status}`);
    expect(erro.message).toContain(motivo);
  });

  it('falha de rede vira GithubIndisponivelError', async () => {
    fetchSimulado.mockRejectedValue(new TypeError('fetch failed'));

    const erro = await erroDaBusca(new GithubCliente(configuracao));

    expect(erro.message).toMatch(/não foi possível falar com o GitHub/);
  });

  it('desiste quando o GitHub demora mais que o tempo limite', async () => {
    // Simula um GitHub que nunca responde: a promessa só termina quando o sinal aborta.
    fetchSimulado.mockImplementation(
      (_endereco, opcoes) =>
        new Promise<Response>((_resolver, rejeitar) => {
          opcoes?.signal?.addEventListener('abort', () => rejeitar(opcoes.signal?.reason));
        }),
    );

    const erro = await erroDaBusca(new GithubCliente(configuracao));

    expect(erro.message).toMatch(/não foi possível falar com o GitHub/);
  });

  it('resposta fora do formato esperado vira GithubIndisponivelError', async () => {
    fetchSimulado.mockResolvedValue(respostaJson({ ...respostaDoGithub, stargazers_count: 'sete' }));

    const erro = await erroDaBusca(new GithubCliente(configuracao));

    expect(erro.message).toMatch(/formato inesperado/);
  });

  it('as mensagens de erro nunca trazem o token', async () => {
    fetchSimulado
      .mockResolvedValueOnce(respostaJson({ message: 'Bad credentials' }, 401))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(respostaJson({}));
    const cliente = new GithubCliente(configuracao);

    for (let tentativa = 0; tentativa < 3; tentativa++) {
      const erro = await erroDaBusca(cliente);
      expect(erro.message).not.toContain(TOKEN);
    }
  });
});
