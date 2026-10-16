---
id: T-016
titulo: Pente-fino de testes unitários, de regressão e de ponta a ponta
status: backlog
modo: agente-faz
tags: [qa, front-end, back-end, api]
rodadas: 0
criada: 2026-10-15
---

# T-016 — Pente-fino de testes unitários, de regressão e de ponta a ponta

## Descrição

Pente-fino de testes sobre tudo o que já foi entregue (T-007 a T-012), com **5 cenários por funcionalidade** em cada nível: unitário (dev, junto do código), rota da API (qa, `apps/api/test/`) e ponta a ponta/regressão (qa, `e2e/`). O objetivo é achar bugs e erros; **esta tarefa não corrige código de produção**: cada bug ou erro encontrado vira uma tarefa nova no backlog (criada pelo orquestrador a partir dos handoffs).

Funcionalidades (requisitos já implementados):

| # | Funcionalidade | Requisitos |
|---|---|---|
| 1 | Navegação por seções e menu (celular e desktop) | RF-01 |
| 2 | Início | RF-02 |
| 3 | Sobre | RF-03 |
| 4 | Stacks | RF-04 |
| 5 | Cards de projetos no front (sucesso, carregamento, falha) | RF-05, RNF-03 |
| 6 | API `GET /api/projetos` e arquivo curado | RF-06 parte 1 |
| 7 | Dados vivos do GitHub, cache e fallback | RF-06 parte 2, RNF-05 |
| 8 | Serviços | RF-07 |
| 9 | Contato | RF-08 |
| 10 | Textos no arquivo de conteúdo | RF-09 |
| 11 | Responsividade | RNF-01 |
| 12 | Acessibilidade | RNF-02 |
| 13 | Tema | RNF-04 |
| 14 | API de saúde (`GET /api/health`) e configuração por ambiente | — |

## Critérios de aceite

- [ ] Unitários (dev): para cada funcionalidade com código testável em unidade, pelo menos 5 cenários (caminho feliz, bordas e erros), novos ou já existentes, listados por funcionalidade no handoff
- [ ] Rota da API (qa): pelo menos 5 cenários para cada funcionalidade de API (6, 7 e 14)
- [ ] Ponta a ponta e regressão (qa): pelo menos 5 cenários por funcionalidade de interface (1 a 5 e 8 a 13), incluindo regressão do que as tarefas anteriores entregaram
- [ ] Nenhum código de produção alterado; teste que expõe um bug fica marcado como bug conhecido (`it.fails`/`it.todo` no Vitest, `test.fixme`/`test.fail` no Playwright), com comentário descrevendo o bug, para a suíte continuar verde
- [ ] Cada bug ou erro encontrado listado no handoff com funcionalidade, passos para reproduzir, esperado × obtido e severidade; o orquestrador cria uma tarefa por bug
- [ ] Suíte inteira verde (`npm test`, `npm run test:e2e`) e validador verde

## Contexto relevante

- Pedido do George em 2026-10-15
- [[docs/01-requisitos/requisitos|Requisitos]]
- Tarefas cobertas: T-007, T-008, T-009, T-010, T-011, T-012

## Decisões

- 2026-10-15 — George: pente-fino de testes ponta a ponta, regressão e unitários com 5 cenários por funcionalidade; bugs e erros encontrados viram tarefas. Modo `agente-faz` (todas as tarefas restantes seguem nesse modo).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-15 — tarefa criada
