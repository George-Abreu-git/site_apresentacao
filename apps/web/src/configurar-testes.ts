// Roda antes de cada arquivo de teste do front (ver `setupFiles` em vite.config.ts).
import '@testing-library/jest-dom/vitest'; // matchers como toBeInTheDocument()
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// Nenhum teste acessa a rede de verdade. Por padrão, a API "nunca responde"
// (a seção Projetos fica carregando); o teste que precisar de uma resposta
// troca o fetch de novo com `vi.stubGlobal('fetch', ...)`.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(() => new Promise<Response>(() => {})),
  );
});

afterEach(() => {
  // Desmonta o que cada teste renderizou, para um teste não enxergar a tela do outro.
  cleanup();
  // Devolve o fetch e as variáveis de ambiente (vi.stubEnv) originais.
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
