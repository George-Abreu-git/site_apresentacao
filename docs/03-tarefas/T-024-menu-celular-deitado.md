---
id: T-024
titulo: Lista do menu cabe ou rola no celular deitado com pouca altura
status: em-qa
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-16
---

# T-024 — Lista do menu cabe ou rola no celular deitado com pouca altura

## Descrição

BUG-Q3 da T-016, funcionalidades 1 e 11 (RNF-01). Em 568x320, a lista aberta do menu passa da tela (o link "Contato" fica ~17% visível) e não dá para rolar, porque a lista é `absolute` dentro do cabeçalho `sticky`.

Severidade: média (ampliada na T-029: também afeta o celular em pé com o texto a 200%).

## Critérios de aceite

- [ ] Em 568x320 todos os links da lista aberta ficam visíveis ou a lista rola por dentro
- [ ] Nada muda em 640x360 e nas larguras já testadas
- [ ] Também com o celular em pé e o texto a 200% (achado da T-029): em 360x800 a lista aberta vai até y=840 e "Contato" fica fora da janela; o `test.fail` "360x800 a 200%, com um nome longo na marca: a lista aberta cabe na tela ou rola por dentro" (`e2e/testes/texto-ampliado.spec.ts`) vira teste normal e passa
- [ ] O `test.fail` do BUG-Q3 em `e2e/testes/navegacao.spec.ts` vira teste normal e passa
- [ ] 5 cenários de teste para a mudança (unitário, rota e/ou e2e, conforme a área), seguindo o padrão do George
- [ ] Suíte inteira e validador verdes

## Contexto relevante

- Origem: [[docs/03-tarefas/T-016-pente-fino-de-testes|T-016]] (pente-fino de testes)
- [[docs/01-requisitos/requisitos|Requisitos]]

## Decisões

- 2026-10-16 — George: bugs e erros do pente-fino viram tarefas, em modo `agente-faz` (pedido de 2026-10-15).
- 2026-10-27 — George (Q2, bug do anel de foco achado pelo qa): opção B — fechar a T-024 e abrir tarefa nova (T-036) para o anel de foco do último link cortado embaixo em 568x320.

## Dev

### Rodada 1

Resultado: CONCLUIDO
Resumo: Bug corrigido só no CSS. A lista aberta do menu no celular agora tem `max-height: calc(100dvh - var(--altura-real-do-cabecalho) + 1px)`, `overflow-y: auto` e `overscroll-behavior: contain`, e a linha de baixo virou `box-shadow` em vez de `border-bottom`. Isso foi preciso para não cortar o último link em 640x360, onde ele termina exatamente em y=360. No desktop (48rem) tudo volta como antes. Medido no Chromium: em 640x360 e em 360x800 os links ficam nas mesmas posições; em 568x320 a lista vai até y=320 e rola por dentro. 5 testes unitários novos (TDD: falharam e depois passaram). Unitários, hooks, lint, build e validador verdes. No e2e, 349 passaram e só os 3 `test.fail` do bug "falham" com "Expected to fail, but passed".
Arquivos alterados: apps/web/src/componentes/Menu/Menu.module.css; apps/web/src/componentes/Menu/Menu.test.tsx
Pendências:
1. (qa) Transformar em teste normal os 3 `test.fail` que agora passam: `e2e/testes/navegacao.spec.ts:563` (568x320, projeto celular) e `e2e/testes/texto-ampliado.spec.ts:504` (360x800 a 200%, projetos celular e desktop). Sem isso a suíte e2e fica vermelha ("Expected to fail, but passed"); os critérios 3 e 4 dependem disso.
2. (qa) Se quiser, completar os cenários e2e do critério 5. Do lado do dev já são 5 testes unitários.
Decisão pendente: nenhuma
Conceitos para estudo: position absolute dentro de sticky (bloco de contenção), max-height com calc() e variável de CSS, unidade dvh, overflow-y: auto (rolagem interna), overscroll-behavior, borda vs. box-shadow, top: 100% medido a partir da borda interna (padding box), testes de CSS lido como texto (?raw)

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: Correção só no CSS do Menu (max-height com calc(100dvh - --altura-real-do-cabecalho + 1px), overflow-y: auto, overscroll-behavior: contain, borda de baixo trocada por box-shadow), desfeita no bloco de 48rem. A variável tem valor padrão no tema.css, então o calc nunca fica inválido. 5 testes unitários novos, no padrão `?raw` que o projeto já usa. Unitários (194 ok + 1 it.fails antigo de Projetos), lint e validador verdes. O dev ficou na sua área (apps/web/**).
Arquivos alterados: nenhum
Pendências:
1. (qa) Transformar em testes normais os 3 `test.fail` que agora passam: `e2e/testes/navegacao.spec.ts:563` e `e2e/testes/texto-ampliado.spec.ts:504` (celular e desktop). Os critérios 3, 4 e 6 dependem disso.
2. (opcional, qa) Conferir no e2e que o anel de foco dos links não fica cortado dentro da lista que rola (o overflow-y: auto também faz o overflow-x virar auto).
Decisão pendente: nenhuma
Conceitos para estudo: bloco de contenção de absolute dentro de sticky, max-height com calc() e variável de CSS com valor padrão, unidade dvh, overflow-y: auto e efeito no overflow-x, overscroll-behavior, borda vs. box-shadow em caixa que rola, limites de testar CSS como texto no jsdom

## QA

### Rodada 1

Resultado: PASSOU
Resumo: Os 3 `test.fail` do bug (navegacao.spec.ts 568x320 no projeto celular; texto-ampliado.spec.ts 360x800 a 200% nos projetos celular e desktop) viraram testes normais e passam. Adicionei 5 cenários e2e normais (rolagem interna em 568x320 sem rolar a página, teclado com anel de foco sem corte dos lados, regressões em 640x360, 360x800 e desktop 1280x320) e 1 `test.fail` que registra um bug novo de severidade baixa. Suíte verde: e2e com 358 passaram e 18 pulados; unitários, API, hooks, lint e validador verdes.
Arquivos alterados: e2e/testes/navegacao.spec.ts; e2e/testes/texto-ampliado.spec.ts
Pendências:
1. (George decide) Bug baixo: em 568x320, o Tab até "Contato" deixa os 6px de baixo do anel de foco cortados pela lista que rola, porque o navegador rola até a caixa do link e não até o anel. Registrado em `test.fail` em navegacao.spec.ts. Correção sugerida: `scroll-padding-block` na `.aberta`, feita pelo dev agora ou numa tarefa nova.
2. (só registro) Em 640x360 a lista agora tem 16px de rolagem interna, só o padding de baixo. Os links não mudam de lugar.
Decisão pendente: nenhuma
Conceitos para estudo: contêiner de rolagem e scrollHeight vs clientHeight, rolagem até o foco (scroll into view) que ignora outline e outline-offset, scroll-padding, overscroll-behavior, test.fail como registro de bug conhecido, medir layout com getBoundingClientRect no Playwright

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-27 — orquestrador: em-andamento — branch feat/T-024-menu-celular-deitado; dev chamado
- 2026-10-27 — dev: CONCLUIDO — lista aberta com max-height e rolagem interna; 3 test.fail do e2e passam e ficam para o qa
- 2026-10-27 — orquestrador: em-revisao — code-reviewer chamado
- 2026-10-27 — code-reviewer: APROVADO — correção só no CSS, dentro da área; test.fail do e2e ficam para o qa
- 2026-10-27 — orquestrador: em-qa — qa chamado
- 2026-10-27 — qa: PASSOU — 3 test.fail viraram testes normais; 5 cenários e2e novos; bug baixo novo (anel de foco do último link cortado embaixo) registrado em test.fail
- 2026-10-27 — orquestrador: aguardando-decisao — George decide se o bug do anel de foco é corrigido agora ou vira tarefa nova
- 2026-10-27 — George: Q2 — B, o bug vira a T-036; a T-024 segue para o encerramento
