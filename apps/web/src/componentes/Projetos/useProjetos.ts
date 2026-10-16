import type { Projeto } from '@site-apresentacao/shared';
import { useEffect, useState } from 'react';
import { buscarProjetos } from '../../api/projetos';

/**
 * Os três momentos da busca. Uma união discriminada (o campo `situacao` diz qual é)
 * impede estados impossíveis, como "carregando" e "erro" ao mesmo tempo, e só deixa
 * ler `projetos` depois que eles chegaram.
 */
export type EstadoDosProjetos =
  | { situacao: 'carregando' }
  | { situacao: 'carregado'; projetos: Projeto[] }
  | { situacao: 'erro' };

/** Busca os projetos na API uma vez, quando o componente aparece na tela. */
export function useProjetos(): EstadoDosProjetos {
  const [estado, setEstado] = useState<EstadoDosProjetos>({ situacao: 'carregando' });

  useEffect(() => {
    // O AbortController cancela a requisição se o componente sair da tela antes da resposta.
    // No desenvolvimento, o StrictMode monta, desmonta e monta de novo: a 1ª busca é cancelada.
    const controlador = new AbortController();

    buscarProjetos(controlador.signal).then(
      (projetos) => {
        if (!controlador.signal.aborted) setEstado({ situacao: 'carregado', projetos });
      },
      () => {
        // Um cancelamento nosso não é falha da API: não mostra mensagem de erro.
        if (!controlador.signal.aborted) setEstado({ situacao: 'erro' });
      },
    );

    // Função de limpeza: o React a chama quando o componente sai da tela.
    return () => controlador.abort();
  }, []);

  return estado;
}
