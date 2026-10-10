---
id: T-013
titulo: Deploy da v1: Cloudflare Pages, Render, CORS e SEO básico
status: backlog
modo: agente-faz
tags: [release]
rodadas: 0
criada: 2026-10-10
---

# T-013 — Deploy da v1: Cloudflare Pages, Render, CORS e SEO básico

## Descrição

Publica a v1 conforme a ADR-0001.

## Critérios de aceite

- [ ] RNF-08: front no Cloudflare Pages e API no Render (plano gratuito), com deploy a partir do repositório
- [ ] RNF-05: CORS da API restrito à origem do front publicado; `GITHUB_TOKEN` e `CORS_ORIGIN` configurados como variáveis no Render
- [ ] RNF-07: título, meta descrição e Open Graph (com imagem) no `index.html`
- [ ] RNF-06: o site não grava cookies
- [ ] Checklist de deploy e rollback na nota da tarefa
- [ ] Site e API acessíveis por link público; e2e básico rodando contra a URL publicada

## Contexto relevante

- Depende de: T-012, T-006
- [[docs/01-requisitos/requisitos|Requisitos]]
- [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]]
- [[docs/03-tarefas/T-012-front-cards-projetos|T-012]]
- [[docs/03-tarefas/T-006-ci-github-actions|T-006]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-10 — tarefa criada
