import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import type { Projeto } from '@site-apresentacao/shared';
import { describe, expect, it, vi } from 'vitest';
import { GithubCliente } from '../github/github-cliente.js';
import type { GithubService } from '../github/github.service.js';
import { lerProjetosCurados } from './ler-projetos-curados.js';
import { ProjetosController } from './projetos.controller.js';
import { ProjetosModule } from './projetos.module.js';
import { PROJETOS_CURADOS } from './projetos-curados.token.js';
import { ProjetosService } from './projetos.service.js';

/** GitHub simulado para o módulo montado de verdade: nenhum teste vai à internet. */
const githubSimulado = {
  buscarRepositorio: vi.fn(async () => ({
    linguagem: 'TypeScript',
    estrelas: 1,
    ultimaAtualizacao: '2026-10-01T12:00:00Z',
  })),
};

describe('ProjetosController', () => {
  it('responde com a lista do service', async () => {
    const projetos: Projeto[] = [{ titulo: 'Primeiro', descricao: 'A', stacks: ['React'] }];
    const github = { dadosVivos: vi.fn() } as unknown as GithubService;
    const controller = new ProjetosController(new ProjetosService(projetos, github));

    expect(await controller.listar()).toEqual(projetos);
  });
});

describe('ProjetosModule', () => {
  it('monta controller e service com os projetos do arquivo curado e os dados do GitHub', async () => {
    const modulo = await Test.createTestingModule({ imports: [ProjetosModule] })
      .overrideProvider(GithubCliente)
      .useValue(githubSimulado)
      .compile();

    const lista = await modulo.get(ProjetosController).listar();

    expect(lista.map((projeto) => projeto.titulo)).toEqual(
      lerProjetosCurados().map((projeto) => projeto.titulo),
    );
    // O arquivo do repositório tem um projeto com repositório no GitHub (o deste site).
    expect(lista.some((projeto) => projeto.github?.disponivel === true)).toBe(true);
  });

  it('falha ao montar (inicialização), e não na requisição, quando o arquivo é inválido', async () => {
    const pasta = mkdtempSync(join(tmpdir(), 'api-projetos-'));
    const arquivoInvalido = join(pasta, 'projetos.json');
    writeFileSync(arquivoInvalido, '[{ "titulo": "Sem descrição", "stacks": [] }]');

    try {
      // Troca só o caminho lido pelo provider; o resto do módulo é o de verdade.
      const montagem = Test.createTestingModule({ imports: [ProjetosModule] })
        .overrideProvider(PROJETOS_CURADOS)
        .useFactory({ factory: () => lerProjetosCurados(arquivoInvalido) })
        .compile();

      await expect(montagem).rejects.toThrow(/campo "descricao" é obrigatório/);
    } finally {
      rmSync(pasta, { recursive: true, force: true });
    }
  });
});
