---
id: T-022
titulo: Tocar na marca no celular fecha a lista do menu
status: em-revisao
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

### Rodada 1

Resultado: CONCLUIDO
Resumo: Passei o estado da lista do menu do `Menu` para o `Cabecalho`, e o `Menu` virou um componente controlado (props `aberto`, `aoAlternar`, `aoFechar`). Assim a marca, que fica fora do menu, também fecha a lista ao ser tocada (`onClick={fecharMenu}`). Os 5 cenários novos estão em `Cabecalho.test.tsx` (4 falhavam antes da correção). Os testes do `Menu` passaram a usar o invólucro `MenuComEstado`. Suíte, lint, build e validador verdes.
Arquivos alterados: apps/web/src/componentes/Cabecalho/Cabecalho.tsx; apps/web/src/componentes/Cabecalho/Cabecalho.test.tsx; apps/web/src/componentes/Menu/Menu.tsx; apps/web/src/componentes/Menu/Menu.test.tsx
Pendências:
1. (qa) O `test.fail` do BUG-Q1 em `e2e/testes/navegacao.spec.ts:408` agora passa ("Expected to fail, but passed"). Ele precisa virar teste normal (critério de aceite 3, área do qa).
Decisão pendente: nenhuma
Conceitos para estudo: componente controlado x não controlado (React); elevar o estado (lifting state up); props de callback (`aoAlternar`/`aoFechar`); invólucro de teste com estado (wrapper); `aria-expanded`; `test.fail` do Playwright e "passou inesperadamente"

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-27 — orquestrador: em-andamento — branch feat/T-022-marca-fecha-menu-celular; dev chamado
- 2026-10-27 — dev: CONCLUIDO — estado do menu elevado ao Cabecalho; a marca fecha a lista; test.fail do e2e fica para o qa
- 2026-10-27 — orquestrador: em-revisao — code-reviewer chamado
