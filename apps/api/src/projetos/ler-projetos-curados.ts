import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { ProjetoCurado } from './projeto-curado.js';
import { ArquivoDeProjetosInvalidoError, validarProjetosCurados } from './validar-projetos-curados.js';

/**
 * Caminho do arquivo curado (apps/api/conteudo/projetos.json).
 *
 * É calculado a partir deste arquivo (`import.meta.url`), e não do diretório atual,
 * para funcionar de qualquer pasta. Subir duas pastas leva a apps/api tanto daqui
 * (src/projetos/) quanto do JavaScript compilado (dist/projetos/).
 */
export const CAMINHO_DO_ARQUIVO_CURADO = fileURLToPath(
  new URL('../../conteudo/projetos.json', import.meta.url),
);

/** Marca de ordem de bytes (BOM, U+FEFF), que alguns editores gravam no início de arquivos UTF-8. */
const BOM = '\uFEFF';

/**
 * Remove um único BOM do início do texto, se houver.
 *
 * O `readFileSync` com 'utf8' mantém o BOM como primeiro caractere, e o `JSON.parse`
 * não o aceita. Só o início é tratado: um U+FEFF no meio do texto é conteúdo do projeto
 * e precisa ser preservado; por isso não usamos `trim()`, que também o removeria.
 */
function removerBomInicial(texto: string): string {
  return texto.startsWith(BOM) ? texto.slice(BOM.length) : texto;
}

/**
 * Lê o arquivo curado e devolve os projetos já validados, na ordem do arquivo.
 *
 * Aceita arquivos salvos em UTF-8 com ou sem BOM.
 *
 * @throws ArquivoDeProjetosInvalidoError se o arquivo não existe, não é JSON
 *   ou está fora do formato. A mensagem sempre traz o caminho do arquivo.
 */
export function lerProjetosCurados(caminho: string = CAMINHO_DO_ARQUIVO_CURADO): ProjetoCurado[] {
  const prefixo = `Arquivo curado de projetos inválido (${caminho})`;

  let texto: string;
  try {
    texto = readFileSync(caminho, 'utf8');
  } catch (erro) {
    throw new ArquivoDeProjetosInvalidoError(
      `${prefixo}: não foi possível ler o arquivo (${(erro as Error).message})`,
    );
  }

  let dados: unknown;
  try {
    dados = JSON.parse(removerBomInicial(texto));
  } catch (erro) {
    throw new ArquivoDeProjetosInvalidoError(
      `${prefixo}: não é um JSON válido (${(erro as Error).message})`,
    );
  }

  try {
    return validarProjetosCurados(dados);
  } catch (erro) {
    // Acrescenta o caminho à mensagem da validação, que não sabe de onde vieram os dados.
    throw new ArquivoDeProjetosInvalidoError(`${prefixo}:\n${(erro as Error).message}`);
  }
}
