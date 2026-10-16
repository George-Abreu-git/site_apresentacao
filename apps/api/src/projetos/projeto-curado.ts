import type { Projeto } from '@site-apresentacao/shared';

/**
 * Um projeto como está no arquivo curado: o `Projeto` sem os dados vivos do GitHub,
 * que a API acrescenta na hora de responder. Separar os dois tipos impede que o arquivo
 * curado traga um campo `github` "inventado".
 */
export type ProjetoCurado = Omit<Projeto, 'github'>;
