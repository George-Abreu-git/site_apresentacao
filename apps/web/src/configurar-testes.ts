// Roda antes de cada arquivo de teste do front (ver `setupFiles` em vite.config.ts).
import '@testing-library/jest-dom/vitest'; // matchers como toBeInTheDocument()
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Desmonta o que cada teste renderizou, para um teste não enxergar a tela do outro.
afterEach(() => {
  cleanup();
});
