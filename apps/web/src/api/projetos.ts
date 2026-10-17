import type { Projeto } from '@site-apresentacao/shared';
import { enderecoDaApi } from './endereco-da-api';
import { ehProjeto } from './formato-do-projeto';

/**
 * Busca a lista de projetos na API (GET /api/projetos, RF-06).
 *
 * Rejeita a Promise em qualquer falha (rede, status de erro, resposta fora do formato),
 * para quem chama tratar tudo num lugar só e mostrar a mensagem amigável.
 *
 * @param sinal permite cancelar a requisição (ex.: o componente saiu da tela antes da resposta).
 */
export async function buscarProjetos(sinal?: AbortSignal): Promise<Projeto[]> {
  const resposta = await fetch(`${enderecoDaApi()}/api/projetos`, { signal: sinal });

  // O fetch só rejeita quando a rede falha; um 500 da API chega como resposta "normal".
  if (!resposta.ok) {
    throw new Error(`A API de projetos respondeu com o status ${resposta.status}`);
  }

  const corpo: unknown = await resposta.json();
  if (!Array.isArray(corpo)) {
    throw new Error('A API de projetos não devolveu uma lista');
  }
  // O tipo Projeto compartilhado com a API não vale em tempo de execução: cada item é conferido.
  // Basta um item fora do formato para recusar a resposta inteira (mensagem amigável na seção, T-018).
  if (!corpo.every(ehProjeto)) {
    throw new Error('A API de projetos devolveu um projeto fora do formato');
  }
  return corpo;
}
