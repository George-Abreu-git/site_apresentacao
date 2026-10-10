/**
 * Um projeto do portfólio, no formato que a API devolve e o front exibe.
 *
 * Por enquanto tem só os campos do arquivo curado (RF-06, item 1).
 * A T-010 (módulo projetos) confirma o formato e a T-011 acrescenta
 * os dados vivos do GitHub (linguagem, estrelas, última atualização).
 */
export interface Projeto {
  titulo: string;
  descricao: string;
  /** Tecnologias usadas, na ordem em que aparecem no card (ex.: "React", "NestJS"). */
  stacks: string[];
  /** Endereço do repositório; ausente quando o projeto não tem código público. */
  repositorio?: string;
  /** Endereço da versão publicada, quando houver. */
  demo?: string;
  /** Caminho da imagem de capa, quando houver. */
  imagem?: string;
}
