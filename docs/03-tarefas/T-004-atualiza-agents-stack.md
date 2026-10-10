---
id: T-004
titulo: Atualizar AGENTS.md com a stack e as áreas por caminho da ADR-0001
status: em-andamento
modo: agente-faz
tags: [orquestracao]
rodadas: 0
criada: 2026-10-10
---

# T-004 — Atualizar AGENTS.md com a stack e as áreas por caminho da ADR-0001

## Descrição

Atualiza o `AGENTS.md` (seção Stack, árvore de pastas e tabela "Áreas por caminho") conforme as consequências da ADR-0001, e ajusta o `.gitignore` para projetos Node.

## Critérios de aceite

- [ ] Seção Stack do `AGENTS.md` resume a ADR-0001 e linka para ela
- [ ] Árvore de pastas inclui `apps/web/`, `apps/api/`, `packages/shared/`, `e2e/`
- [ ] Áreas por caminho: dev → `apps/**` e `packages/**` (incluindo testes unitários junto do código); qa → `e2e/**` e `apps/api/test/**`; devops → plataforma + configs de deploy e CI; nenhuma sobreposição entre dev e qa
- [ ] `.gitignore` cobre `node_modules/`, `dist/`, `coverage/`, `playwright-report/`, `test-results/`, `.env*` (mantendo `!.env.example`)
- [ ] `python3 scripts/validar_estrutura.py` passa

## Contexto relevante

- Depende de: —
- [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-10 — tarefa criada
- 2026-10-10 — orquestrador: início — implementador devops (tag `orquestracao`)
