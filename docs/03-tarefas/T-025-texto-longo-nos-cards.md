---
id: T-025
titulo: Texto longo nos cards de projeto não causa rolagem lateral
status: concluida
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-16
---

# T-025 — Texto longo nos cards de projeto não causa rolagem lateral

## Descrição

BUG-Q4 da T-016, funcionalidades 5 e 11 (RNF-01). Em 360px, uma palavra longa sem espaço no título ou um endereço longo na descrição de um projeto fazem a página rolar para o lado (conteúdo com ~546px e ~363px). Causa (corrigida pelo documentador no diário da T-016): em `apps/web/src/componentes/Projetos/Projetos.module.css`, a `.lista` só define `minmax(0, 1fr)` a partir de 36rem; abaixo disso não define colunas, e a coluna implícita (`auto`) cresce até caber a palavra longa. Também estoura com o texto a 200%.

Severidade: média.

## Critérios de aceite

- [x] Título e descrição longos quebram dentro do card em 360px, sem rolagem lateral
- [x] Sem rolagem lateral com o texto a 200%
- [x] CI de volta ao verde: o e2e `e2e/testes/acessibilidade.spec.ts:117` ("720px com o texto ampliado a 200%: nada passa da largura da tela") passa também no Linux — hoje falha no CI porque os dados vivos do card (`div`, `dd`, `time`) passam da largura com as fontes do Linux (no Windows passa); comprovado num container `mcr.microsoft.com/playwright:v1.64.0-noble` com `CI=true`
- [x] Os `test.fail` do BUG-Q4 em `e2e/testes/projetos.spec.ts` viram testes normais e passam
- [x] 5 cenários de teste para a mudança (unitário, rota e/ou e2e, conforme a área), seguindo o padrão do George
- [x] Suíte inteira e validador verdes

## Contexto relevante

- Origem: [[docs/03-tarefas/T-016-pente-fino-de-testes|T-016]] (pente-fino de testes)
- [[docs/01-requisitos/requisitos|Requisitos]]

## Decisões

- 2026-10-16 — George: bugs e erros do pente-fino viram tarefas, em modo `agente-faz` (pedido de 2026-10-15).
- 2026-10-16 — George: CI da `main` vermelho desde o fim da T-016 (e2e de texto a 200% falha só no Linux) → **A**: executar a T-025 agora, com prioridade, corrigindo a causa no layout do card, sem enfraquecer testes; verificar no container Linux antes do merge.

## Dev

### Rodada 1

Resultado: CONCLUIDO
Resumo: Duas causas, ambas corrigidas só com CSS. (1) BUG-Q4: `.lista` de `Projetos.module.css` não definia colunas no celular e a coluna implícita (`auto`) crescia até caber a maior palavra → `grid-template-columns: minmax(0, 1fr)` já no celular. (2) CI vermelho: media queries em `rem` usam a fonte inicial do navegador, não o `font-size: 200%` injetado, então em 720px a 200% a lista continua com 2 colunas estreitas (~198px úteis) e o par "Atualizado em" + "01/10/2026" (~300px, flex sem quebra) passava da borda com as fontes do Linux → `.dado` de `CartaoDeProjeto.module.css` com `flex-wrap: wrap` e `gap: 0 0.375rem`. Por prevenção (mesma causa e regra já existente no projeto), `.blocos` de `Servicos.module.css` e `.categorias` de `Stacks.module.css` receberam a mesma coluna `minmax(0, 1fr)`. 5 cenários (TDD; os 3 primeiros falhavam antes): toda grade declara `minmax(0, 1fr)` fora das media queries; lista de projetos com 1/2/3 colunas; toda fileira flex do card com `flex-wrap`; card sem `overflow: hidden`/`clip`/`text-overflow`/`nowrap`; título e descrição longos inteiros. Comprovado em container `mcr.microsoft.com/playwright:v1.64.0-noble` com `CI=true`: os e2e de 200% (`acessibilidade.spec.ts:117`) passam; os `test.fail` do BUG-Q4 (`projetos.spec.ts:410`) passam a passar ("Expected to fail, but passed" — únicas falhas). Unitários no Linux com o `pt-BR.ts` do HEAD: web 151 + 3 esperadas, API 227; local: hooks 412, lint, build e validador verdes.
Arquivos alterados:
- `apps/web/src/componentes/Projetos/Projetos.module.css`, `CartaoDeProjeto/CartaoDeProjeto.module.css`, `Servicos/Servicos.module.css`, `Stacks/Stacks.module.css`
- `apps/web/src/responsividade.test.ts`, `apps/web/src/componentes/CartaoDeProjeto/CartaoDeProjeto.test.tsx`
Pendências:
1. qa: converter os `test.fail()` do BUG-Q4 em `e2e/testes/projetos.spec.ts:410` em testes normais.
2. qa (opcional): corrigir o comentário de `e2e/testes/acessibilidade.spec.ts` (~linha 113): 720px a 200% é layout de 2 colunas, não o equivalente a 360px; pode cobrir 360px a 200% com textos longos.
3. Os 3 unitários locais que falham vêm só da troca de nome não commitada do George (T-015).
4. Serviços e Stacks corrigidos por prevenção; se o George quiser só o card, reverter esses dois arquivos e restringir o teste "toda grade…".
Decisão pendente: nenhuma
Conceitos para estudo: coluna implícita do Grid (`auto`) × `minmax(0, 1fr)`; `min-width: auto` de itens de grid/flex; `flex-wrap` em pares rótulo/valor; media queries em `rem` × `font-size` do `html`; WCAG 1.4.4/1.4.10; métricas de fonte Windows × Linux; reproduzir o CI num container do Playwright.
Commit: `fix(web): impede rolagem lateral com texto longo ou ampliado nos cards`

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: O diff resolve as duas causas só com CSS e sem esconder conteúdo: `minmax(0, 1fr)` na grade já no celular (BUG-Q4; o `overflow-wrap: break-word` de `index.css` passa a funcionar) e `flex-wrap` no par rótulo/valor do card (texto a 200%, CI), coerente com `.stacks`, `.dados` e `.links`. Serviços e Stacks corrigidos por prevenção, com a mesma causa e cobertos pelo teste "toda grade…". 5 cenários novos que testam a regra de layout. Dev só em `apps/web/**`; sem segredos. Lint e validador verdes; unitários web falham só nos 3 testes de nome (pt-BR.ts do George, T-015). e2e no Linux não rodados pelo revisor.
Arquivos alterados: nenhum
Pendências:
1. qa: converter os `test.fail` do BUG-Q4 (`e2e/testes/projetos.spec.ts` ~410), confirmar `acessibilidade.spec.ts:117` no container Linux e acompanhar o CI da `main` após o push.
2. *opcional* — `responsividade.test.ts` (`semMediaQueries`): guarda para `@media` sem `{` (laço infinito) e extrair a contagem de chaves duplicada com `blocoDeMedia`.
3. *opcional* — o cenário "toda grade…" exigirá exceção explícita para uma grade futura com outro desenho no celular.
4. *opcional* — o unitário do cartão só cobre o React; a prova real é o e2e.
Decisão pendente: nenhuma
Conceitos para estudo: coluna implícita × `minmax(0, 1fr)`; `min-width: auto`; `overflow-wrap` só funciona se o contêiner encolhe; `flex-wrap`; limites do jsdom; WCAG 1.4.4/1.4.10.

## QA

### Rodada 1

Resultado: PASSOU
Resumo: Os `test.fail` do BUG-Q4 viraram testes normais (bloco "Projetos: texto longo (T-025)", conferindo texto inteiro, dentro da caixa e quebrado em mais de uma linha). Comentário do teste de 200% corrigido (media queries em rem não acompanham o `font-size` do html; 720px a 200% segue com 2 colunas) e 360px a 200% com textos longos coberto. 5 cenários para os cards de projetos e 5 para as grades de Serviços e Stacks no celular; apoio novo em `e2e/apoio/pagina.ts` (`PALAVRA_LONGA`, `ENDERECO_LONGO`, `trocarTexto`, `medirTexto`, `larguras`). Container Linux do CI (`mcr.microsoft.com/playwright:v1.64.0-noble`, `CI=true`, `pt-BR.ts` do HEAD): e2e 268 passaram, 12 pulados, 0 falhas, sem retries, inclusive "720px com o texto ampliado a 200%"; unitários verdes no Linux. Prova negativa: com o CSS da `main`, os testes novos de 360px e o de 720px a 200% falham. Local: e2e, lint e validador verdes; unitários do web falham só nos 3 testes de nome (`pt-BR.ts` do George, T-015).
Arquivos alterados:
- `e2e/apoio/pagina.ts`
- `e2e/testes/projetos.spec.ts`, `acessibilidade.spec.ts`, `secoes-estaticas.spec.ts`, `stacks.spec.ts`
Pendências:
1. Bug novo (média): em 360px, nome de tecnologia longo e sem espaço nas etiquetas (`.stack` do card e `.tecnologia` de Stacks) faz a página rolar para o lado (379px e 404px); causa: `min-width: auto` do item flex (o `overflow-wrap: break-word` não reduz a largura mínima). → vira tarefa.
2. Informativo (baixa): em 320px a 200%, botão do menu e links do card passam da tela (abaixo dos 360px do RNF-01, fora do requisito).
3. Acompanhar o CI da `main` depois do push.
4. Os 3 unitários do web que falham localmente vêm do `pt-BR.ts` do George (T-015).
Decisão pendente: nenhuma
Conceitos para estudo: media queries em rem × `font-size` do html; coluna implícita × `minmax(0, 1fr)`; `min-width: auto` de itens flex; `scrollWidth`/`clientWidth` e `getBoundingClientRect`; prova negativa; reproduzir o CI num container.

## Estudo

### Diário de estudo (documentador)

Resultado: CONCLUIDO
Resumo: Diário `docs/04-estudos/tarefas/T-025.md` (`consolidado: false`) explicando as duas causas (coluna implícita `auto` × `minmax(0, 1fr)` e `min-width: auto`; media queries em `rem` × texto a 200% e `flex-wrap` no par rótulo/valor), os testes (unitários que leem o CSS, e2e com textos longos, prova negativa, reprodução no container do CI) e 2 exercícios no DevTools. Conceitos reaproveitam nomes de diários anteriores. Nenhuma outra nota alterada.
Arquivos alterados:
- `docs/04-estudos/tarefas/T-025.md` (novo)
Pendências: nenhuma
Decisão pendente: nenhuma

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-16 — orquestrador: em-andamento — prioridade por decisão do George (CI vermelho); dev chamado
- 2026-10-16 — dev: CONCLUIDO — duas causas corrigidas em CSS; e2e de 200% verde no Linux
- 2026-10-16 — code-reviewer: APROVADO — causas corrigidas só com CSS; e2e Linux com o qa
- 2026-10-16 — qa: PASSOU — BUG-Q4 convertido; suíte e2e verde no container Linux do CI
- 2026-10-16 — orquestrador: concluida — verificação verde (local: shared 5, API 227 + 4 esperadas, web 151 + 3, hooks 412, e2e com CI=1 268 + 12 pulados, lint, validador; Linux: prova do qa no container do CI); `pt-BR.ts` do George em stash durante a verificação e devolvido; CI da main acompanhado após o push; diário de estudo disparado após a integração
- 2026-10-16 — documentador: CONCLUIDO — diário integrado
