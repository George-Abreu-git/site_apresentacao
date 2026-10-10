---
id: T-011
titulo: API: módulo github com cache e fallback
status: backlog
modo: eu-faco
tags: [back-end, api]
rodadas: 0
criada: 2026-10-10
---

# T-011 — API: módulo github com cache e fallback

## Descrição

Integra a API do GitHub para completar os projetos com dados vivos. Modo `eu-faco`: integração com API externa é foco de aprendizado.

## Critérios de aceite

- [ ] RF-06 (parte 2): projetos com repositório recebem linguagem principal, estrelas e última atualização do GitHub
- [ ] Cache dos dados do GitHub por tempo configurável (variável de ambiente)
- [ ] GitHub indisponível ou limite atingido → resposta com dados curados e indicação de que os dados vivos estão ausentes (sem erro)
- [ ] RNF-05: token só via variável de ambiente; nunca logado nem retornado
- [ ] Testes com o GitHub simulado (mock): sucesso, falha e cache

## Contexto relevante

- Depende de: T-010
- [[docs/01-requisitos/requisitos|Requisitos]]
- [[docs/03-tarefas/T-010-api-modulo-projetos|T-010]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-10 — tarefa criada
