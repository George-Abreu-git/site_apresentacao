---
id: T-038
titulo: Link do menu leva até a seção mesmo quando a rolagem suave é interrompida
status: backlog
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-27
---

# T-038 — Link do menu leva até a seção mesmo quando a rolagem suave é interrompida

## Descrição

Achado do qa na T-033 (navegação, RF-01). No Chromium, com a rolagem suave ligada, voltar pelas seções com Shift+Tab até o menu e dar Enter num link às vezes faz a rolagem parar no meio do caminho: ela anda uns 460px, desacelera longe do destino e a seção não aparece. Acontece também quando a âncora é seguida pelo próprio navegador, sem o código da T-033 (4 de 12 vezes nesse caminho; 4 de 10 vindo de uma visita nova).

Reproduzir (desktop): abrir `/#contato` (ou `/` e depois `/#contato`), Shift+Tab até o link Contato do menu, Shift+Tab 4 vezes até Sobre, Enter. Esperado: a página para com o título de Sobre na tela (`scrollY` ≈ 836). Obtido, em parte das vezes: `scrollY` entre 1119 e 2241.

Relacionada: [[docs/03-tarefas/T-031-rolagem-suave-em-testes-instaveis|T-031]] trata da instabilidade dos testes com a rolagem suave; esta trata do comportamento do site.

Severidade: baixa.

## Critérios de aceite

- [ ] Com a rolagem suave ligada, Enter num link do menu depois de voltar pelas seções com Shift+Tab sempre termina com o título da seção na tela (sem parar no meio), no celular e no desktop.
- [ ] Clique e Enter nos links do menu, a marca, as âncoras na primeira visita (T-023/T-033) e o movimento reduzido continuam funcionando como hoje.
- [ ] O caminho do achado não falha em `--repeat-each=10` no Chromium.
- [ ] 5 cenários de teste para a mudança (unitário e/ou e2e, conforme a área), seguindo o padrão do George.
- [ ] Suíte inteira e validador verdes.

## Contexto relevante

- Origem: [[docs/03-tarefas/T-033-foco-apos-ancora-inicial|T-033]] (QA, pendência 2)
- [[docs/03-tarefas/T-031-rolagem-suave-em-testes-instaveis|T-031]]
- [[docs/01-requisitos/requisitos|Requisitos]]

## Decisões

- 2026-10-27 — George: o achado da rolagem suave vira tarefa nova de front-end, separada da T-031 (Q5 da T-033, opção B).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-27 — tarefa criada
