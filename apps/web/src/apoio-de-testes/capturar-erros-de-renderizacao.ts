// Apoio para os testes que provocam um erro dentro de um componente de propósito
// (ex.: bug conhecido marcado com `it.fails`).
import { vi } from 'vitest';

/**
 * Captura os erros que o React reporta como "não tratados" enquanto a captura estiver ligada.
 *
 * Sem isto, um erro lançado por um componente durante uma atualização assíncrona (ex.: a
 * resposta da API chegou) vai para o `window` e o Vitest o trata como erro solto da suíte,
 * deixando a execução vermelha mesmo com o teste marcado como bug conhecido. Com um ouvinte
 * de `error` no `window`, o Vitest entende que o erro foi tratado pelo teste.
 *
 * Também silencia o `console.error`, onde o React repete o mesmo erro.
 *
 * Uso: `const captura = capturarErrosDeRenderizacao(); try { ... } finally { captura.parar(); }`
 */
export function capturarErrosDeRenderizacao() {
  const erros: unknown[] = [];

  function ouvir(evento: ErrorEvent) {
    evento.preventDefault();
    erros.push(evento.error);
  }

  window.addEventListener('error', ouvir);
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  return {
    erros,
    parar() {
      window.removeEventListener('error', ouvir);
      consoleError.mockRestore();
    },
  };
}
