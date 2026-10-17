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

  it('dá erro com o caminho e os projetos envolvidos quando há títulos repetidos', () => {
    const repetido = { titulo: 'Primeiro', descricao: 'A', stacks: ['React'] };
    writeFileSync(arquivo, JSON.stringify([repetido, { ...repetido, descricao: 'B' }]));

    expect(() => lerProjetosCurados(arquivo)).toThrow(arquivo);
    expect(() => lerProjetosCurados(arquivo)).toThrow(
      /projeto 2 \("Primeiro"\): título repetido — o mesmo do projeto 1 \("Primeiro"\)/,
    );
  });

  it('dá erro claro quando o arquivo está vazio', () => {
    writeFileSync(arquivo, '');

    expect(() => lerProjetosCurados(arquivo)).toThrow(/não é um JSON válido/);
  });

  it('dá erro claro quando o caminho é uma pasta, não um arquivo', () => {
    expect(() => lerProjetosCurados(pasta)).toThrow(/não foi possível ler o arquivo/);
  });

  it('lê acentos e caracteres especiais em UTF-8', () => {
    const projetos = [{ titulo: 'Aplicação de seleção', descricao: 'Ação, coração e “aspas”', stacks: ['C#'] }];
    writeFileSync(arquivo, JSON.stringify(projetos), 'utf8');

    expect(lerProjetosCurados(arquivo)).toEqual(projetos);
  });

  // BUG-4 da T-016, corrigido na T-021: um arquivo salvo em "UTF-8 com BOM" (marca invisível U+FEFF
  // no início, que alguns editores do Windows gravam) era recusado, porque readFileSync mantém o BOM
  // e o JSON.parse não o aceita.
  describe('arquivo salvo em UTF-8 com BOM (T-021)', () => {
    const BOM = String.fromCharCode(0xfeff);

    it('lê um arquivo salvo em UTF-8 com BOM', () => {
      const projetos = [{ titulo: 'Primeiro', descricao: 'A', stacks: ['React'] }];
      writeFileSync(arquivo, `${BOM}${JSON.stringify(projetos)}`, 'utf8');

      expect(lerProjetosCurados(arquivo)).toEqual(projetos);
    });

    it('lê o mesmo resultado com e sem BOM', () => {
      const projetos = [
        { titulo: 'Primeiro', descricao: 'A', stacks: ['React'] },
        { titulo: 'Segundo', descricao: 'B', stacks: ['NestJS'], repositorio: 'https://github.com/x/y' },
      ];
      const texto = JSON.stringify(projetos, null, 2);
      writeFileSync(arquivo, texto, 'utf8');
      const semBom = lerProjetosCurados(arquivo);
      writeFileSync(arquivo, `${BOM}${texto}`, 'utf8');
      const comBom = lerProjetosCurados(arquivo);

      expect(comBom).toEqual(semBom);
      expect(comBom).toEqual(projetos);
    });

    it('preserva acentos e aspas tipográficas depois do BOM', () => {
      const projetos = [{ titulo: 'Aplicação de seleção', descricao: 'Ação, coração e “aspas”', stacks: ['C#'] }];
      writeFileSync(arquivo, `${BOM}${JSON.stringify(projetos)}`, 'utf8');

      expect(lerProjetosCurados(arquivo)).toEqual(projetos);
    });

    it('preserva um U+FEFF que está dentro de um texto do projeto', () => {
      const projetos = [{ titulo: `Com${BOM}marca`, descricao: `${BOM}começa com a marca`, stacks: ['React'] }];
      writeFileSync(arquivo, `${BOM}${JSON.stringify(projetos)}`, 'utf8');

      const [lido] = lerProjetosCurados(arquivo);
      expect(lido.titulo).toBe(`Com${BOM}marca`);
      expect(lido.descricao).toBe(`${BOM}começa com a marca`);
    });

    it('dá erro claro, com o caminho, quando o arquivo tem só o BOM', () => {
      writeFileSync(arquivo, BOM, 'utf8');

      expect(() => lerProjetosCurados(arquivo)).toThrow(ArquivoDeProjetosInvalidoError);
      expect(() => lerProjetosCurados(arquivo)).toThrow(/não é um JSON válido/);
      expect(() => lerProjetosCurados(arquivo)).toThrow(arquivo);
    });

    it('dá erro claro quando o arquivo tem só o BOM e espaços', () => {
      writeFileSync(arquivo, `${BOM}  \n\t `, 'utf8');

      expect(() => lerProjetosCurados(arquivo)).toThrow(/não é um JSON válido/);
    });

    it('dá erro claro, com o caminho, quando o BOM vem seguido de JSON inválido', () => {
      writeFileSync(arquivo, `${BOM}[{ "titulo": "sem fechar" `, 'utf8');

      expect(() => lerProjetosCurados(arquivo)).toThrow(/não é um JSON válido/);
      expect(() => lerProjetosCurados(arquivo)).toThrow(arquivo);
    });

    it('remove só um BOM: dois BOMs seguidos no início continuam sendo JSON inválido', () => {
      writeFileSync(arquivo, `${BOM}${BOM}[]`, 'utf8');

      expect(() => lerProjetosCurados(arquivo)).toThrow(/não é um JSON válido/);
    });
  });
});

describe('arquivo curado do repositório (apps/api/conteudo/projetos.json)', () => {
  it('é válido e tem ao menos 2 projetos de exemplo', () => {
    expect(lerProjetosCurados(CAMINHO_DO_ARQUIVO_CURADO).length).toBeGreaterThanOrEqual(2);
  });
});
