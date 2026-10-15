import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CAMINHO_DO_ARQUIVO_CURADO, lerProjetosCurados } from './ler-projetos-curados.js';
import { ArquivoDeProjetosInvalidoError } from './validar-projetos-curados.js';

describe('lerProjetosCurados', () => {
  let pasta: string;
  let arquivo: string;

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'api-projetos-'));
    arquivo = join(pasta, 'projetos.json');
  });

  afterEach(() => {
    rmSync(pasta, { recursive: true, force: true });
  });

  it('lê e devolve os projetos do arquivo, na ordem do arquivo', () => {
    const projetos = [
      { titulo: 'Primeiro', descricao: 'A', stacks: ['React'] },
      { titulo: 'Segundo', descricao: 'B', stacks: ['NestJS'] },
    ];
    writeFileSync(arquivo, JSON.stringify(projetos));

    expect(lerProjetosCurados(arquivo)).toEqual(projetos);
  });

  it('dá erro claro, com o caminho, quando o arquivo não existe', () => {
    expect(() => lerProjetosCurados(arquivo)).toThrow(ArquivoDeProjetosInvalidoError);
    expect(() => lerProjetosCurados(arquivo)).toThrow(/não foi possível ler o arquivo/);
    expect(() => lerProjetosCurados(arquivo)).toThrow(arquivo);
  });

  it('dá erro claro quando o arquivo não é um JSON válido', () => {
    writeFileSync(arquivo, '[{ "titulo": "sem fechar" ');

    expect(() => lerProjetosCurados(arquivo)).toThrow(/não é um JSON válido/);
  });

  it('dá erro com o caminho e os problemas quando o conteúdo está fora do formato', () => {
    writeFileSync(arquivo, JSON.stringify([{ titulo: 'Sem stacks', descricao: 'A' }]));

    expect(() => lerProjetosCurados(arquivo)).toThrow(arquivo);
    expect(() => lerProjetosCurados(arquivo)).toThrow(/projeto 1 \("Sem stacks"\): campo "stacks"/);
  });
});

describe('arquivo curado do repositório (apps/api/conteudo/projetos.json)', () => {
  it('é válido e tem ao menos 2 projetos de exemplo', () => {
    expect(lerProjetosCurados(CAMINHO_DO_ARQUIVO_CURADO).length).toBeGreaterThanOrEqual(2);
  });
});
