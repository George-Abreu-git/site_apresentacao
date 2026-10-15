---
id: T-010
titulo: API: módulo projetos lendo o arquivo curado
status: em-andamento
modo: agente-faz
tags: [back-end, api]
rodadas: 0
criada: 2026-10-10
---

# T-010 — API: módulo projetos lendo o arquivo curado

## Descrição

Primeiro módulo NestJS de domínio: lê o arquivo curado de projetos e expõe `GET /api/projetos`. Modo `agente-faz` para servir de exemplo de módulo, controller e service.

## Critérios de aceite

- [ ] RF-06 (parte 1): `GET /api/projetos` responde JSON com todos os projetos do arquivo curado, na ordem definida, no formato do tipo `Projeto` de `packages/shared`
- [ ] Arquivo curado com o formato documentado (título, descrição, stacks, links, imagem, repositório opcional) e ao menos 2 projetos de exemplo
- [ ] Arquivo curado inválido gera erro claro na inicialização (não em tempo de requisição)
- [ ] Testes unitários do service (dev) e de rota com Supertest (qa)

## Contexto relevante

- Depende de: T-005
- [[docs/01-requisitos/requisitos|Requisitos]]
- [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]]
- [[docs/03-tarefas/T-005-monorepo-base|T-005]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-10 — tarefa criada
- 2026-10-15 — orquestrador: em-andamento — início no modo agente-faz; dev chamado
