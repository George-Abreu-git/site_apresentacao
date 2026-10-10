import react from '@vitejs/plugin-react';
// `defineConfig` do Vitest é o mesmo do Vite, com o bloco `test` tipado.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom simula o navegador (document, window) dentro do Node.
    environment: 'jsdom',
    setupFiles: ['./src/configurar-testes.ts'],
  },
});
