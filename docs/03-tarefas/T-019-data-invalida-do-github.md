---
id: T-019
titulo: Data inválida do GitHub não derruba o card de projeto
status: concluida
modo: agente-faz
tags: [front-end, back-end, api]
rodadas: 0
criada: 2026-10-16
---

# T-019 — Data inválida do GitHub não derruba o card de projeto

## Descrição

BUG-2 da T-016, funcionalidades 5 e 7. A API aceita qualquer texto em `pushed_at` e repassa em `ultimaAtualizacao`; no front, `Intl.DateTimeFormat.format` lança `RangeError: Invalid time value` e a página inteira some.

Severidade: baixa.

## Critérios de aceite

- [x] A API trata `pushed_at` que não é data válida como formato inesperado (`disponivel: false`)
- [x] O card não quebra com data inválida (mostra o card sem a data)
- [x] Os `it.fails` do BUG-2 (`github-cliente.spec.ts` e `CartaoDeProjeto.test.tsx`) viram testes normais e passam
- [x] Os testes da T-018 que usam a data inválida para provocar erro de renderização (`App.test.tsx`, "um erro ao desenhar um card fica contido…"; `Projetos.test.tsx`, "quando um card lança erro ao desenhar…") passam a provocar o erro de outra forma (ex.: `vi.mock` do `CartaoDeProjeto`), sem perder o que provam — aviso do code-reviewer da T-018
- [x] 5 cenários de teste para a mudança (unitário, rota e/ou e2e, conforme a área), seguindo o padrão do George
- [x] Suíte inteira e validador verdes

## Contexto relevante

- Origem: [[docs/03-tarefas/T-016-pente-fino-de-testes|T-016]] (pente-fino de testes)
- [[docs/01-requisitos/requisitos|Requisitos]]

## Decisões

- 2026-10-16 — George: bugs e erros do pente-fino viram tarefas, em modo `agente-faz` (pedido de 2026-10-15).

## Dev

### Rodada 1

Resultado: CONCLUIDO
Resumo: API (`github-cliente.ts`): `pushed_at` precisa ser data e hora ISO 8601 com fuso, senão "formato inesperado" → `disponivel: false`; `ehDataEHoraIso` combina regex (barra "1") e `Date.parse` (barra "2026-13-01T25:00:00Z"). Card (`CartaoDeProjeto.tsx`): a data foi para o subcomponente `UltimaAtualizacao` e a função `formatarData`, que devolve `null` para data inválida — o par "Atualizado em" some, e linguagem, estrelas e links continuam; datas válidas sem mudança visual. Os dois `it.fails` do BUG-2 viraram testes normais. Os testes da T-018 em `App.test.tsx` e `Projetos.test.tsx` ficaram vermelhos com a correção (provando a dependência) e passaram a provocar o erro com `vi.mock` do `CartaoDeProjeto` (card simulado em `apoio-de-testes/cartao-que-lanca-erro.tsx`, lança só para um título combinado). Cenários: API (texto qualquer; `it.each` com vazio, número, só data, mês e hora inexistentes; aceita fração de segundo e fuso); card (não derruba nem gera erro; omite a data em 3 casos mantendo o resto). API 234 + 3 esperadas, shared 5, lint, `tsc -b --force` e `tsc --noEmit` verdes; web só com as 3 falhas de nome (`pt-BR.ts` do George, T-015).
Arquivos alterados:
- `apps/api/src/github/github-cliente.ts`, `github-cliente.spec.ts`
- `apps/web/src/componentes/CartaoDeProjeto/CartaoDeProjeto.tsx`, `CartaoDeProjeto.test.tsx`
- `apps/web/src/App.test.tsx`, `apps/web/src/componentes/Projetos/Projetos.test.tsx`
- `apps/web/src/apoio-de-testes/cartao-que-lanca-erro.tsx` (novo)
Pendências:
1. As 3 falhas do web vêm do `pt-BR.ts` do George (T-015 adiada).
2. qa: teste de rota em `apps/api/test/github.e2e-spec.ts` mostrando que `pushed_at` inválido vira `github: { disponivel: false }` em `/api/projetos`.
Decisão pendente: nenhuma
Conceitos para estudo: validação de dados externos; ISO 8601 e `Date.parse`; regex; type guard; `Intl.DateTimeFormat` e `RangeError`; programação defensiva; `vi.mock` com `importOriginal` e hoisting; dublê para provocar erro sem depender de bug; error boundary.
Commit: `fix(github): recusa data inválida do GitHub e protege o card de projeto`

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: O diff atende os critérios sem escopo extra: API recusa `pushed_at` fora de data e hora ISO 8601 (regex com âncoras + `Date.parse`, num type guard); o card omite a data inválida em vez de quebrar; os dois `it.fails` do BUG-2 viraram testes normais; os testes da T-018 provocam o erro com `vi.mock` (`importOriginal`) e um card simulado, sem perder o que provam. API 234 + 3 esperadas; web só com as 3 falhas de nome (`pt-BR.ts` do George); lint, `tsc -b` e validador verdes. Área do dev; sem segredos.
Arquivos alterados: nenhum
Pendências:
1. *opcional* — numa execução em segundo plano, `npm test -w apps/api` falhou sem mostrar o teste; duas novas execuções passaram (234 + 3). Possível instabilidade: o qa observa.
2. *opcional* — `Date.parse` do V8 pode aceitar dias inexistentes (ex.: 30/02), virando data válida no mês seguinte; não quebra o card.
3. qa: teste de rota mostrando que `pushed_at` inválido vira `github: { disponivel: false }` em `/api/projetos`.
Decisão pendente: nenhuma
Conceitos para estudo: validação na fronteira da API; type guard; regex com âncoras e ISO 8601; limites do `Date.parse`; programação defensiva no front; `vi.mock` com `importOriginal` e hoisting; dublê para provocar erro.

## QA

### Rodada 1

Resultado: PASSOU
Resumo: Critérios atendidos. Bloco T-019 em `apps/api/test/github.e2e-spec.ts` (16 testes de rota: 9 datas inválidas viram `github: { disponivel: false }`, outros repositórios não são afetados, a falha não fica no cache, aviso no log sem token, 4 datas válidas passam inalteradas) e 5 cenários e2e em `e2e/testes/projetos.spec.ts` (14 execuções, celular e desktop: card sem "Atualizado em", variações de data, `<dl>` sem par órfão, página de pé sem erros no console, 360px e foco visível). Com o código do `main`, 10 testes de rota e 14/14 e2e falham. Suíte e2e no `t029-linux` (DejaVu Sans, `CI=true`): 350 passaram e 12 pulados, de 362. Unitários (shared 5, API 250 + 3 esperadas, web 189 + 1 esperada), lint, build, hooks (412) e validador verdes. API rodou 8 vezes (5 em sequência, 3 em paralelo) sem instabilidade.
Arquivos alterados:
- apps/api/test/github.e2e-spec.ts
- e2e/testes/projetos.spec.ts
Pendências:
1. *observação, fora do escopo* — `Date.parse` do V8 aceita dias inexistentes (ex.: 2026-02-30) e os leva ao mês seguinte; não quebra o card.
2. Localmente o web segue com as 3 falhas do `pt-BR.ts` do George (T-015 adiada); com o `pt-BR.ts` do HEAD, verde.
Decisão pendente: nenhuma
Conceitos para estudo: teste de rota com `fetch` simulado; provar que o teste falha sem a correção; cache que não guarda falhas; `pageerror` e `console` no Playwright; `<dl>` sem par órfão; `Date.parse` no Node e no Chrome; testes em paralelo para caçar instabilidade.

## Estudo

Resultado: CONCLUIDO
Resumo: Diário em `docs/04-estudos/tarefas/T-019.md` (`consolidado: false`): as duas proteções (type guard `ehDataEHoraIso` com regex ancorada e `Date.parse` na API; `formatarData`/`UltimaAtualizacao` omitindo a data inválida no card em vez de lançar `RangeError`) e a troca da muleta do bug nos testes da T-018 por um dublê com `vi.mock`/`importOriginal`. Conceitos novos: `iso-8601-e-date-parse`, `expressoes-regulares-com-ancoras`, `intl-datetimeformat-e-rangeerror`, `vi-mock-com-importoriginal-e-hoisting`, `duble-de-teste-para-provocar-erro`.
Arquivos alterados:
- docs/04-estudos/tarefas/T-019.md
Pendências: nenhuma
Decisão pendente: nenhuma

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-17 — orquestrador: em-andamento — início no modo agente-faz; dev chamado
- 2026-10-17 — dev: CONCLUIDO — API recusa data inválida; card omite a data
- 2026-10-17 — code-reviewer: APROVADO — critérios atendidos; teste de rota com o qa
- 2026-10-17 — qa: PASSOU — rota e e2e cobrem a data inválida; suíte e2e verde no container Linux
- 2026-10-17 — orquestrador: concluida — verificação verde (unitários, lint, validador, e2e 350 + 12 pulados); merge em main
- 2026-10-17 — documentador: CONCLUIDO — diário integrado
