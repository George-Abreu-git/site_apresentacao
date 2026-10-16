import type { DadosVivosDoGithub } from '@site-apresentacao/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GithubService } from '../github/github.service.js';
import type { ProjetoCurado } from './projeto-curado.js';
import { ProjetosService } from './projetos.service.js';

const projetos: ProjetoCurado[] = [
  { titulo: 'Primeiro', descricao: 'A', stacks: ['React'] },
  { titulo: 'Segundo', descricao: 'B', stacks: ['NestJS'], repositorio: 'https://github.com/x/y' },
  { titulo: 'Terceiro', descricao: 'C', stacks: ['Vue'], repositorio: 'https://gitlab.com/x/z' },
];

const dadosDoGithub: DadosVivosDoGithub = {
  disponivel: true,
  linguagem: 'TypeScript',
  estrelas: 3,
  ultimaAtualizacao: '2026-10-01T12:00:00Z',
};

describe('ProjetosService', () => {
  // GithubService simulado: o domínio projetos não sabe (nem precisa saber) de HTTP ou cache.
  const dadosVivos = vi.fn<GithubService['dadosVivos']>();
  const github = { dadosVivos } as unknown as GithubService;

  beforeEach(() => {
    dadosVivos.mockReset();
    // Como o GithubService de verdade: só endereços do GitHub têm dados vivos.
    dadosVivos.mockImplementation(async (endereco) =>
      endereco.startsWith('https://github.com/') ? dadosDoGithub : undefined,
    );
  });

  it('lista todos os projetos curados, na ordem do arquivo', async () => {
    const service = new ProjetosService(projetos, github);

    const lista = await service.listar();

    expect(lista.map((projeto) => projeto.titulo)).toEqual(['Primeiro', 'Segundo', 'Terceiro']);
  });

  it('acrescenta os dados vivos do GitHub aos projetos com repositório no GitHub', async () => {
    const service = new ProjetosService(projetos, github);

    const [, segundo] = await service.listar();

    expect(segundo).toEqual({ ...projetos[1], github: dadosDoGithub });
    expect(dadosVivos).toHaveBeenCalledWith('https://github.com/x/y');
  });

  it('projetos sem repositório, ou com repositório fora do GitHub, ficam só com os dados curados', async () => {
    const service = new ProjetosService(projetos, github);

    const [primeiro, , terceiro] = await service.listar();

    expect(primeiro).toEqual(projetos[0]);
    expect(terceiro).toEqual(projetos[2]);
    expect(primeiro).not.toHaveProperty('github');
    expect(terceiro).not.toHaveProperty('github');
  });

  it('GitHub indisponível: o projeto vem com os dados curados e github.disponivel = false', async () => {
    dadosVivos.mockResolvedValue({ disponivel: false });
    const service = new ProjetosService(projetos, github);

    const [, segundo] = await service.listar();

    expect(segundo).toEqual({ ...projetos[1], github: { disponivel: false } });
  });

  it('não altera a lista curada guardada no service', async () => {
    const service = new ProjetosService(projetos, github);

    const lista = await service.listar();
    lista.pop();
    lista[0].stacks.push('Angular');

    expect(projetos[0].stacks).toEqual(['React']);
    expect(projetos[1]).not.toHaveProperty('github');
    expect(await service.listar()).toHaveLength(3);
  });
});
