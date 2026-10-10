---
name: carregar-contexto
description: Use no início de qualquer trabalho de um agente para saber exatamente quais arquivos ler conforme o seu papel, sem ler o repositório inteiro.
---

# Carregar contexto

Leia **somente** o que o seu papel precisa. Contexto enxuto = respostas melhores e mais baratas.

## Sempre

1. `AGENTS.md`
2. A nota da tarefa indicada pelo orquestrador (`docs/03-tarefas/T-XXX-<slug>.md`)

## Por papel

| Papel | Leia também |
|---|---|
| dev | ADRs em `docs/02-arquitetura/ADR-*.md` citadas na tarefa ou relacionadas à stack; arquivos citados em "Contexto relevante"; testes existentes da área afetada |
| code-reviewer | `git diff main...HEAD` e `git log main..HEAD --oneline`; skill `definition-of-done`; handoff do dev na tarefa |
| qa | "Critérios de aceite" da tarefa; `git diff main...HEAD`; requisitos `RF/RNF` citados; testes existentes |
| instrutor | Seções Dev/Revisão/QA da tarefa (handoffs); notas existentes em `docs/04-estudos/` sobre os conceitos citados |
| devops | ADRs de stack e infra; arquivos de CI/infra existentes |

## Regras

- Não varra o repositório com buscas amplas. Se algo necessário não estiver listado, busque de forma pontual (Grep/Glob por nome) e cite no handoff o que precisou ler a mais.
- Se a nota da tarefa não existir ou estiver incompleta, pare e devolva `AGUARDANDO-DECISAO` explicando o que falta.
