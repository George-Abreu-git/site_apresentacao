---
id: T-002
titulo: QA revisa todos os arquivos atuais antes da ADR de stack
status: em-andamento
modo: agente-faz
tags: [qa]
rodadas: 0
criada: 2026-10-09
---

# T-002 — QA revisa todos os arquivos atuais antes da ADR de stack

## Descrição

Antes de registrar a ADR de stack, o QA revisa todos os arquivos atuais do projeto (agentes, skills, comandos, docs, templates e scripts) para encontrar inconsistências, lacunas e contradições entre eles.
O objetivo é chegar à ADR com a base de orquestração e documentação coerente.

## Critérios de aceite

- [ ] O QA percorre todos os arquivos atuais do repositório (`.claude/`, `docs/`, `scripts/`, `AGENTS.md`, `CLAUDE.md`)
- [ ] Inconsistências e lacunas encontradas são listadas no handoff, com arquivo e severidade
- [ ] `python3 scripts/validar_estrutura.py` roda e o resultado é reportado
- [ ] Nada é alterado fora da área do QA; correções ficam como achados para o George decidir

## Contexto relevante

- [[docs/03-tarefas/T-001-hooks-restricao-escrita|T-001]] depende da ADR de stack, que vem depois desta revisão.

## Decisões

- 2026-10-09 — George escolheu a opção C: fluxo reduzido, sem implementador nem code-reviewer. O QA revisa e entrega os achados no handoff; o instrutor fecha com a nota de estudo. As tags passaram de `infra, release` para `qa`, porque a tarefa é uma revisão e não implementação de infra.

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-09 — tarefa criada
- 2026-10-09 — orquestrador: início — decisão do George (opção C), tags `qa`, fluxo reduzido (QA → instrutor)
