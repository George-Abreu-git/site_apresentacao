/**
 * Um projeto do portfólio, no formato que a API devolve e o front exibe.
 *
 * Junta os campos do arquivo curado (RF-06, item 1), documentados em
 * apps/api/conteudo/README.md, com os dados vivos do GitHub (RF-06, item 2).
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
  /**
   * Dados vivos do GitHub. Só existe quando `repositorio` é um repositório do GitHub;
   * projetos sem repositório no GitHub aparecem só com os dados curados.
   */
  github?: DadosVivosDoGithub;
}

/** Dados do repositório lidos da API do GitHub. */
export interface DadosDoGithub {
  /** Linguagem principal; `null` quando o GitHub não identifica nenhuma (ex.: repositório vazio). */
  linguagem: string | null;
  estrelas: number;
  /** Data e hora do último push, em ISO 8601 (ex.: "2026-10-01T12:00:00Z"). */
  ultimaAtualizacao: string;
}

/**
 * Resultado da consulta ao GitHub para um projeto.
 *
 * `disponivel` separa os dois casos (união discriminada): com `true` vêm os dados;
 * com `false` o GitHub estava indisponível ou com o limite de requisições atingido,
 * e o front mostra só os dados curados.
 */
export type DadosVivosDoGithub = ({ disponivel: true } & DadosDoGithub) | { disponivel: false };
