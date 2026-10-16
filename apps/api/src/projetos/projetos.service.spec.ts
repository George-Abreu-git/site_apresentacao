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

  it('com o arquivo curado vazio, responde a lista vazia sem consultar o GitHub', async () => {
    const service = new ProjetosService([], github);

    expect(await service.listar()).toEqual([]);
    expect(dadosVivos).not.toHaveBeenCalled();
  });

  it('só consulta o GitHub para projetos com repositório (a demo não conta)', async () => {
    const service = new ProjetosService(
      [{ titulo: 'Só demo', descricao: 'D', stacks: ['React'], demo: 'https://github.com/x/demo' }],
      github,
    );

    const [projeto] = await service.listar();

    expect(dadosVivos).not.toHaveBeenCalled();
    expect(projeto).not.toHaveProperty('github');
  });

  it('consulta os repositórios ao mesmo tempo, mas mantém a ordem do arquivo mesmo se o GitHub responder fora de ordem', async () => {
    // O primeiro repositório demora mais que o segundo: a resposta ainda sai na ordem do arquivo.
    const atrasos: Record<string, number> = { 'https://github.com/x/lento': 20, 'https://github.com/x/rapido': 0 };
    const iniciadas: string[] = [];
    dadosVivos.mockImplementation(async (endereco) => {
      iniciadas.push(endereco);
      await new Promise((resolver) => setTimeout(resolver, atrasos[endereco]));
      return dadosDoGithub;
    });
    const service = new ProjetosService(
      [
        { titulo: 'Lento', descricao: 'L', stacks: ['A'], repositorio: 'https://github.com/x/lento' },
        { titulo: 'Rápido', descricao: 'R', stacks: ['B'], repositorio: 'https://github.com/x/rapido' },
      ],
      github,
    );

    const promessa = service.listar();
    // As duas consultas começaram antes de qualquer uma terminar (em paralelo, não em fila).
    expect(iniciadas).toHaveLength(2);
    const lista = await promessa;

    expect(lista.map((projeto) => projeto.titulo)).toEqual(['Lento', 'Rápido']);
  });
});
