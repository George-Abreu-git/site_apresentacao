---
id: T-005
titulo: Montar o monorepo base (workspaces, web, api, shared e ferramentas de teste)
status: em-andamento
modo: agente-faz
tags: [infra]
rodadas: 0
criada: 2026-10-10
---

# T-005 — Montar o monorepo base (workspaces, web, api, shared e ferramentas de teste)

## Descrição

Cria a estrutura de código da ADR-0001, sem funcionalidades: apenas o esqueleto que roda, compila e testa.

## Critérios de aceite

- [ ] `package.json` na raiz com npm workspaces (`apps/*`, `packages/*`) e scripts `dev`, `build`, `test`, `test:e2e`, `lint`
- [ ] `apps/web`: Vite + React + TypeScript com CSS Modules; página placeholder; um teste Vitest + Testing Library passando
- [ ] `apps/api`: NestJS com um endpoint `GET /api/health` → `{ status: "ok" }`; um teste unitário (Vitest ou Jest do Nest — decisão do George se houver dúvida) e um teste de rota com Supertest passando
- [ ] `packages/shared`: tipo `Projeto` exportado e importado por `apps/web` e `apps/api` (prova que o compartilhamento funciona)
- [ ] `e2e/`: Playwright configurado com um teste que abre a página placeholder em viewport de celular e de desktop
- [ ] `.env.example` documenta as variáveis da API (ex.: `GITHUB_TOKEN`, `CORS_ORIGIN`)
- [ ] `npm test` e `npm run test:e2e` passam na raiz; `README` curto de como rodar

## Contexto relevante

- Depende de: T-004
- [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]]
- [[docs/03-tarefas/T-004-atualiza-agents-stack|T-004]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).
- 2026-10-10 — orquestrador: o teste unitário da API usa **Vitest**, conforme a ADR-0001 (decisão 6); a dúvida do critério da `apps/api` está coberta pela ADR.
- 2026-10-10 — George (Q1-B): implementação **dividida por área**, sem exceção: (1) **devops** cria a raiz (`package.json` com workspaces e scripts, `tsconfig` base, `.env.example`, README); (2) **dev** cria `apps/web`, `apps/api` e `packages/shared` com os testes unitários; (3) **code-reviewer** revisa o diff dos dois; (4) **qa** escreve o Playwright (com `playwright.config.ts` dentro de `e2e/`) e o teste de rota com Supertest em `apps/api/test/`, e roda tudo. Ajustes voltam ao agente dono do arquivo.
- 2026-10-10 — George (Q2-A): aprova que o **devops alinhe `.claude/agents/dev.md`, `qa.md` e `devops.md`** às áreas do `AGENTS.md` (sem `src/**`/`tests/**`) e o gatilho da suíte na `orquestrar-tarefa` ("sem `src/`" → "sem `apps/`"), como primeiro passo desta tarefa.
- 2026-10-10 — George (Q3-A): **ESLint** com configuração única na raiz + typescript-eslint + regras de hooks do React — registrado em [[docs/02-arquitetura/ADR-0002-lint|ADR-0002]]. O devops volta para criar a configuração na raiz antes do dev.
- 2026-10-10 — George (Q4-A): o **`package-lock.json` é arquivo gerado** — o implementador (dev ou devops) pode alterá-lo ao instalar dependências; o code-reviewer confere o diff do lock. O devops registra a regra na tabela de áreas do `AGENTS.md`.

## Dev

## Revisão

## QA

## Estudo

## DevOps

### Rodada 1 — etapa 1 (agentes + raiz)

**Resultado:** AGUARDANDO-DECISAO — etapa 1 concluída na área do devops; validador OK; duas decisões (Q3 lint, Q4 lockfile) antes da etapa do dev. Não rodou `npm install` (sem `package-lock.json` nem `node_modules`).

- **Q2-A:** `dev.md`, `qa.md` e `devops.md` citam as áreas do `AGENTS.md` (`apps/**`, `packages/**`, `e2e/**`, `apps/api/test/**`), sem `src/**`/`tests/**`. Na `orquestrar-tarefa`, o gatilho virou "enquanto não houver `apps/` nem suíte de testes", e a suíte obrigatória ficou definida como `npm test` + `npm run test:e2e`.
- **Raiz (Q1-B):** `package.json` com workspaces (`packages/*` antes de `apps/*`, para o `build` rodar shared → api → web) e os 5 scripts; `tsconfig.base.json`; `.env.example` (`PORT`, `CORS_ORIGIN`, `GITHUB_TOKEN` vazio); `README.md`; `scripts/dev.mjs`.
- **Testado** numa cópia temporária com workspaces falsos: ordem do `build` e `scripts/dev.mjs` subindo dois servidores em paralelo (devolve erro se um falha). No repositório real, `lint` e `dev` falham com "No workspaces found" até existirem os workspaces; `test:e2e` falha até o qa criar `e2e/playwright.config.ts`.

**Pontos para o code-reviewer olhar:**
- `scripts/dev.mjs` (não pedido): `npm run --workspaces` roda um workspace por vez e servidor de dev nunca termina; o script usa só Node, sem dependência nova (a alternativa `concurrently` seria tecnologia fora da ADR-0001).
- `.env` em `apps/api/.env` (a API roda com `apps/api` como diretório atual); o dev precisa fazer a API ler esse arquivo.
- `@playwright/test` (^1.64.0) como devDependency da raiz, porque `e2e/` não é workspace e o qa não edita o `package.json` da raiz.

**Pendências para as próximas etapas:** cada workspace precisa dos scripts `build`, `test`, `lint` (e `dev` em web e api) e de um `tsconfig.json` com `"extends": "../../tsconfig.base.json"`; a API deve ler `apps/api/.env`; o qa cria `e2e/playwright.config.ts` (navegadores via `npx playwright install`, já no README).

Commits do orquestrador: agentes/skill e raiz (ver Log).

## Log

- 2026-10-10 — tarefa criada
- 2026-10-10 — orquestrador: início — decisões Q1-B (fluxo devops → dev → code-reviewer → qa) e Q2-A (alinhar agentes)
- 2026-10-10 — devops: AGUARDANDO-DECISAO — etapa 1 (agentes alinhados + raiz do monorepo) concluída; validador OK; Q3 (lint) e Q4 (lockfile) para o George
- 2026-10-10 — orquestrador: decisões Q3-A (ESLint, ADR-0002) e Q4-A (lock gerado); devops volta para a etapa 1b
