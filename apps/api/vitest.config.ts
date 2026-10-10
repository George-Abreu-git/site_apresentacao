import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Testes unitários ficam junto do código (src/); os de rota com Supertest, em test/.
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
  },
});
