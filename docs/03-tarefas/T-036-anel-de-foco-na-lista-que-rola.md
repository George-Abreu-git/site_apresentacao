---
id: T-036
titulo: Anel de foco do último link não fica cortado na lista do menu que rola
status: backlog
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-27
---

# T-036 — Anel de foco do último link não fica cortado na lista do menu que rola

## Descrição

Achado do qa na T-024 (acessibilidade, WCAG 2.4.7). Em 568x320, com a lista do menu aberta e rolando por dentro (correção da T-024), o Tab até "Contato" faz a lista rolar só até a caixa do link, e não até o anel de foco, que fica 6px para fora dela (3px de contorno + 3px de afastamento). Os 6px de baixo do anel ficam cortados; o foco continua visível nos outros três lados. Não é regressão: antes da T-024 esse link nem era alcançável.

Reproduzir: janela de 568x320, foco no botão Menu, Enter e Tab 6 vezes.

Correção sugerida pelo qa: `scroll-padding-block` (ex.: 0.5rem) na `.aberta` de `Menu.module.css`.

Severidade: baixa.

## Critérios de aceite

- [ ] Em 568x320, pelo teclado, o anel de foco de cada link da lista aberta (inclusive o último) aparece inteiro, sem corte embaixo nem em cima.
- [ ] O `test.fail` "568x320: pelo teclado, o anel de foco do último link não fica cortado embaixo" (`e2e/testes/navegacao.spec.ts`) vira teste normal e passa.
- [ ] Nada muda em 640x360, 360x800 e no desktop (testes da T-024 continuam verdes).
- [ ] 5 cenários de teste para a mudança (unitário, rota e/ou e2e, conforme a área), seguindo o padrão do George.
- [ ] Suíte inteira e validador verdes.

## Contexto relevante

- Origem: [[docs/03-tarefas/T-024-menu-celular-deitado|T-024]] (QA, pendência 1)
- `apps/web/src/componentes/Menu/Menu.module.css`

## Decisões

- 2026-10-27 — George: o bug do anel de foco vira tarefa nova, em vez de ser corrigido dentro da T-024 (Q2, opção B).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-27 — tarefa criada
