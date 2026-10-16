/**
 * Token de injeção da lista de projetos curados.
 *
 * Classes (como `ProjetosService`) já servem de "nome" para o Nest injetar.
 * Uma lista (`ProjetoCurado[]`) não é classe, então precisa de um token próprio:
 * o módulo registra um provider com este token e o service pede `@Inject(PROJETOS_CURADOS)`.
 * Fica num arquivo separado para o service e o módulo importarem sem depender um do outro.
 */
export const PROJETOS_CURADOS = Symbol('PROJETOS_CURADOS');
