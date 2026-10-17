---
id: T-019
titulo: Data inválida do GitHub não derruba o card de projeto
status: em-qa
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

- [ ] A API trata `pushed_at` que não é data válida como formato inesperado (`disponivel: false`)
- [ ] O card não quebra com data inválida (mostra o card sem a data)
- [ ] Os `it.fails` do BUG-2 (`github-cliente.spec.ts` e `CartaoDeProjeto.test.tsx`) viram testes normais e passam
- [ ] Os testes da T-018 que usam a data inválida para provocar erro de renderização (`App.test.tsx`, "um erro ao desenhar um card fica contido…"; `Projetos.test.tsx`, "quando um card lança erro ao desenhar…") passam a provocar o erro de outra forma (ex.: `vi.mock` do `CartaoDeProjeto`), sem perder o que provam — aviso do code-reviewer da T-018
- [ ] 5 cenários de teste para a mudança (unitário, rota e/ou e2e, conforme a área), seguindo o padrão do George
- [ ] Suíte inteira e validador verdes

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

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-17 — orquestrador: em-andamento — início no modo agente-faz; dev chamado
- 2026-10-17 — dev: CONCLUIDO — API recusa data inválida; card omite a data
- 2026-10-17 — code-reviewer: APROVADO — critérios atendidos; teste de rota com o qa
