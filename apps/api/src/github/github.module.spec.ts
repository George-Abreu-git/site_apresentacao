import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GITHUB_CONFIGURACAO } from './configuracao-do-github.js';
import { GithubModule } from './github.module.js';
import { GithubService } from './github.service.js';

describe('GithubModule', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('monta o GithubService com a configuração lida das variáveis de ambiente', async () => {
    vi.stubEnv('GITHUB_CACHE_TTL_SEGUNDOS', '90');

    const modulo = await Test.createTestingModule({ imports: [GithubModule] }).compile();

    expect(modulo.get(GithubService)).toBeInstanceOf(GithubService);
    expect(modulo.get(GITHUB_CONFIGURACAO).validadeDoCacheEmMs).toBe(90_000);
  });

  it('falha ao montar (inicialização), e não na requisição, quando a validade do cache é inválida', async () => {
    vi.stubEnv('GITHUB_CACHE_TTL_SEGUNDOS', 'uma hora');

    const montagem = Test.createTestingModule({ imports: [GithubModule] }).compile();

    await expect(montagem).rejects.toThrow(/GITHUB_CACHE_TTL_SEGUNDOS/);
  });
});
