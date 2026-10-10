// Fonte única das seções da página (RF-01): o menu e a página leem desta lista,
// então um item do menu nunca aponta para uma seção que não existe.

export interface ItemDeSecao {
  /** Vira o `id` do <section> e a âncora do link (ex.: "#sobre"). */
  id: string;
  /** Texto do item do menu e do título da seção. */
  titulo: string;
}

export const SECOES: readonly ItemDeSecao[] = [
  { id: 'inicio', titulo: 'Início' },
  { id: 'sobre', titulo: 'Sobre' },
  { id: 'stacks', titulo: 'Stacks' },
  { id: 'projetos', titulo: 'Projetos' },
  { id: 'servicos', titulo: 'Serviços' },
  { id: 'contato', titulo: 'Contato' },
];
