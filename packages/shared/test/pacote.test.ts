// Protege a decisão da T-017: os tipos de "@site-apresentacao/shared" são lidos direto do
// código-fonte (src/index.ts), e não da pasta dist/, que é gerada pelo build e fica fora
// do git. Sem isso, num clone novo (sem dist/) a API e o front não compilam:
// "Cannot find module '@site-apresentacao/shared'".
//
// Para provar o comportamento "sem dist/" sem apagar a pasta de verdade, os testes usam
// o compilador do TypeScript como biblioteca e trocam o acesso ao disco por um que
// finge que a dist/ não existe (ou que existe, quando o cenário pede).
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const NOME_DO_PACOTE = '@site-apresentacao/shared';

const raizDoPacote = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const raizDoRepositorio = resolve(raizDoPacote, '../..');
const pastaDoFonte = join(raizDoPacote, 'src');

// Checar um programa inteiro com o TypeScript é mais lento que um teste comum (no CI pode
// passar dos 5 segundos padrão do Vitest).
const TEMPO_LIMITE_DA_CHECAGEM = 30_000;

/** Caminho com barras normais e em minúsculas, para comparar no Windows e no Linux. */
function normalizar(caminho: string): string {
  return resolve(caminho).replaceAll('\\', '/').toLowerCase();
}

const entradaDoFonte = normalizar(join(pastaDoFonte, 'index.ts'));

// A dist/ pode ser alcançada pelo caminho real (packages/shared/dist) ou pelo atalho que o
// npm cria em node_modules (node_modules/@site-apresentacao/shared/dist).
const pastasDaDist = [
  normalizar(join(raizDoPacote, 'dist')),
  normalizar(join(raizDoRepositorio, 'node_modules', NOME_DO_PACOTE, 'dist')),
];

function estaNaDist(caminho: string): boolean {
  const alvo = normalizar(caminho);
  return pastasDaDist.some((pasta) => alvo === pasta || alvo.startsWith(`${pasta}/`));
}

type SituacaoDaDist = 'ausente' | 'presente';

// Na dist "presente" simulada, o index.d.ts tem um tipo que não existe no fonte: se a
// resolução fosse para a dist, quem importa `Projeto` receberia um erro.
const DIST_SIMULADA = 'export type SoNaDist = true;\n';

/**
 * Um "host" é como o compilador lê o disco. Este repassa tudo ao disco real, mas
 * esconde a dist/ do shared (situação "ausente", como num clone novo) ou entrega uma
 * dist/ falsa (situação "presente", como depois do `npm run build`).
 */
function criarHost(opcoes: ts.CompilerOptions, dist: SituacaoDaDist): ts.CompilerHost {
  const host = ts.createCompilerHost(opcoes);
  const original = {
    fileExists: host.fileExists.bind(host),
    readFile: host.readFile.bind(host),
    directoryExists: host.directoryExists?.bind(host) ?? ts.sys.directoryExists,
  };
  const ehArquivoDaDistSimulada = (caminho: string) =>
    dist === 'presente' && estaNaDist(caminho) && /\/index\.(d\.ts|js)$/.test(normalizar(caminho));

  host.fileExists = (caminho) => {
    if (estaNaDist(caminho)) return ehArquivoDaDistSimulada(caminho);
    return original.fileExists(caminho);
  };
  host.readFile = (caminho) => {
    if (estaNaDist(caminho)) return ehArquivoDaDistSimulada(caminho) ? DIST_SIMULADA : undefined;
    return original.readFile(caminho);
  };
  host.directoryExists = (pasta) => {
    if (estaNaDist(pasta)) return dist === 'presente';
    return original.directoryExists(pasta);
  };
  return host;
}

/** Lê as opções do compilador do tsconfig.json de um app (com o "extends" já aplicado). */
function lerOpcoesDoApp(app: 'api' | 'web'): ts.CompilerOptions {
  const arquivo = join(raizDoRepositorio, 'apps', app, 'tsconfig.json');
  const configuracao = ts.getParsedCommandLineOfConfigFile(arquivo, {}, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostico) => {
      throw new Error(ts.flattenDiagnosticMessageText(diagnostico.messageText, '\n'));
    },
  });
  if (!configuracao) throw new Error(`Não foi possível ler ${arquivo}`);
  return configuracao.options;
}

/** Para onde o compilador leva o import do pacote, a partir de um arquivo do app. */
function resolverOPacote(app: 'api' | 'web', dist: SituacaoDaDist): string | undefined {
  const opcoes = lerOpcoesDoApp(app);
  const quemImporta = join(raizDoRepositorio, 'apps', app, 'src', 'main.ts');
  const { resolvedModule } = ts.resolveModuleName(
    NOME_DO_PACOTE,
    quemImporta,
    opcoes,
    criarHost(opcoes, dist),
    undefined,
    undefined,
    // Os dois apps são módulos ES ("type": "module"), então o import é resolvido como ESM.
    ts.ModuleKind.ESNext,
  );
  return resolvedModule && normalizar(resolvedModule.resolvedFileName);
}

// Arquivo que só existe na memória, "colocado" dentro do app. A diretiva de erro esperado
// (ts-expect-error) prova que o tipo chegou de verdade: se o import falhasse ou o tipo
// virasse `any`, o erro esperado não aconteceria e o próprio TypeScript reclamaria.
// (A diretiva não pode abrir uma linha de comentário aqui fora: o TypeScript a aplicaria
// a este arquivo de teste.)
const CODIGO_QUE_USA_O_TIPO = `
import type { Projeto } from '${NOME_DO_PACOTE}';

export const projeto: Projeto = { titulo: 'Site', descricao: 'Portfólio', stacks: ['React'] };

// @ts-expect-error - titulo é texto, não número
export const projetoErrado: Projeto = { titulo: 1, descricao: 'Portfólio', stacks: [] };
`;

/** Erros que o TypeScript encontra ao checar um import de tipo do shared dentro do app, sem dist/. */
function checarImportDeTipoSemDist(app: 'api' | 'web'): string[] {
  const opcoes = { ...lerOpcoesDoApp(app), noEmit: true };
  const host = criarHost(opcoes, 'ausente');
  const arquivoVirtual = join(raizDoRepositorio, 'apps', app, 'src', 'verificacao-shared.ts');
  const ehOArquivoVirtual = (caminho: string) => normalizar(caminho) === normalizar(arquivoVirtual);

  const { fileExists, readFile, getSourceFile } = host;
  host.fileExists = (caminho) => ehOArquivoVirtual(caminho) || fileExists(caminho);
  host.readFile = (caminho) => (ehOArquivoVirtual(caminho) ? CODIGO_QUE_USA_O_TIPO : readFile(caminho));
  host.getSourceFile = (caminho, versao, ...resto) =>
    ehOArquivoVirtual(caminho)
      ? ts.createSourceFile(caminho, CODIGO_QUE_USA_O_TIPO, versao)
      : getSourceFile(caminho, versao, ...resto);

  const programa = ts.createProgram([arquivoVirtual], opcoes, host);
  return ts
    .getPreEmitDiagnostics(programa)
    .map((diagnostico) => ts.flattenDiagnosticMessageText(diagnostico.messageText, '\n'));
}

/**
 * Lista os exports de valor (const, function, class, enum...) de um código TypeScript.
 * Só `interface`, `type` e `export type { ... }` são permitidos no pacote shared:
 * eles somem ao compilar, então ninguém precisa da dist/ para rodar.
 */
function listarExportsDeValor(codigo: string): string[] {
  const arquivo = ts.createSourceFile('arquivo.ts', codigo, ts.ScriptTarget.Latest, true);
  const encontrados: string[] = [];

  for (const instrucao of arquivo.statements) {
    if (ts.isInterfaceDeclaration(instrucao) || ts.isTypeAliasDeclaration(instrucao)) continue;

    if (ts.isExportDeclaration(instrucao)) {
      // `export { a, type B }`: só passa se o bloco inteiro, ou cada nome, for de tipo.
      const nomes = instrucao.exportClause && ts.isNamedExports(instrucao.exportClause)
        ? instrucao.exportClause.elements
        : undefined;
      const tudoDeTipo = instrucao.isTypeOnly || (nomes?.every((nome) => nome.isTypeOnly) ?? false);
      if (!tudoDeTipo) encontrados.push(instrucao.getText());
      continue;
    }

    const exporta =
      ts.isExportAssignment(instrucao) ||
      (ts.canHaveModifiers(instrucao) &&
        (ts.getModifiers(instrucao) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword));
    if (exporta) encontrados.push(instrucao.getText().split('\n')[0]);
  }
  return encontrados;
}

function arquivosDoFonte(): string[] {
  return readdirSync(pastaDoFonte, { recursive: true, encoding: 'utf8' })
    .filter((nome) => nome.endsWith('.ts') && !/\.(test|spec)\.ts$/.test(nome))
    .map((nome) => join(pastaDoFonte, nome));
}

describe('pacote shared resolvido pelo código-fonte (T-017)', () => {
  it('com a dist/ gerada pelo build, os tipos continuam vindo de src/index.ts', () => {
    const pacote = JSON.parse(readFileSync(join(raizDoPacote, 'package.json'), 'utf8'));

    expect(pacote.exports['.'].types).toBe('./src/index.ts');
    expect(resolverOPacote('api', 'presente')).toBe(entradaDoFonte);
    expect(resolverOPacote('web', 'presente')).toBe(entradaDoFonte);
  });

  it('sem a dist/ (clone novo), a API e o front ainda encontram o pacote em src/index.ts', () => {
    expect(resolverOPacote('api', 'ausente')).toBe(entradaDoFonte);
    expect(resolverOPacote('web', 'ausente')).toBe(entradaDoFonte);
  });

  it(
    'sem a dist/, a API compila um import de tipo do shared (configuração do apps/api)',
    () => {
      expect(checarImportDeTipoSemDist('api')).toEqual([]);
    },
    TEMPO_LIMITE_DA_CHECAGEM,
  );

  it(
    'sem a dist/, o front compila um import de tipo do shared (configuração do apps/web)',
    () => {
      expect(checarImportDeTipoSemDist('web')).toEqual([]);
    },
    TEMPO_LIMITE_DA_CHECAGEM,
  );

  it('o pacote só exporta tipos (nenhum export de valor em src/), condição para apontar para o fonte', () => {
    // Primeiro, a regra reconhece um export de valor quando ele aparece...
    expect(
      listarExportsDeValor(`
        export interface A { x: number }
        export type B = string;
        export type { C } from './c.js';
        export const versao = 1;
        export function somar() {}
        export { valor } from './valor.js';
      `),
    ).toEqual([
      'export const versao = 1;',
      'export function somar() {}',
      "export { valor } from './valor.js';",
    ]);

    // ...e o código real do pacote não tem nenhum.
    const encontrados = arquivosDoFonte().flatMap((arquivo) =>
      listarExportsDeValor(readFileSync(arquivo, 'utf8')).map((trecho) => `${arquivo}: ${trecho}`),
    );
    expect(encontrados).toEqual([]);
  });
});
