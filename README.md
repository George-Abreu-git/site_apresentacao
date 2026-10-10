# Site de apresentação do George

Site pessoal de apresentação (portfólio, stacks, projetos e contato) e trilha de aprendizado de front-end, API e integração entre os dois.
Regras do projeto: [AGENTS.md](AGENTS.md). Stack: [ADR-0001](docs/02-arquitetura/ADR-0001-stack.md).

## Estrutura

Monorepo com npm workspaces:

| Pasta | O que é |
|---|---|
| `apps/web/` | Front-end (React + Vite + TypeScript) |
| `apps/api/` | API (NestJS) |
| `packages/shared/` | Tipos compartilhados entre front e API |
| `e2e/` | Testes de aceitação no navegador (Playwright) |

## Pré-requisitos

- Node.js 24 e npm 11

## Como rodar

```bash
# 1. Instalar as dependências de todos os workspaces (um único comando, na raiz)
npm install

# 2. Baixar os navegadores usados pelo Playwright (só na primeira vez)
npx playwright install

# 3. Configurar a API: copie o modelo e preencha (o .env nunca vai para o git)
cp .env.example apps/api/.env

# 4. Subir a API e o front juntos (Ctrl+C encerra os dois)
npm run dev
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a API e o front em modo de desenvolvimento |
| `npm run build` | Gera o build de cada workspace (`packages/shared` primeiro) |
| `npm test` | Roda os testes unitários e de rotas de todos os workspaces |
| `npm run test:e2e` | Roda os testes de aceitação do Playwright (`e2e/`) |
| `npm run lint` | Roda o ESLint em cada workspace |

Para rodar um comando em um workspace só, use `--workspace` (ou `-w`), por exemplo `npm test -w apps/api`.

## Lint

O ESLint tem uma configuração única para o monorepo, em [`eslint.config.mjs`](eslint.config.mjs) ([ADR-0002](docs/02-arquitetura/ADR-0002-lint.md)): regras de JavaScript e TypeScript em tudo e regras de hooks do React só em `apps/web`.
Cada workspace roda `eslint .` e o ESLint encontra a configuração subindo até a raiz. Para corrigir automaticamente o que for possível: `npx eslint . --fix` dentro do workspace.

O `typescript` fica na raiz em `~6.0`, porque o typescript-eslint ainda não suporta o TypeScript 7.
