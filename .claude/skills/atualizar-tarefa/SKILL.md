---
name: atualizar-tarefa
description: Use ao terminar o trabalho de qualquer subagente — define o bloco de Handoff que ele devolve ao orquestrador.
---

# Atualizar tarefa

A nota da tarefa é o **estado** do fluxo. **Só o orquestrador escreve nela** (regras na skill `orquestrar-tarefa`). Você, subagente, nunca edita a nota: devolve este bloco.

## Contrato do Handoff

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

Em pedidos sem tarefa (ex.: `/estudar`), use `avulso` no lugar de `<T-XXX>`.
