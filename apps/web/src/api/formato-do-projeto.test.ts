import type { Projeto } from '@site-apresentacao/shared';
import { describe, expect, it } from 'vitest';
import { ehProjeto } from './formato-do-projeto';

const PROJETO_COMPLETO: Projeto = {
  titulo: 'Site de apresentação',
  descricao: 'Portfólio pessoal',
  stacks: ['React', 'NestJS'],
  repositorio: 'https://github.com/George-Abreu-git/site_apresentacao',
  demo: 'https://site.exemplo.com',
  imagem: '/capas/site.png',
  github: { disponivel: true, linguagem: 'TypeScript', estrelas: 3, ultimaAtualizacao: '2026-10-01T12:00:00Z' },
};

describe('ehProjeto (o item da resposta tem o formato de Projeto?)', () => {
  it('aceita projetos no formato: completo, só com os campos obrigatórios e com o GitHub indisponível', () => {
    expect(ehProjeto(PROJETO_COMPLETO)).toBe(true);
    expect(ehProjeto({ titulo: 'Mínimo', descricao: 'Só o obrigatório', stacks: [] })).toBe(true);
    expect(ehProjeto({ ...PROJETO_COMPLETO, github: { disponivel: false } })).toBe(true);
    expect(ehProjeto({ ...PROJETO_COMPLETO, github: { ...PROJETO_COMPLETO.github, linguagem: null } })).toBe(true);
  });

  it('recusa o que não é um objeto', () => {
    for (const valor of [null, undefined, 'projeto', 42, [PROJETO_COMPLETO]]) {
      expect(ehProjeto(valor)).toBe(false);
    }
  });

  it('recusa projeto sem um campo obrigatório ou com o tipo errado', () => {
    const semStacks: Record<string, unknown> = { ...PROJETO_COMPLETO };
    delete semStacks.stacks;

    expect(ehProjeto(semStacks)).toBe(false);
    expect(ehProjeto({ ...PROJETO_COMPLETO, titulo: 123 })).toBe(false);
    expect(ehProjeto({ ...PROJETO_COMPLETO, descricao: undefined })).toBe(false);
    expect(ehProjeto({ ...PROJETO_COMPLETO, stacks: 'React' })).toBe(false);
    expect(ehProjeto({ ...PROJETO_COMPLETO, stacks: ['React', 7] })).toBe(false);
  });

  it('recusa links que não são endereços http(s), como "javascript:" (viram href no card)', () => {
    expect(ehProjeto({ ...PROJETO_COMPLETO, repositorio: 'javascript:alert(1)' })).toBe(false);
    expect(ehProjeto({ ...PROJETO_COMPLETO, demo: 'ftp://site.exemplo.com' })).toBe(false);
    expect(ehProjeto({ ...PROJETO_COMPLETO, demo: 42 })).toBe(false);
    expect(ehProjeto({ ...PROJETO_COMPLETO, imagem: false })).toBe(false);
  });

  it('recusa dados do GitHub fora do formato', () => {
    const github = PROJETO_COMPLETO.github;

    expect(ehProjeto({ ...PROJETO_COMPLETO, github: 'disponivel' })).toBe(false);
    expect(ehProjeto({ ...PROJETO_COMPLETO, github: { disponivel: 'sim' } })).toBe(false);
    expect(ehProjeto({ ...PROJETO_COMPLETO, github: { disponivel: true } })).toBe(false);
    expect(ehProjeto({ ...PROJETO_COMPLETO, github: { ...github, estrelas: '3' } })).toBe(false);
    expect(ehProjeto({ ...PROJETO_COMPLETO, github: { ...github, linguagem: 1 } })).toBe(false);
    expect(ehProjeto({ ...PROJETO_COMPLETO, github: { ...github, ultimaAtualizacao: 20261001 } })).toBe(false);
  });
});
