---
id: T-037
titulo: Ajustes no fluxo de tarefas em paralelo (backlog, remoção do worktree no Windows e textos da ADR-0004)
status: em-qa
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

### Rodada 1

Resultado: APROVADO
Resumo: O diff atende aos 4 critérios de conteúdo. A tarefa nova entra na `main` antes do worktree (com alternativa pelo worktree aberto em `main`), a limpeza no Windows é segura (rmdir sem seguir as junctions, conferência de que a pasta sumiu, nada de `git -C` depois da remoção), a spec aponta para a ADR-0004 e o `lerPorta` deixou de ser exportado. Validador, hooks (465), lint e testes unitários verdes, rodados de novo no worktree. Não rodou o e2e de novo (a única mudança de código foi tirar um `export`); vale o resultado do devops na 5174, e os 21 pulados são por projeto (`test.skip` celular/desktop). Tudo dentro da área do devops.
Arquivos alterados: nenhum
Pendências:
1. *opcional*: confirmar na limpeza do worktree da T-037 que o `cmd /c rmdir /s /q` remove as junctions da `node_modules` sem segui-las, e registrar no Log.
2. *opcional*: no `/nova-tarefa`, quando a tarefa nasce pelo worktree aberto em `main`, calcular o próximo id a partir da `main` atualizada.
Decisão pendente: nenhuma
Conceitos para estudo: junctions do Windows e `rmdir /s` sem seguir links; como o git sobe as pastas procurando um repositório; worktree aberto em `main` e depois `switch -c`; `test.skip` condicional por projeto no Playwright

## QA

## Estudo

## DevOps

### Rodada 1

Resultado: CONCLUIDO
Resumo: Na seção "Tarefas em paralelo" da `orquestrar-tarefa`, a tarefa nova (nota e linha do backlog) entra na `main` com push antes do worktree, com uma alternativa pelo próprio worktree aberto em `main` quando o checkout principal está ocupado; o `/nova-tarefa` aponta para essa exceção. A limpeza do worktree ganhou um passo a passo seguro para o Windows: parar os servidores, `cmd /c rmdir /s /q` na `node_modules` (remove o atalho sem segui-lo) antes do `git worktree remove`, conferir que a pasta sumiu e nunca usar `git -C "$WT"` depois da remoção. A spec de orquestração aponta para a ADR-0001 e a ADR-0004. O `lerPorta` perdeu o `export` (nada o importava). Validador, hooks (465), lint, testes unitários e e2e (porta 5174: 361 passaram, 21 pulados) verdes no worktree.
Arquivos alterados: .claude/skills/orquestrar-tarefa/SKILL.md; .claude/commands/nova-tarefa.md; docs/02-arquitetura/specs/2026-10-09-orquestracao-agentes-design.md; e2e/playwright.config.ts
Pendências:
1. O `rmdir /s /q` sobre junctions não foi testado de verdade (o hook bloqueia `cmd` para subagentes); confirmar na primeira limpeza real de um worktree com `node_modules` (pode ser a desta tarefa).
2. O e2e terminou com 21 pulados; não conferido se já eram pulados antes (nenhum teste foi alterado).
Decisão pendente: nenhuma
Conceitos para estudo: git worktree (criar em `main` e trocar para uma branch nova depois); junctions do npm workspaces no Windows e por que `rmdir /s` não os segue; como o git sobe as pastas procurando o repositório (o risco do `git -C` numa pasta sem `.git`); conflito de rebase em linhas próximas de um arquivo

## Log

- 2026-10-27 — tarefa criada
- 2026-10-28 — orquestrador: em-andamento — em paralelo com a T-039; worktree .claude/worktrees/T-037, branch feat/T-037-ajustes-tarefas-em-paralelo, porta do e2e 5174; devops chamado
- 2026-10-28 — devops: CONCLUIDO — fluxo paralelo ajustado (backlog antes do worktree, limpeza no Windows, spec, lerPorta)
- 2026-10-28 — orquestrador: em-revisao — code-reviewer chamado (no worktree)
- 2026-10-28 — code-reviewer: APROVADO — 4 critérios atendidos, dentro da área
- 2026-10-28 — orquestrador: em-qa — qa chamado (no worktree)
