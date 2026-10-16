---
id: T-025
titulo: Texto longo nos cards de projeto não causa rolagem lateral
status: backlog
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-16
---

# T-025 — Texto longo nos cards de projeto não causa rolagem lateral

## Descrição

BUG-Q4 da T-016, funcionalidades 5 e 11 (RNF-01). Em 360px, uma palavra longa sem espaço no título ou um endereço longo na descrição de um projeto fazem a página rolar para o lado (conteúdo com ~546px e ~363px). Causa (corrigida pelo documentador no diário da T-016): em `apps/web/src/componentes/Projetos/Projetos.module.css`, a `.lista` só define `minmax(0, 1fr)` a partir de 36rem; abaixo disso não define colunas, e a coluna implícita (`auto`) cresce até caber a palavra longa. Também estoura com o texto a 200%.

Severidade: média.

## Critérios de aceite

- [ ] Título e descrição longos quebram dentro do card em 360px, sem rolagem lateral
- [ ] Sem rolagem lateral com o texto a 200%
- [ ] Os `test.fail` do BUG-Q4 em `e2e/testes/projetos.spec.ts` viram testes normais e passam
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
