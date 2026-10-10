// Configuração do Playwright (testes de aceitação no navegador).
// O `npm run test:e2e` da raiz roda: playwright test --config e2e/playwright.config.ts
//
// Os caminhos relativos daqui (testDir, outputDir) partem desta pasta (e2e/).
import { defineConfig, devices } from '@playwright/test';

// Porta do servidor de desenvolvimento do Vite (a padrão dele).
const PORTA_DO_FRONT = 5173;
const ENDERECO_DO_FRONT = `http://localhost:${PORTA_DO_FRONT}`;

export default defineConfig({
  // Os testes ficam em e2e/testes/ e terminam em .spec.ts.
  testDir: './testes',
  // Saídas geradas (ignoradas pelo git e pelo ESLint).
  outputDir: './test-results',
  reporter: [['list'], ['html', { outputFolder: './playwright-report', open: 'never' }]],

  // No CI, um `test.only` esquecido faz a suíte falhar, e um teste instável tem 2 novas tentativas.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  use: {
    // Com baseURL, os testes podem usar caminhos curtos: page.goto('/').
    baseURL: ENDERECO_DO_FRONT,
    // Guarda o "rastro" (passo a passo com capturas) só quando um teste falha e é repetido.
    trace: 'on-first-retry',
  },

  // Cada teste roda uma vez por "projeto": aqui, um celular e um desktop.
  // Os dois usam o Chromium, então basta `npx playwright install chromium`.
  projects: [
    { name: 'celular', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],

  // O Playwright sobe o front sozinho antes dos testes e o derruba no fim.
  // Fora do CI, se já houver um `npm run dev` rodando na porta, ele é reaproveitado.
  webServer: {
    command: `npm run dev -w apps/web -- --port ${PORTA_DO_FRONT} --strictPort`,
    // O comando roda a partir da raiz do repositório (onde estão os workspaces).
    cwd: '..',
    url: ENDERECO_DO_FRONT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
