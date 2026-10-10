// Configuração única do ESLint para o monorepo inteiro (ADR-0002).
//
// Formato "flat": o arquivo exporta uma lista de blocos de configuração.
// Cada bloco pode ter `files` (a quais arquivos ele se aplica); os blocos são
// aplicados em ordem e, se dois definem a mesma regra, vale o último.
//
// Os workspaces NÃO têm configuração própria. O script `lint` de cada um é
// só `eslint .`: o ESLint procura o `eslint.config.*` subindo as pastas a
// partir de cada arquivo e encontra este, na raiz. Por isso os caminhos
// abaixo (`apps/web/**` etc.) são sempre relativos à raiz do repositório.
//
// A extensão .mjs faz o Node tratar o arquivo como módulo ES (import/export),
// sem precisar de "type": "module" no package.json da raiz.
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // 1. Pastas geradas (builds, relatórios de testes, dependências): nunca são analisadas.
  //    O `**/` no início vale para qualquer workspace (ex.: apps/web/dist/).
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/coverage/',
    '**/playwright-report/',
    '**/test-results/',
  ]),

  // 2. Regras recomendadas para JavaScript e TypeScript, em todos os arquivos.
  //    O typescript-eslint ensina o ESLint a ler TypeScript e acrescenta regras
  //    próprias (ex.: proíbe `any` explícito). Usamos o conjunto "recommended",
  //    que não precisa do tsconfig para rodar (mais simples e mais rápido).
  js.configs.recommended,
  tseslint.configs.recommended,

  // 3. Front-end (apps/web): código que roda no navegador e usa React.
  //    As regras de hooks pegam erros que o TypeScript não vê, como chamar
  //    `useState` dentro de um `if` ou esquecer uma dependência no `useEffect`.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
    languageOptions: {
      globals: globals.browser, // `window`, `document`, `fetch` etc.
    },
  },

  // 4. Código que roda no Node: a API, o pacote compartilhado, os testes e2e,
  //    os scripts da raiz e as configs (ex.: vite.config.ts, playwright.config.ts).
  {
    files: [
      'apps/api/**/*.ts',
      'packages/**/*.ts',
      'e2e/**/*.ts',
      'scripts/**/*.{js,mjs}',
      'apps/web/*.config.{ts,js,mjs}',
      '*.{js,mjs}',
    ],
    languageOptions: {
      globals: globals.node, // `process`, `__dirname` etc.
    },
  },
]);
