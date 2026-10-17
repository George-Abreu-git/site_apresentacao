---
id: T-030
titulo: Âncora não esconde o título atrás do cabeçalho alto
status: em-andamento
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-16
---

# T-030 — Âncora não esconde o título atrás do cabeçalho alto

## Descrição

Achado da T-029 (qa, rodada 1). O `scroll-padding-top` é fixo em `var(--altura-cabecalho)` (4rem = 128px a 200%) em `apps/web/src/index.css:12`, mas com o texto a 200% em 360px o cabeçalho quebra em 2+ linhas (249px com a DejaVu). Ao seguir um link do menu, o título da seção fica atrás do cabeçalho (título em y=225, cabeçalho até y=249). Teste marcado: `e2e/testes/texto-ampliado.spec.ts`, "360px a 200%: seguir um link do menu deixa o título da seção abaixo do cabeçalho" (`test.fail` com pré-condição e nome longo).

Severidade: média.

## Critérios de aceite

- [ ] Ao seguir um link do menu ou uma âncora, o título da seção fica inteiro abaixo do cabeçalho, qualquer que seja a altura real dele (tamanho normal e texto a 200%, 360px a 1440px)
- [ ] Navegação por Tab e Shift+Tab continua sem deixar o foco atrás do cabeçalho
- [ ] O `test.fail` do bug em `texto-ampliado.spec.ts` vira teste normal e passa nos dois ambientes (Windows e container Linux com a DejaVu Sans)
- [ ] 5 cenários de teste para a mudança, seguindo o padrão do George
- [ ] Suíte inteira e validador verdes

## Contexto relevante

- Origem: [[docs/03-tarefas/T-029-cabecalho-texto-ampliado|T-029]]
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
- 2026-10-17 — orquestrador: em-andamento — início no modo agente-faz; dev chamado
