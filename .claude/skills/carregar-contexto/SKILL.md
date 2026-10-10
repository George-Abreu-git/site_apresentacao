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
| instrutor | Modo mentor (`eu-faco`): seções Dev/Revisão/QA/Estudo da tarefa (handoffs e guias anteriores). Consolidação (`/estudar-consolidar`): os diários `docs/04-estudos/tarefas/T-*.md` com `consolidado: false` e as notas por conceito existentes com os mesmos nomes dos `conceitos` desses diários |
| documentador | A nota da tarefa (todas as seções, inclusive os handoffs) e os arquivos citados nela, dentro do seu worktree. Se ajudar, notas de `docs/04-estudos/` buscadas de forma pontual (ex.: a nota por conceito com o mesmo nome de um conceito do diário). O `AGENTS.md` já chega no contexto inicial do subagente; não precisa lê-lo de novo |
| devops | ADRs de stack e infra; arquivos de CI/infra existentes; em tarefas `orquestracao`, os arquivos de plataforma citados na tarefa (`.claude/**`, `scripts/**`, `AGENTS.md`) e a spec da orquestração |

## Regras

- Não varra o repositório com buscas amplas. Se algo necessário não estiver listado, busque de forma pontual (Grep/Glob por nome) e cite no handoff o que precisou ler a mais.
- Se a nota da tarefa não existir ou estiver incompleta, pare e devolva `AGUARDANDO-DECISAO` explicando o que falta.
- **Exceção — pedido avulso (`/estudar`, `/estudar-consolidar`)**: não há tarefa. Leia `AGENTS.md` e as notas relacionadas em `docs/04-estudos/` (na consolidação, o que a linha do instrutor indica); use `avulso` como id.
