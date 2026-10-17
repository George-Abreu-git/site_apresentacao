---
id: T-028
titulo: Etiquetas de tecnologia com nome longo não causam rolagem lateral
status: concluida
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-16
---

# T-028 — Etiquetas de tecnologia com nome longo não causam rolagem lateral

## Descrição

Achado do qa na T-025 (severidade média), funcionalidades 4 e 5 (RF-04, RF-05, RNF-01). Em 360px, um nome de tecnologia longo e sem espaço nas etiquetas faz a página rolar para o lado: `.stack` do card de projeto (conteúdo com 379px) e `.tecnologia` da seção Stacks (404px). Causa: cada etiqueta é um item flex com `min-width: auto`; o `overflow-wrap: break-word` não reduz essa largura mínima.

Severidade: média.

## Critérios de aceite

- [x] Em 360px, nome de tecnologia longo e sem espaço quebra dentro da etiqueta, no card de projeto e na seção Stacks, sem rolagem lateral
- [x] Sem rolagem lateral também com o texto a 200%
- [x] Nada é cortado ou escondido (sem `overflow: hidden`, reticências ou `nowrap`)
- [x] 5 cenários de teste para a mudança (unitário e e2e), seguindo o padrão do George, incluindo a prova no container Linux do CI (`mcr.microsoft.com/playwright:v1.64.0-noble`, `CI=true`)
- [x] Suíte inteira e validador verdes

## Contexto relevante

- Origem: [[docs/03-tarefas/T-025-texto-longo-nos-cards|T-025]] (achado do qa)
- [[docs/03-tarefas/T-016-pente-fino-de-testes|T-016]]
- [[docs/01-requisitos/requisitos|Requisitos]]

## Decisões

- 2026-10-16 — George: bugs e erros encontrados viram tarefas, em modo `agente-faz` (pedido de 2026-10-15).

## Dev

### Rodada 1

Resultado: CONCLUIDO
Resumo: Etiquetas de tecnologia (`.stack` em `CartaoDeProjeto.module.css` e `.tecnologia` em `Stacks.module.css`) ganharam `overflow-wrap: anywhere`: a largura mínima do item flex (`min-width: auto`) deixa de ser a palavra inteira e o nome longo quebra dentro da etiqueta, também a 200% (mesma solução dos links-botão da T-029). Nada cortado ou escondido. 5 cenários unitários em `responsividade.test.ts` (3 vermelhos antes): `.stack` e `.tecnologia` com `anywhere`; toda etiqueta em pílula (`border-radius: 999px`) com `anywhere`; listas mantêm `flex-wrap: wrap`; nada da seção Stacks cortado. Título de um teste da T-029 ajustado ("fica só nos links-botão e nas etiquetas"). Container `t029-linux` (DejaVu, `CI=true`, `--workers=2`, `pt-BR.ts` do HEAD): diagnóstico fora do repositório reproduziu o bug (8/8 falhando, página com 420 a 897px) e confirmou a correção (8/8, 360px; etiquetas curtas não quebram quando cabem); suíte e2e 313 passaram, 12 pulados, 1 instável conhecido (T-031); unitários, lint, build e validador verdes.
Arquivos alterados:
- `apps/web/src/componentes/CartaoDeProjeto/CartaoDeProjeto.module.css`, `apps/web/src/componentes/Stacks/Stacks.module.css`
- `apps/web/src/responsividade.test.ts`
Pendências:
1. qa: e2e da tarefa (referência: `scratchpad/t029/diag028/t028-diag.spec.ts` com `rodar-t028.sh`).
2. Efeito visível (para o George): a 200% com a DejaVu, "TypeScript" e "Markdown" do card quebram no meio (etiqueta 188px × lista 182px); antes passavam ~6px por cima do padding do card. Segue o critério e o padrão da T-029.
3. `navegacao.spec.ts` ("botão Voltar", celular) instável uma vez — já na T-031.
Decisão pendente: nenhuma
Conceitos para estudo: `min-width: auto` de item flex; `break-word` × `anywhere` (min-content); `flex-wrap` e flex-basis = max-content; WCAG 1.4.4 e 1.4.10; testes que leem o CSS (`?raw`).
Commit: `fix(web): quebra nome longo dentro das etiquetas de tecnologia`

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: Diff mínimo e dentro do escopo: `overflow-wrap: anywhere` em `.stack` (card) e `.tecnologia` (Stacks) ataca a causa (`min-width: auto` do item flex), sem cortar nem esconder nada, no padrão da T-029. Cinco cenários unitários passam (22/22 no arquivo), incluindo um que protege etiquetas futuras (pílula = `border-radius: 999px`; hoje há só as duas, ambas corrigidas). Lint e validador verdes; as 3 falhas do web são as de nome (`pt-BR.ts` do George, T-015). Dev só em `apps/web/**`; sem segredos.
Arquivos alterados: nenhum
Pendências:
1. qa: e2e da tarefa e prova no container Linux do CI (critério 4).
2. *opcional* — avisar o George que, a 200%, "TypeScript" e "Markdown" no card quebram no meio da palavra (efeito dos critérios 2 e 3).
Decisão pendente: nenhuma
Conceitos para estudo: `min-width: auto` em item flex; `break-word` × `anywhere` no min-content; `flex-wrap` e largura inicial max-content; testes que leem CSS e protegem regras futuras por padrão.

## QA

### Rodada 1

Resultado: PASSOU
Resumo: Novo `e2e/testes/etiquetas.spec.ts` com 5 cenários (10 testes, celular e desktop): card em 360px no tamanho normal; seção Stacks em 360px no tamanho normal; 360px a 200% no card e em Stacks; nomes reais em 360px (normal e 200%) sem palavra que cabe partida no meio e etiqueta que cabe em uma linha; 1280px a 200% com nomes longos sem corte (`overflow` visível, sem reticências/`nowrap`, colunas de largura igual). O que depende de a palavra caber é medido com `<canvas>` na fonte da etiqueta (folga de 2px), independente da fonte. Mutação no container com `--retries=0`: CSS da `main` → 10/10 reprovam; listas com `nowrap` → 10/10 reprovam. Container `t029-linux` (DejaVu, `CI=true`, `--workers=2`, `pt-BR.ts` do HEAD): arquivo 30/30 com `--repeat-each=3`; suíte inteira 324 passaram, 12 pulados, sem instáveis. Windows: arquivo 30/30 com `--repeat-each=3`; suíte 324 + 12 pulados. ESLint e validador verdes.
Arquivos alterados:
- `e2e/testes/etiquetas.spec.ts` (novo)
Pendências:
1. *opcional, para o George*: a 200% com fontes largas, "TypeScript" e "Markdown" quebram no meio dentro do card (o cenário 4 aceita só quando o `<canvas>` confirma que não cabem).
Decisão pendente: nenhuma
Conceitos para estudo: `measureText` no `<canvas>`; `Range.getClientRects`; teste de mutação; `anywhere` com `flex-wrap`; WCAG 1.4.4 e 1.4.10.

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-17 — orquestrador: em-andamento — início no modo agente-faz; dev chamado
- 2026-10-17 — dev: CONCLUIDO — overflow-wrap: anywhere nas etiquetas; provado no container Linux
- 2026-10-17 — code-reviewer: APROVADO — anywhere nas etiquetas; e2e e prova Linux com o qa
- 2026-10-17 — qa: PASSOU — 5 cenários e2e; mutação reprovada; suíte verde no Linux e no Windows
- 2026-10-17 — orquestrador: concluida — verificação verde (shared 5; API 227 + 4; web 179 + 2; hooks 412; e2e CI=1 324 + 12 pulados; lint; validador), com o `pt-BR.ts` do George em stash durante a verificação; Linux comprovado pelo qa; CI da main acompanhado após o push; diário de estudo disparado após a integração
