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

Resultados por agente: dev (e as réplicas dev-2 e dev-3) → `CONCLUIDO`; code-reviewer → `APROVADO`/`AJUSTES`; qa → `PASSOU`/`FALHOU`; instrutor e devops → `CONCLUIDO`; documentador → `CONCLUIDO`/`FALHOU` (não conseguiu escrever o diário ou consolidar). Qualquer um pode devolver `AGUARDANDO-DECISAO`, exceto o documentador: ele roda em segundo plano (depois do encerramento ou no `/estudar-consolidar`) e registra dúvidas em "Pendências".

Em pedidos sem tarefa (ex.: `/estudar`, `/estudar-consolidar`), use `avulso` no lugar de `<T-XXX>`.
