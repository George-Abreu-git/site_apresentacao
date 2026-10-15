import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { lerProjetosCurados } from './ler-projetos-curados.js';
import { ProjetosController } from './projetos.controller.js';
import { ProjetosModule } from './projetos.module.js';
import { PROJETOS_CURADOS } from './projetos-curados.token.js';
import { ProjetosService } from './projetos.service.js';

describe('ProjetosController', () => {
  it('responde com a lista do service', () => {
    const projetos = [{ titulo: 'Primeiro', descricao: 'A', stacks: ['React'] }];
    const controller = new ProjetosController(new ProjetosService(projetos));

    expect(controller.listar()).toEqual(projetos);
  });
});

describe('ProjetosModule', () => {
  it('monta controller e service com os projetos do arquivo curado', async () => {
    const modulo = await Test.createTestingModule({ imports: [ProjetosModule] }).compile();

    expect(modulo.get(ProjetosController).listar()).toEqual(lerProjetosCurados());
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
