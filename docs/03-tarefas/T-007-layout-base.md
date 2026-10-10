---
id: T-007
titulo: Layout base: menu com âncoras, tema escuro e responsividade
status: em-andamento
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-10
---

# T-007 — Layout base: menu com âncoras, tema escuro e responsividade

## Descrição

Estrutura visual da página única: as seis seções vazias, o menu de navegação e o tema escuro em variáveis de CSS. Modo `agente-faz` para servir de exemplo de referência.

## Critérios de aceite

- [ ] RF-01: seções Início, Sobre, Stacks, Projetos, Serviços e Contato com `id`; menu leva a cada uma; menu acessível ao rolar; no celular, menu compacto que abre a lista
- [ ] RNF-04: todas as cores em variáveis de CSS do tema escuro; nenhuma cor fixa nos componentes
- [ ] RNF-01: sem rolagem horizontal de 360px a 1280px+
- [ ] RNF-02: menu navegável por teclado com foco visível; HTML semântico (`header`, `nav`, `main`, `section`, `footer`)
- [ ] Testes unitários dos componentes (dev) e e2e de navegação por menu e teclado em celular e desktop (qa)

## Contexto relevante

- Depende de: T-005
- [[docs/01-requisitos/requisitos|Requisitos]]
- [[docs/03-tarefas/T-005-monorepo-base|T-005]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).
- 2026-10-10 — George delegou ao orquestrador as decisões das tarefas T-005, T-006, T-001 e T-007 (ver T-005). Decisões abaixo marcadas "decidido pelo orquestrador (delegação)", com as opções documentadas, para revisão do George.

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-10 — tarefa criada
- 2026-10-10 — orquestrador: início — implementador dev (tag `front-end`); e2e com o qa
