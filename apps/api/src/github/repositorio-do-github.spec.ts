import { describe, expect, it } from 'vitest';
import { extrairRepositorioDoGithub } from './repositorio-do-github.js';

describe('extrairRepositorioDoGithub', () => {
  it('extrai dono e nome de um endereço do GitHub', () => {
    expect(
      extrairRepositorioDoGithub('https://github.com/George-Abreu-git/site_apresentacao'),
    ).toEqual({ dono: 'George-Abreu-git', nome: 'site_apresentacao' });
  });

  it.each([
    'https://github.com/dono/repo/',
    'https://github.com/dono/repo.git',
    'https://www.github.com/dono/repo',
    'http://GitHub.com/dono/repo',
    'https://github.com/dono/repo/tree/main/src',
    'https://github.com/dono/repo?tab=readme',
    'https://github.com/dono/repo.git/',
    'https://github.com/dono/repo#readme',
    'https://github.com:443/dono/repo',
    'https://github.com//dono//repo',
  ])('aceita variações comuns do endereço: %s', (endereco) => {
    expect(extrairRepositorioDoGithub(endereco)).toEqual({ dono: 'dono', nome: 'repo' });
  });

  it('mantém maiúsculas, pontos, hífens e sublinhados do nome como estão', () => {
    expect(extrairRepositorioDoGithub('https://github.com/Dono-X/meu.site_v2')).toEqual({
      dono: 'Dono-X',
      nome: 'meu.site_v2',
    });
  });

  it.each([
    'https://gitlab.com/dono/repo',
    'https://github.com/dono',
    'https://github.com/',
    'https://github.com.exemplo.com/dono/repo',
    'https://exemplo.com/github.com/dono/repo',
    'https://gist.github.com/dono/abc123',
    'github.com/dono/repo',
    '',
    'não é um endereço',
  ])('devolve null quando não é um repositório do GitHub: %s', (endereco) => {
    expect(extrairRepositorioDoGithub(endereco)).toBeNull();
  });
});
