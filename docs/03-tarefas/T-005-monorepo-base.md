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

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-10 — tarefa criada
- 2026-10-10 — orquestrador: início — decisões Q1-B (fluxo devops → dev → code-reviewer → qa) e Q2-A (alinhar agentes)
