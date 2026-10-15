import type { Projeto } from '@site-apresentacao/shared';
import { describe, expect, it } from 'vitest';
import { ProjetosService } from './projetos.service.js';

const projetos: Projeto[] = [
  { titulo: 'Primeiro', descricao: 'A', stacks: ['React'] },
  { titulo: 'Segundo', descricao: 'B', stacks: ['NestJS'], repositorio: 'https://github.com/x/y' },
];

describe('ProjetosService', () => {
  it('lista todos os projetos curados, na ordem do arquivo', () => {
    const service = new ProjetosService(projetos);

    expect(service.listar()).toEqual(projetos);
  });

  it('devolve uma cópia: quem altera o resultado não altera a lista guardada', () => {
    const service = new ProjetosService(projetos);

    service.listar().pop();
    service.listar()[0].stacks.push('Vue');

    expect(service.listar()).toEqual(projetos);
    expect(projetos[0].stacks).toEqual(['React']);
  });
});
