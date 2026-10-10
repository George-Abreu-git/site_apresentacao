import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { carregarVariaveisDeAmbiente } from './carregar-variaveis-de-ambiente.js';

describe('carregarVariaveisDeAmbiente', () => {
  let pasta: string;

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'api-env-'));
  });

  afterEach(() => {
    rmSync(pasta, { recursive: true, force: true });
    delete process.env.VARIAVEL_DE_TESTE_T005;
  });

  it('lê as variáveis do arquivo .env para process.env', () => {
    const arquivo = join(pasta, '.env');
    writeFileSync(arquivo, 'VARIAVEL_DE_TESTE_T005=lida-do-arquivo\n');

    expect(carregarVariaveisDeAmbiente(arquivo)).toBe(true);
    expect(process.env.VARIAVEL_DE_TESTE_T005).toBe('lida-do-arquivo');
  });

  it('não falha quando o arquivo não existe (ex.: produção, onde as variáveis vêm do painel)', () => {
    expect(carregarVariaveisDeAmbiente(join(pasta, '.env'))).toBe(false);
  });

  it('não sobrescreve uma variável que já existe no ambiente', () => {
    const arquivo = join(pasta, '.env');
    writeFileSync(arquivo, 'VARIAVEL_DE_TESTE_T005=lida-do-arquivo\n');
    process.env.VARIAVEL_DE_TESTE_T005 = 'definida-no-ambiente';

    carregarVariaveisDeAmbiente(arquivo);

    expect(process.env.VARIAVEL_DE_TESTE_T005).toBe('definida-no-ambiente');
  });
});
