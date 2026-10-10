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

- Node.js 24 ou mais recente (declarado em `engines` no `package.json`; a API usa `process.loadEnvFile`) e npm 11

## Como rodar

```bash
# 1. Instalar as dependências de todos os workspaces (um único comando, na raiz)
npm install

# 2. Baixar o navegador usado pelo Playwright (só na primeira vez; os testes usam só o Chromium)
npx playwright install chromium

# 3. Compilar tudo uma vez (gera o dist/ do packages/shared, usado pela API e pelo front)
npm run build

# 4. Configurar a API: copie o modelo e preencha (o .env nunca vai para o git)
cp .env.example apps/api/.env

# 5. Subir a API e o front juntos (Ctrl+C encerra os dois)
npm run dev
```

Sobre o passo 3: a API e o front importam `@site-apresentacao/shared` a partir da pasta compilada `packages/shared/dist/`, que não vai para o git.
Num clone novo, antes do primeiro `npm run build`, o editor marca erro nesse import e `npm run build -w apps/api` (ou `-w apps/web`) sozinho falha.
Depois de mudar algo em `packages/shared`, rode `npm run build -w packages/shared` de novo.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a API e o front em modo de desenvolvimento |
| `npm run build` | Gera o build de cada workspace (`packages/shared` primeiro) |
| `npm test` | Roda os testes unitários e de rotas de todos os workspaces |
| `npm run test:e2e` | Roda os testes de aceitação do Playwright (`e2e/`) |
| `npm run lint` | Roda o ESLint em cada workspace e depois em `e2e/`, `scripts/` e `eslint.config.mjs` |

Para rodar um comando em um workspace só, use `--workspace` (ou `-w`), por exemplo `npm test -w apps/api`.

## Integração contínua (CI)

A cada push ou pull request para a `main`, o GitHub Actions roda o validador da estrutura, o lint, o build (checagem de tipos), os testes unitários e os testes de aceitação, conforme [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
O cabeçalho desse arquivo lista os comandos, na mesma ordem do CI, para reproduzir a verificação localmente.

## Lint

O ESLint tem uma configuração única para o monorepo, em [`eslint.config.mjs`](eslint.config.mjs) ([ADR-0002](docs/02-arquitetura/ADR-0002-lint.md)): regras de JavaScript e TypeScript em tudo e regras de hooks do React só em `apps/web`.
Cada workspace roda `eslint .` e o ESLint encontra a configuração subindo até a raiz.
O que não é workspace (`e2e/`, `scripts/` e o próprio `eslint.config.mjs`) é analisado pelo `npm run lint` da raiz, logo depois dos workspaces; a opção `--no-error-on-unmatched-pattern` evita erro enquanto uma dessas pastas não existe (ex.: `e2e/` antes dos primeiros testes). Para corrigir automaticamente o que for possível: `npx eslint . --fix` dentro do workspace.

O `typescript` fica na raiz em `~6.0`, porque o typescript-eslint ainda não suporta o TypeScript 7.
