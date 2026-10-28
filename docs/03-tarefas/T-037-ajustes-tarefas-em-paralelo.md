---
id: T-037
titulo: Ajustes no fluxo de tarefas em paralelo (backlog, remoção do worktree no Windows e textos da ADR-0004)
status: backlog
modo: agente-faz
tags: [orquestracao]
rodadas: 0
criada: 2026-10-27
---

# T-037 — Ajustes no fluxo de tarefas em paralelo (backlog, remoção do worktree no Windows e textos da ADR-0004)

## Descrição

Achados do orquestrador e dos revisores ao rodar a primeira tarefa em worktree (T-035) e ao usar a seção "Tarefas em paralelo" da skill `orquestrar-tarefa`:

- A linha nova da tarefa no backlog, criada pelo `/nova-tarefa`, conflitou no rebase da T-035 porque foi commitada só dentro do worktree, enquanto a `main` ganhava outra linha no mesmo lugar.
- No Windows, `git worktree remove` num worktree com `node_modules` deixou a pasta com atalhos de diretório (junctions dos workspaces `@site-apresentacao/*`) apontando para pastas já apagadas. E, como o `.git` do worktree já tinha sido removido, um `git -C <pasta do worktree>` passou a agir no checkout principal (git sobe até o repositório pai) — risco de mexer na tarefa errada.
- A spec `docs/02-arquitetura/specs/2026-10-09-orquestracao-agentes-design.md:41` ainda diz "qa → `e2e/**`", contra a [[docs/02-arquitetura/ADR-0004-qa-so-altera-testes|ADR-0004]].
- `lerPorta` é exportada em `e2e/playwright.config.ts`, mas nada a importa (opcional do code-reviewer da T-035).

Severidade: baixa.

## Critérios de aceite

- [ ] Na seção "Tarefas em paralelo" da `orquestrar-tarefa`: a linha nova do backlog entra na `main` (commit e push) antes de criar o worktree da tarefa.
- [ ] Na mesma seção: passo a passo seguro para remover o worktree no Windows — apagar os atalhos de `node_modules` sem segui-los (ou limpar o `node_modules` antes), conferir que a pasta sumiu, e nunca usar `git -C` numa pasta de worktree já removida.
- [ ] A spec `2026-10-09-orquestracao-agentes-design.md` deixa de dizer "qa → `e2e/**`" e aponta para a ADR-0004.
- [ ] `lerPorta` em `e2e/playwright.config.ts`: tirar o `export` ou ganhar teste (valor ausente, vazio, válido e inválido).
- [ ] `npm run test:hooks`, `npm test`, `npm run lint`, `python3 scripts/validar_estrutura.py` e `npm run test:e2e` verdes.

## Contexto relevante

- Origem: [[docs/03-tarefas/T-035-devs-em-paralelo|T-035]] (Log, Revisão e QA)
- `.claude/skills/orquestrar-tarefa/SKILL.md` (seção "Tarefas em paralelo")
- [[docs/02-arquitetura/ADR-0004-qa-so-altera-testes|ADR-0004]]

## Decisões

- 2026-10-27 — George: criar a tarefa com os critérios propostos, modo `agente-faz`, tag `orquestracao`.

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-27 — tarefa criada
