import { Logger } from '@nestjs/common';
import type { DadosDoGithub } from '@site-apresentacao/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfiguracaoDoGithub } from './configuracao-do-github.js';
import { type GithubCliente, GithubIndisponivelError } from './github-cliente.js';
import { GithubService } from './github.service.js';

const TOKEN = 'token-secreto-de-teste';
const VALIDADE_DO_CACHE_EM_MS = 60_000;
const ENDERECO = 'https://github.com/George-Abreu-git/site_apresentacao';

const configuracao: ConfiguracaoDoGithub = {
  token: TOKEN,
  validadeDoCacheEmMs: VALIDADE_DO_CACHE_EM_MS,
  tempoLimiteDaRequisicaoEmMs: 5000,
};

const dados: DadosDoGithub = {
  linguagem: 'TypeScript',
  estrelas: 7,
  ultimaAtualizacao: '2026-10-01T12:00:00Z',
};

describe('GithubService', () => {
  // GitHub simulado: o teste decide o que cada busca devolve e conta as chamadas.
  const buscarRepositorio = vi.fn<GithubCliente['buscarRepositorio']>();
  const cliente = { buscarRepositorio } as unknown as GithubCliente;
  let avisos: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Só o relógio (Date) é simulado: o teste adianta o tempo sem esperar de verdade.
    vi.useFakeTimers({ toFake: ['Date'] });
    avisos = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    buscarRepositorio.mockReset();
  });

  it('devolve undefined, sem chamar o GitHub, quando o endereço não é do GitHub', async () => {
    const service = new GithubService(cliente, configuracao);

    expect(await service.dadosVivos('https://gitlab.com/dono/repo')).toBeUndefined();
    expect(buscarRepositorio).not.toHaveBeenCalled();
  });

  it('sucesso: devolve os dados do GitHub marcados como disponíveis', async () => {
    buscarRepositorio.mockResolvedValue(dados);
    const service = new GithubService(cliente, configuracao);

    expect(await service.dadosVivos(ENDERECO)).toEqual({ disponivel: true, ...dados });
    expect(buscarRepositorio).toHaveBeenCalledWith({
      dono: 'George-Abreu-git',
      nome: 'site_apresentacao',
    });
  });

  it('falha: devolve { disponivel: false } em vez de lançar erro', async () => {
    buscarRepositorio.mockRejectedValue(new GithubIndisponivelError('GitHub respondeu 403'));
    const service = new GithubService(cliente, configuracao);

    expect(await service.dadosVivos(ENDERECO)).toEqual({ disponivel: false });
  });

  it('falha: registra um aviso no log com o repositório e o motivo, sem o token', async () => {
    buscarRepositorio.mockRejectedValue(new GithubIndisponivelError('GitHub respondeu 403'));
    const service = new GithubService(cliente, configuracao);

    await service.dadosVivos(ENDERECO);

    expect(avisos).toHaveBeenCalledTimes(1);
    const mensagem = String(avisos.mock.calls[0][0]);
    expect(mensagem).toContain('George-Abreu-git/site_apresentacao');
    expect(mensagem).toContain('GitHub respondeu 403');
    expect(JSON.stringify(avisos.mock.calls)).not.toContain(TOKEN);
  });

  it('falha inesperada (não GithubIndisponivelError) também vira { disponivel: false }', async () => {
    buscarRepositorio.mockRejectedValue(new Error('qualquer outra coisa'));
    const service = new GithubService(cliente, configuracao);

    expect(await service.dadosVivos(ENDERECO)).toEqual({ disponivel: false });
  });

  it('sucesso: não registra aviso no log', async () => {
    buscarRepositorio.mockResolvedValue(dados);
    const service = new GithubService(cliente, configuracao);

    await service.dadosVivos(ENDERECO);

    expect(avisos).not.toHaveBeenCalled();
  });

  it('endereço inválido (texto qualquer) devolve undefined sem lançar erro', async () => {
    const service = new GithubService(cliente, configuracao);

    await expect(service.dadosVivos('não é endereço')).resolves.toBeUndefined();
    expect(buscarRepositorio).not.toHaveBeenCalled();
  });

  describe('cache', () => {
    it('usa a validade lida da configuração (GITHUB_CACHE_TTL_SEGUNDOS)', async () => {
      buscarRepositorio.mockResolvedValue(dados);
      const service = new GithubService(cliente, { ...configuracao, validadeDoCacheEmMs: 1000 });

      await service.dadosVivos(ENDERECO);
      vi.advanceTimersByTime(999);
      await service.dadosVivos(ENDERECO);
      vi.advanceTimersByTime(1);
      await service.dadosVivos(ENDERECO);

      expect(buscarRepositorio).toHaveBeenCalledTimes(2);
    });

    it('cada instância do service tem o seu próprio cache', async () => {
      buscarRepositorio.mockResolvedValue(dados);

      await new GithubService(cliente, configuracao).dadosVivos(ENDERECO);
      await new GithubService(cliente, configuracao).dadosVivos(ENDERECO);

      expect(buscarRepositorio).toHaveBeenCalledTimes(2);
    });

    it('dentro da validade, responde do cache sem chamar o GitHub de novo', async () => {
      buscarRepositorio.mockResolvedValue(dados);
      const service = new GithubService(cliente, configuracao);

      await service.dadosVivos(ENDERECO);
      vi.advanceTimersByTime(VALIDADE_DO_CACHE_EM_MS - 1);
      const segunda = await service.dadosVivos(ENDERECO);

      expect(segunda).toEqual({ disponivel: true, ...dados });
      expect(buscarRepositorio).toHaveBeenCalledTimes(1);
    });

    it('vencida a validade, busca de novo no GitHub e devolve os dados novos', async () => {
      buscarRepositorio.mockResolvedValueOnce(dados).mockResolvedValueOnce({ ...dados, estrelas: 8 });
      const service = new GithubService(cliente, configuracao);

      await service.dadosVivos(ENDERECO);
      vi.advanceTimersByTime(VALIDADE_DO_CACHE_EM_MS);
      const depois = await service.dadosVivos(ENDERECO);

      expect(depois).toEqual({ disponivel: true, ...dados, estrelas: 8 });
      expect(buscarRepositorio).toHaveBeenCalledTimes(2);
    });

    it('variações do mesmo endereço usam a mesma entrada do cache', async () => {
      buscarRepositorio.mockResolvedValue(dados);
      const service = new GithubService(cliente, configuracao);

      await service.dadosVivos(ENDERECO);
      await service.dadosVivos('https://github.com/george-abreu-git/site_apresentacao.git');

      expect(buscarRepositorio).toHaveBeenCalledTimes(1);
    });

    it('repositórios diferentes têm entradas diferentes', async () => {
      buscarRepositorio.mockResolvedValue(dados);
      const service = new GithubService(cliente, configuracao);

      await service.dadosVivos(ENDERECO);
      await service.dadosVivos('https://github.com/George-Abreu-git/outro');

      expect(buscarRepositorio).toHaveBeenCalledTimes(2);
    });

    it('falha não fica no cache: a próxima requisição tenta o GitHub de novo', async () => {
      buscarRepositorio
        .mockRejectedValueOnce(new GithubIndisponivelError('GitHub respondeu 503'))
        .mockResolvedValueOnce(dados);
      const service = new GithubService(cliente, configuracao);

      expect(await service.dadosVivos(ENDERECO)).toEqual({ disponivel: false });
      expect(await service.dadosVivos(ENDERECO)).toEqual({ disponivel: true, ...dados });
    });
  });
});
