---
id: T-015
titulo: Conteúdo real do site — LinkedIn, e-mail e textos revisados
status: backlog
modo: eu-faco
tags: [front-end, docs]
rodadas: 0
criada: 2026-10-15
---

# T-015 — Conteúdo real do site — LinkedIn, e-mail e textos revisados

## Descrição

Substitui o LinkedIn e o e-mail provisórios (`PREENCHER`) e revisa os textos sugeridos pelo dev na T-008 (título profissional, frase de apresentação, Sobre e Serviços) em `apps/web/src/conteudo/pt-BR.ts`. Deve ser concluída **antes da T-013 (deploy)**, para o site não ser publicado com conteúdo provisório. Modo `eu-faco`: o George edita o arquivo de conteúdo com o instrutor guiando.

## Critérios de aceite

- [ ] Nenhum `PREENCHER` no conteúdo: link do LinkedIn aponta para o perfil real do George e o `mailto:` usa o e-mail real (RF-03, RF-08)
- [ ] Título, frase de apresentação, Sobre e Serviços revisados e aprovados pelo George
- [ ] Teste unitário que falha se o conteúdo tiver `PREENCHER` ou `exemplo.com` (evita publicar provisório)
- [ ] e2e que dependam dos textos ou links alterados atualizados (qa)

## Contexto relevante

- Depende de: T-008
- Bloqueia: T-013 (deploy)
- [[docs/03-tarefas/T-008-conteudo-secoes-estaticas|T-008]]
- [[docs/01-requisitos/requisitos|Requisitos]]

## Decisões

- 2026-10-15 — George: tarefa criada a partir da decisão Q1 da T-008 (opção B — provisórios na T-008 e conteúdo real numa tarefa própria antes do deploy).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-15 — tarefa criada
