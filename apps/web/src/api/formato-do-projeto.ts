import type { DadosVivosDoGithub, Projeto } from '@site-apresentacao/shared';

/**
 * Confere, em tempo de execução, se um item da resposta da API tem o formato de `Projeto`.
 *
 * O tipo `Projeto` só existe para o TypeScript: depois de compilado, nada impede a API
 * (ou um proxy no caminho) de devolver outra coisa. Sem esta conferência, um item sem
 * `stacks` faz o card lançar erro ao renderizar (T-018).
 *
 * É uma "type guard" (`valor is Projeto`): quando devolve `true`, o TypeScript passa a
 * tratar `valor` como `Projeto`, sem precisar de `as`.
 *
 * Campos a mais são aceitos de propósito: a API pode ganhar campos novos sem quebrar o front.
 */
export function ehProjeto(valor: unknown): valor is Projeto {
  return (
    ehObjeto(valor) &&
    typeof valor.titulo === 'string' &&
    typeof valor.descricao === 'string' &&
    ehListaDeTextos(valor.stacks) &&
    // repositorio e demo viram `href` no card: só endereços http(s), nunca "javascript:...".
    opcional(valor.repositorio, ehEnderecoHttp) &&
    opcional(valor.demo, ehEnderecoHttp) &&
    opcional(valor.imagem, ehTexto) &&
    opcional(valor.github, ehDadosVivosDoGithub)
  );
}

function ehDadosVivosDoGithub(valor: unknown): valor is DadosVivosDoGithub {
  if (!ehObjeto(valor) || typeof valor.disponivel !== 'boolean') return false;
  // Com o GitHub indisponível não há dados; com ele disponível, os três campos são obrigatórios.
  if (!valor.disponivel) return true;

  return (
    (valor.linguagem === null || ehTexto(valor.linguagem)) &&
    typeof valor.estrelas === 'number' &&
    ehTexto(valor.ultimaAtualizacao)
  );
}

/** Campo opcional: ausente (`undefined`) é válido; presente, precisa passar na conferência. */
function opcional(valor: unknown, conferir: (valor: unknown) => boolean): boolean {
  return valor === undefined || conferir(valor);
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  // `typeof null` e `typeof []` também dão "object"; por isso as duas checagens a mais.
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function ehTexto(valor: unknown): valor is string {
  return typeof valor === 'string';
}

function ehListaDeTextos(valor: unknown): valor is string[] {
  return Array.isArray(valor) && valor.every(ehTexto);
}

function ehEnderecoHttp(valor: unknown): boolean {
  return ehTexto(valor) && /^https?:\/\//i.test(valor);
}
