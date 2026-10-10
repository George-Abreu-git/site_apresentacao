---
id: T-006
titulo: CI no GitHub Actions (validador e testes a cada push)
status: backlog
modo: agente-faz
tags: [infra]
rodadas: 0
criada: 2026-10-10
---

# T-006 — CI no GitHub Actions (validador e testes a cada push)

## Descrição

Pipeline de integração contínua que roda em cada push e pull request para `main`.

## Critérios de aceite

- [ ] Workflow em `.github/workflows/ci.yml` com etapas: instalar dependências, `python3 scripts/validar_estrutura.py`, `npm run lint`, `npm test`, `npm run test:e2e`
- [ ] Cache de dependências npm
- [ ] Cada etapa comentada explicando o que faz (didático)
- [ ] Pipeline verde no GitHub após o push

## Contexto relevante

- Depende de: T-005
- [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]]
- [[docs/03-tarefas/T-005-monorepo-base|T-005]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-10 — tarefa criada
