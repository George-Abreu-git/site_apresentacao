---
id: T-028
titulo: Etiquetas de tecnologia com nome longo não causam rolagem lateral
status: backlog
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-16
---

# T-028 — Etiquetas de tecnologia com nome longo não causam rolagem lateral

## Descrição

Achado do qa na T-025 (severidade média), funcionalidades 4 e 5 (RF-04, RF-05, RNF-01). Em 360px, um nome de tecnologia longo e sem espaço nas etiquetas faz a página rolar para o lado: `.stack` do card de projeto (conteúdo com 379px) e `.tecnologia` da seção Stacks (404px). Causa: cada etiqueta é um item flex com `min-width: auto`; o `overflow-wrap: break-word` não reduz essa largura mínima.

Severidade: média.

## Critérios de aceite

- [ ] Em 360px, nome de tecnologia longo e sem espaço quebra dentro da etiqueta, no card de projeto e na seção Stacks, sem rolagem lateral
- [ ] Sem rolagem lateral também com o texto a 200%
- [ ] Nada é cortado ou escondido (sem `overflow: hidden`, reticências ou `nowrap`)
- [ ] 5 cenários de teste para a mudança (unitário e e2e), seguindo o padrão do George, incluindo a prova no container Linux do CI (`mcr.microsoft.com/playwright:v1.64.0-noble`, `CI=true`)
- [ ] Suíte inteira e validador verdes

## Contexto relevante

- Origem: [[docs/03-tarefas/T-025-texto-longo-nos-cards|T-025]] (achado do qa)
- [[docs/03-tarefas/T-016-pente-fino-de-testes|T-016]]
- [[docs/01-requisitos/requisitos|Requisitos]]

## Decisões

- 2026-10-16 — George: bugs e erros encontrados viram tarefas, em modo `agente-faz` (pedido de 2026-10-15).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
