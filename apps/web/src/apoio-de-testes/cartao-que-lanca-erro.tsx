// Apoio para os testes que precisam de um card que lança erro ao desenhar (ex.: provar que o
// limite de erro da seção Projetos segura a falha, T-018), sem depender de um bug real do card.
import type { Projeto } from '@site-apresentacao/shared';
import type { ComponentType } from 'react';

/** Um projeto com este título faz o card lançar erro ao desenhar; os demais aparecem normalmente. */
export const TITULO_DO_CARTAO_QUE_LANCA_ERRO = 'Card que lança erro';

type ModuloDoCartao = { default: ComponentType<{ projeto: Projeto }> };

/**
 * Troca o card verdadeiro por um que lança erro só para o projeto de título
 * `TITULO_DO_CARTAO_QUE_LANCA_ERRO`. Feito para a fábrica do `vi.mock`:
 *
 * ```ts
 * vi.mock('<caminho>/CartaoDeProjeto/CartaoDeProjeto', async (importarOriginal) => {
 *   const { comCartaoQueLancaErro } = await import('<caminho>/apoio-de-testes/cartao-que-lanca-erro');
 *   return comCartaoQueLancaErro(await importarOriginal());
 * });
 * ```
 */
export function comCartaoQueLancaErro(original: ModuloDoCartao): ModuloDoCartao {
  const CartaoVerdadeiro = original.default;

  function CartaoQueLancaErro({ projeto }: { projeto: Projeto }) {
    if (projeto.titulo === TITULO_DO_CARTAO_QUE_LANCA_ERRO) {
      throw new Error('erro simulado ao desenhar o card');
    }
    return <CartaoVerdadeiro projeto={projeto} />;
  }

  return { ...original, default: CartaoQueLancaErro };
}
