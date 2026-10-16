---
id: T-019
titulo: Data inválida do GitHub não derruba o card de projeto
status: backlog
modo: agente-faz
tags: [front-end, back-end, api]
rodadas: 0
criada: 2026-10-16
---

# T-019 — Data inválida do GitHub não derruba o card de projeto

## Descrição

BUG-2 da T-016, funcionalidades 5 e 7. A API aceita qualquer texto em `pushed_at` e repassa em `ultimaAtualizacao`; no front, `Intl.DateTimeFormat.format` lança `RangeError: Invalid time value` e a página inteira some.

Severidade: baixa.

## Critérios de aceite

- [ ] A API trata `pushed_at` que não é data válida como formato inesperado (`disponivel: false`)
- [ ] O card não quebra com data inválida (mostra o card sem a data)
- [ ] Os `it.fails` do BUG-2 (`github-cliente.spec.ts` e `CartaoDeProjeto.test.tsx`) viram testes normais e passam
- [ ] 5 cenários de teste para a mudança (unitário, rota e/ou e2e, conforme a área), seguindo o padrão do George
- [ ] Suíte inteira e validador verdes

## Contexto relevante

- Origem: [[docs/03-tarefas/T-016-pente-fino-de-testes|T-016]] (pente-fino de testes)
- [[docs/01-requisitos/requisitos|Requisitos]]

## Decisões

- 2026-10-16 — George: bugs e erros do pente-fino viram tarefas, em modo `agente-faz` (pedido de 2026-10-15).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
