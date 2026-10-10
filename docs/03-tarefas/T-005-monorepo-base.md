---
id: T-005
titulo: Montar o monorepo base (workspaces, web, api, shared e ferramentas de teste)
status: backlog
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

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-10 — tarefa criada
