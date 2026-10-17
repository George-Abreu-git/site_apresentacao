---
id: T-023
titulo: Abrir o site direto numa âncora rola até a seção
status: em-andamento
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-16
---

# T-023 — Abrir o site direto numa âncora rola até a seção

## Descrição

BUG-Q2 da T-016, funcionalidade 1 (RF-01); achado original da T-012. Numa visita nova, abrir `/#servicos` ou `/#contato` (link compartilhado) deixa a página no topo (`scrollY` 0): o navegador procura o fragmento antes de o React montar as seções.

Severidade: média.

## Critérios de aceite

- [ ] Abrir `/#<secao>` numa visita nova mostra a seção na tela, para todas as seções
- [ ] Funciona no servidor de desenvolvimento e no build de produção (`vite preview`)
- [ ] Os `test.fail` do BUG-Q2 em `e2e/testes/navegacao.spec.ts` viram testes normais e passam, e o teste antigo "abrir a página já numa âncora" deixa de depender do `goto('/')` do `beforeEach`
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
- 2026-10-16 — orquestrador: em-andamento — início no modo agente-faz; dev chamado
