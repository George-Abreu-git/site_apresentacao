---
name: atualizar-tarefa
description: Use ao terminar o trabalho de um agente (para montar o bloco de Handoff) e, pelo orquestrador, para transcrever handoffs, atualizar status, rodadas, log e backlog da tarefa.
---

# Atualizar tarefa

A nota da tarefa é o **estado** do fluxo. Só o orquestrador escreve nela; os agentes devolvem um bloco de Handoff.

## Parte 1 — Contrato do Handoff (todos os agentes)

Termine **sempre** sua resposta com exatamente este bloco:

```
## Handoff — <agente> — <T-XXX>
Resultado: CONCLUIDO | APROVADO | AJUSTES | PASSOU | FALHOU | AGUARDANDO-DECISAO
Resumo: <2-5 linhas do que foi feito/encontrado>
Arquivos alterados: <lista de caminhos ou "nenhum">
Pendências: <lista numerada ou "nenhuma">
Decisão pendente: <bloco no formato apresentar-decisao ou "nenhuma">
Conceitos para estudo: <lista curta de conceitos que apareceram>
Mensagem de commit sugerida: <commit convencional ou "nenhuma">
```

Resultados por agente: dev → `CONCLUIDO`; code-reviewer → `APROVADO`/`AJUSTES`; qa → `PASSOU`/`FALHOU`; instrutor e devops → `CONCLUIDO`. Qualquer um pode devolver `AGUARDANDO-DECISAO`.

## Parte 2 — Regras do orquestrador

1. Copie o conteúdo do handoff para a seção do papel (`## Dev`, `## Revisão`, `## QA`, `## Estudo`, `## DevOps`), mantendo o histórico de rodadas (`### Rodada N`).
2. Atualize `status` no frontmatter:

| Momento | status |
|---|---|
| Início do fluxo / dev trabalhando | `em-andamento` |
| Antes do code-reviewer | `em-revisao` |
| Antes do qa | `em-qa` |
| Handoff com `AGUARDANDO-DECISAO` | `aguardando-decisao` |
| Limite de rodadas estourado | `bloqueada` |
| Fluxo encerrado | `concluida` |

3. Em `AJUSTES` ou `FALHOU`, incremente `rodadas`. Se `rodadas` passar de 3, status `bloqueada` e apresente a decisão ao George (`apresentar-decisao`).
4. Decisões tomadas pelo George vão para `## Decisões` (ou viram ADR com `registrar-decisao`, com link).
5. Adicione uma linha em `## Log`: `- AAAA-MM-DD — <agente>: <resultado> — <resumo de 1 linha>`.
6. Atualize a linha da tarefa em `docs/03-tarefas/backlog.md` (status).
7. Commite (skill `commit-convencional`) usando a mensagem sugerida, quando houver.
