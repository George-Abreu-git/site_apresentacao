// Fonte única das seções da página (RF-01): o menu e a página leem desta lista,
// então um item do menu nunca aponta para uma seção que não existe.
// Os títulos vêm do arquivo de conteúdo (RF-09); aqui ficam só os ids e a ordem.
import { conteudo } from './conteudo';

/** Ids das seções, na ordem em que aparecem na página. */
export const IDS_DAS_SECOES = ['inicio', 'sobre', 'stacks', 'projetos', 'servicos', 'contato'] as const;

export type IdDeSecao = (typeof IDS_DAS_SECOES)[number];

export interface ItemDeSecao {
  /** Vira o `id` do <section> e a âncora do link (ex.: "#sobre"). */
  id: IdDeSecao;
  /** Texto do item do menu e do título da seção. */
  titulo: string;
}

/**
 * Id do título (<h2>) de uma seção (ex.: "projetos-titulo"). Fica aqui, num lugar só,
 * porque a Secao usa para nomear o <section> e outros componentes usam para nomear
 * listas com o título da seção (aria-labelledby).
 */
export function idDoTituloDaSecao(id: string): string {
  return `${id}-titulo`;
}

export const SECOES: readonly ItemDeSecao[] = IDS_DAS_SECOES.map((id) => ({
  id,
  titulo: conteudo.secoes[id],
}));
