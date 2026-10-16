import { describe, expect, it } from 'vitest';
import {
  ConfiguracaoDoGithubInvalidaError,
  lerConfiguracaoDoGithub,
  VALIDADE_PADRAO_DO_CACHE_EM_SEGUNDOS,
} from './configuracao-do-github.js';

describe('lerConfiguracaoDoGithub', () => {
  it('usa a validade padrão do cache e nenhum token quando as variáveis não existem', () => {
    const configuracao = lerConfiguracaoDoGithub({});

    expect(configuracao.validadeDoCacheEmMs).toBe(VALIDADE_PADRAO_DO_CACHE_EM_SEGUNDOS * 1000);
    expect(configuracao.token).toBeUndefined();
  });

  it('lê a validade do cache, em segundos, de GITHUB_CACHE_TTL_SEGUNDOS', () => {
    const configuracao = lerConfiguracaoDoGithub({ GITHUB_CACHE_TTL_SEGUNDOS: '120' });

    expect(configuracao.validadeDoCacheEmMs).toBe(120_000);
  });

  it('lê o token de GITHUB_TOKEN', () => {
    expect(lerConfiguracaoDoGithub({ GITHUB_TOKEN: 'token-de-teste' }).token).toBe('token-de-teste');
  });

  it('trata variáveis vazias (como no .env.example) como ausentes', () => {
    const configuracao = lerConfiguracaoDoGithub({ GITHUB_TOKEN: '  ', GITHUB_CACHE_TTL_SEGUNDOS: '' });

    expect(configuracao.token).toBeUndefined();
    expect(configuracao.validadeDoCacheEmMs).toBe(VALIDADE_PADRAO_DO_CACHE_EM_SEGUNDOS * 1000);
  });

  it.each(['abc', '0', '-5', '1.5', '10s'])(
    'recusa GITHUB_CACHE_TTL_SEGUNDOS="%s" com erro claro (a API não sobe)',
    (valor) => {
      expect(() => lerConfiguracaoDoGithub({ GITHUB_CACHE_TTL_SEGUNDOS: valor })).toThrow(
        ConfiguracaoDoGithubInvalidaError,
      );
      expect(() => lerConfiguracaoDoGithub({ GITHUB_CACHE_TTL_SEGUNDOS: valor })).toThrow(
        /GITHUB_CACHE_TTL_SEGUNDOS deve ser um número inteiro de segundos maior que zero/,
      );
    },
  );

  it('a mensagem de erro não mostra o token', () => {
    const lerComErro = () =>
      lerConfiguracaoDoGithub({ GITHUB_TOKEN: 'token-secreto', GITHUB_CACHE_TTL_SEGUNDOS: 'x' });

    expect(lerComErro).toThrow(ConfiguracaoDoGithubInvalidaError);
    expect(lerComErro).not.toThrow(/token-secreto/);
  });
});
