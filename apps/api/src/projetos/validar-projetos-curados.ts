import type { ProjetoCurado } from './projeto-curado.js';

/**
 * Erro lançado quando o arquivo curado de projetos não segue o formato documentado
 * (apps/api/conteudo/README.md). A mensagem lista todos os problemas de uma vez.
 */
export class ArquivoDeProjetosInvalidoError extends Error {
  override name = 'ArquivoDeProjetosInvalidoError';
}

const CAMPOS_OBRIGATORIOS_DE_TEXTO = ['titulo', 'descricao'] as const;
const CAMPOS_OPCIONAIS_DE_ENDERECO = ['repositorio', 'demo'] as const;
const CAMPOS_CONHECIDOS = new Set<string>([
  ...CAMPOS_OBRIGATORIOS_DE_TEXTO,
  'stacks',
  ...CAMPOS_OPCIONAIS_DE_ENDERECO,
  'imagem',
]);

/**
 * Confere se os dados lidos do arquivo curado têm o formato do tipo `ProjetoCurado`.
 *
 * O TypeScript só checa tipos no código; um JSON lido em tempo de execução pode
 * ter qualquer coisa. Por isso os dados entram como `unknown` e só saem como
 * `ProjetoCurado[]` depois de conferidos campo a campo.
 *
 * @throws ArquivoDeProjetosInvalidoError com a lista de todos os problemas encontrados.
 */
export function validarProjetosCurados(dados: unknown): ProjetoCurado[] {
  if (!Array.isArray(dados)) {
    throw new ArquivoDeProjetosInvalidoError(
      'o conteúdo deve ser uma lista (array) de projetos, ex.: [{ "titulo": ... }]',
    );
  }

  const problemas = dados.flatMap((item, indice) => problemasDoProjeto(item, indice));
  if (problemas.length > 0) {
    throw new ArquivoDeProjetosInvalidoError(problemas.join('\n'));
  }

  return dados as ProjetoCurado[];
}

/** Devolve a lista de problemas de um item (vazia quando o item é válido). */
function problemasDoProjeto(item: unknown, indice: number): string[] {
  // Numeração a partir de 1, como quem lê o arquivo conta os projetos.
  const numero = indice + 1;

  if (!ehObjeto(item)) {
    return [`projeto ${numero}: deve ser um objeto { "titulo": ..., "descricao": ..., "stacks": [...] }`];
  }

  const identificacao = ehTextoNaoVazio(item.titulo)
    ? `projeto ${numero} ("${item.titulo}")`
    : `projeto ${numero}`;

  return problemasDosCampos(item).map((problema) => `${identificacao}: ${problema}`);
}

function problemasDosCampos(projeto: Record<string, unknown>): string[] {
  const problemas: string[] = [];

  for (const campo of CAMPOS_OBRIGATORIOS_DE_TEXTO) {
    if (!ehTextoNaoVazio(projeto[campo])) {
      problemas.push(`campo "${campo}" é obrigatório e deve ser um texto não vazio`);
    }
  }

  if (!ehListaDeTextos(projeto.stacks)) {
    problemas.push('campo "stacks" é obrigatório e deve ser uma lista de textos não vazios');
  }

  for (const campo of CAMPOS_OPCIONAIS_DE_ENDERECO) {
    if (campo in projeto && !ehEnderecoHttp(projeto[campo])) {
      problemas.push(`campo "${campo}", quando presente, deve ser um endereço http(s)`);
    }
  }

  if ('imagem' in projeto && !ehTextoNaoVazio(projeto.imagem)) {
    problemas.push('campo "imagem", quando presente, deve ser um texto não vazio');
  }

  for (const campo of Object.keys(projeto)) {
    if (!CAMPOS_CONHECIDOS.has(campo)) {
      problemas.push(`campo "${campo}" não faz parte do formato (erro de digitação?)`);
    }
  }

  return problemas;
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  // `typeof null` e `typeof []` também dão "object"; por isso as duas checagens a mais.
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function ehTextoNaoVazio(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim() !== '';
}

function ehListaDeTextos(valor: unknown): valor is string[] {
  return Array.isArray(valor) && valor.every(ehTextoNaoVazio);
}

function ehEnderecoHttp(valor: unknown): boolean {
  return typeof valor === 'string' && /^https?:\/\/\S+$/.test(valor);
}
