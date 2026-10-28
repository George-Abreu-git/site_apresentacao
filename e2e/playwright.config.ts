// Configuração do Playwright (testes de aceitação no navegador).
// O `npm run test:e2e` da raiz roda: playwright test --config e2e/playwright.config.ts
//
// Os caminhos relativos daqui (testDir, outputDir) partem desta pasta (e2e/).
import { defineConfig, devices } from '@playwright/test';

// Porta padrão do servidor de desenvolvimento do Vite.
const PORTA_PADRAO = 5173;

// Lê a porta de uma variável de ambiente; vazia ou ausente → a padrão.
// Valor que não é uma porta válida para a execução com um erro claro, em vez
// de subir o front numa porta inesperada.
function lerPorta(valor: string | undefined, padrao: number): number {
  if (valor === undefined || valor.trim() === '') return padrao;
  const porta = Number(valor.trim());
  if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
    throw new Error(`E2E_PORTA_FRONT inválida: "${valor}" (use um inteiro de 1 a 65535)`);
  }
  return porta;
}

// Porta do front nos testes. Cada checkout que roda o e2e ao mesmo tempo (ex.:
// um worktree de tarefa em paralelo, T-035) usa a sua, via E2E_PORTA_FRONT;
// senão o `reuseExistingServer` reaproveitaria o servidor do outro checkout
// e os testes rodariam contra o código errado. Sem a variável, nada muda: 5173.
const PORTA_DO_FRONT = lerPorta(process.env.E2E_PORTA_FRONT, PORTA_PADRAO);
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
