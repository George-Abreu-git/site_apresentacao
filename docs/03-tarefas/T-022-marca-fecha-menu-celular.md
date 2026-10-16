---
id: T-022
titulo: Tocar na marca no celular fecha a lista do menu
status: backlog
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-16
---

# T-022 — Tocar na marca no celular fecha a lista do menu

## Descrição

BUG-Q1 da T-016, funcionalidade 1 (RF-01). No celular, com a lista do menu aberta, tocar na marca (nome no cabeçalho) leva ao Início mas a lista continua aberta (`aria-expanded="true"`) e cobre o começo da página.

Severidade: baixa.

## Critérios de aceite

- [ ] Tocar na marca com a lista aberta fecha a lista (`aria-expanded="false"`), como os links do menu
- [ ] O foco e a navegação por teclado continuam corretos
- [ ] O `test.fail` do BUG-Q1 em `e2e/testes/navegacao.spec.ts` vira teste normal e passa
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
