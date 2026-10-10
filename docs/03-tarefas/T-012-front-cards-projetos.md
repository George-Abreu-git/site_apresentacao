---
id: T-012
titulo: Front: cards de projetos consumindo a API
status: backlog
modo: eu-faco
tags: [front-end, api]
rodadas: 0
criada: 2026-10-10
---

# T-012 — Front: cards de projetos consumindo a API

## Descrição

A seção Projetos busca `GET /api/projetos` e mostra os cards. Modo `eu-faco`: integração front ↔ API é o centro do aprendizado.

## Critérios de aceite

- [ ] RF-05: cards com título, descrição, stacks, links e dados vivos quando presentes
- [ ] RNF-03: estado de carregamento enquanto a API responde (inclusive partida a frio de ~1 min); o resto da página não espera
- [ ] Falha da API → mensagem amigável, sem quebrar a página
- [ ] URL da API configurável por variável de ambiente do Vite
- [ ] Testes unitários com a API simulada e e2e com sucesso, carregamento e falha

## Contexto relevante

- Depende de: T-011, T-007
- [[docs/01-requisitos/requisitos|Requisitos]]
- [[docs/03-tarefas/T-011-api-modulo-github|T-011]]
- [[docs/03-tarefas/T-007-layout-base|T-007]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-10 — tarefa criada
