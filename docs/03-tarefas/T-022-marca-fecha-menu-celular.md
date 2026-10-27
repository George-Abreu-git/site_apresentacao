---
id: T-022
titulo: Tocar na marca no celular fecha a lista do menu
status: concluida
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-16
---

# T-022 — Tocar na marca no celular fecha a lista do menu

## Descrição

BUG-Q1 da T-016, funcionalidade 1 (RF-01). No celular, com a lista do menu aberta, tocar na marca (nome no cabeçalho) leva ao Início mas a lista continua aberta (`aria-expanded="true"`) e cobre o começo da página.

Severidade: baixa.

## Critérios de aceite

- [ ] Tocar na marca com a lista aberta fecha a lista (`aria-expanded="false"`), como os links do menu
- [ ] O foco e a navegação por teclado continuam corretos
- [ ] O `test.fail` do BUG-Q1 em `e2e/testes/navegacao.spec.ts` vira teste normal e passa
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
Resumo: Passei o estado da lista do menu do `Menu` para o `Cabecalho`, e o `Menu` virou um componente controlado (props `aberto`, `aoAlternar`, `aoFechar`). Assim a marca, que fica fora do menu, também fecha a lista ao ser tocada (`onClick={fecharMenu}`). Os 5 cenários novos estão em `Cabecalho.test.tsx` (4 falhavam antes da correção). Os testes do `Menu` passaram a usar o invólucro `MenuComEstado`. Suíte, lint, build e validador verdes.
Arquivos alterados: apps/web/src/componentes/Cabecalho/Cabecalho.tsx; apps/web/src/componentes/Cabecalho/Cabecalho.test.tsx; apps/web/src/componentes/Menu/Menu.tsx; apps/web/src/componentes/Menu/Menu.test.tsx
Pendências:
1. (qa) O `test.fail` do BUG-Q1 em `e2e/testes/navegacao.spec.ts:408` agora passa ("Expected to fail, but passed"). Ele precisa virar teste normal (critério de aceite 3, área do qa).
Decisão pendente: nenhuma
Conceitos para estudo: componente controlado x não controlado (React); elevar o estado (lifting state up); props de callback (`aoAlternar`/`aoFechar`); invólucro de teste com estado (wrapper); `aria-expanded`; `test.fail` do Playwright e "passou inesperadamente"

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: O diff resolve o BUG-Q1: o estado da lista subiu para o Cabecalho, o Menu virou controlado e a marca fecha a lista. O foco e o Esc continuam corretos. Há 5 cenários novos que testam comportamento, e os testes antigos do Menu foram adaptados com um invólucro com estado. Os testes do web passaram (199, mais 1 falha esperada antiga de Projetos) e o lint está limpo. O dev só alterou a área dele.
Arquivos alterados: nenhum
Pendências:
1. (qa) Critério de aceite 3: tirar o `test.fail()` de `e2e/testes/navegacao.spec.ts:410` e atualizar o comentário "BUG CONHECIDO (T-016)"; depois rodar o e2e e o validador.
2. *opcional* — O cenário "pelo teclado" em `Cabecalho.test.tsx` simula o Enter com um clique (limitação do jsdom); vale o qa cobrir o Enter de verdade na marca no e2e do celular.
Decisão pendente: nenhuma
Conceitos para estudo: componente controlado x não controlado; elevar o estado (lifting state up); props de callback; invólucro de teste com estado; `aria-expanded`; `test.fail` do Playwright x `it.fails` do Vitest

## QA

### Rodada 1

Resultado: PASSOU
Resumo: Os 5 critérios de aceite foram atendidos. O `test.fail` do BUG-Q1 virou teste normal e passa. Somei 3 cenários e2e no celular (Enter na marca, reabrir a lista depois da marca, marca com a lista fechada) aos 5 cenários unitários do dev. O Tab depois do Enter na marca segue pelo Início, sem passar pela lista escondida. Unitários, hooks, lint, e2e completo (361 passaram, 0 falharam) e validador estão verdes.
Arquivos alterados: e2e/testes/navegacao.spec.ts
Pendências: nenhuma. Observação: o cenário unitário "o foco fica na marca" do `Cabecalho.test.tsx` vale só no jsdom; no navegador real, seguir a âncora leva o foco para o `body` e o ponto de partida do Tab para `#inicio` (comportamento nativo, igual nos links do menu). Fica a critério do George renomear o cenário numa tarefa futura.
Decisão pendente: nenhuma
Conceitos para estudo: `test.fail` do Playwright x teste normal; ponto de partida da navegação sequencial por foco ao seguir uma âncora (fragment navigation); limitações do jsdom (Enter→clique e âncoras); `aria-expanded`; `toBeInViewport`

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-27 — orquestrador: em-andamento — branch feat/T-022-marca-fecha-menu-celular; dev chamado
- 2026-10-27 — dev: CONCLUIDO — estado do menu elevado ao Cabecalho; a marca fecha a lista; test.fail do e2e fica para o qa
- 2026-10-27 — orquestrador: em-revisao — code-reviewer chamado
- 2026-10-27 — code-reviewer: APROVADO — Menu controlado, marca fecha a lista, dentro da área
- 2026-10-27 — orquestrador: em-qa — qa chamado
- 2026-10-27 — qa: PASSOU — test.fail do BUG-Q1 virou teste normal; 3 cenários e2e de teclado e regressão
- 2026-10-27 — orquestrador: concluida — verificação verde; diário de estudo disparado após a integração
