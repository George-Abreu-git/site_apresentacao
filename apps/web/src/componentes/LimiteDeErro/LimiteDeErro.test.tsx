import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { capturarErrosDeRenderizacao } from '../../apoio-de-testes/capturar-erros-de-renderizacao';
import LimiteDeErro from './LimiteDeErro';

const ERRO = new Error('falha ao desenhar');

/** Componente de teste que sempre lança erro ao renderizar. */
function ComponenteQuebrado(): never {
  throw ERRO;
}

describe('LimiteDeErro (error boundary)', () => {
  it('sem erro, mostra os filhos e não avisa falha', () => {
    const aoFalhar = vi.fn();

    render(
      <LimiteDeErro aoFalhar={aoFalhar}>
        <p>conteúdo</p>
      </LimiteDeErro>,
    );

    expect(screen.getByText('conteúdo')).toBeInTheDocument();
    expect(aoFalhar).not.toHaveBeenCalled();
  });

  it('quando um filho lança erro ao renderizar, tira os filhos da tela e avisa a falha com o erro', () => {
    const aoFalhar = vi.fn();
    const captura = capturarErrosDeRenderizacao();

    try {
      render(
        <LimiteDeErro aoFalhar={aoFalhar}>
          <p>irmão do quebrado</p>
          <ComponenteQuebrado />
        </LimiteDeErro>,
      );

      expect(screen.queryByText('irmão do quebrado')).not.toBeInTheDocument();
      expect(aoFalhar).toHaveBeenCalledTimes(1);
      expect(aoFalhar).toHaveBeenCalledWith(ERRO);
    } finally {
      captura.parar();
    }
  });

  it('o erro fica contido: o que está fora do limite continua na tela e nada vaza como erro solto', () => {
    const captura = capturarErrosDeRenderizacao();

    try {
      render(
        <main>
          <h1>Título da página</h1>
          <LimiteDeErro aoFalhar={() => undefined}>
            <ComponenteQuebrado />
          </LimiteDeErro>
        </main>,
      );

      expect(screen.getByRole('heading', { level: 1, name: 'Título da página' })).toBeInTheDocument();
      // Um erro que o limite não segurasse chegaria ao `window` como erro não tratado.
      expect(captura.erros).toEqual([]);
    } finally {
      captura.parar();
    }
  });
});
