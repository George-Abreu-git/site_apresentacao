---
id: T-009
titulo: Seção Stacks a partir de arquivo de conteúdo
status: concluida
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-10
---

# T-009 — Seção Stacks a partir de arquivo de conteúdo

## Descrição

Lista de tecnologias agrupada por categoria, vinda de um arquivo de conteúdo. Modo `agente-faz` (decisão do George em 2026-10-15; originalmente `eu-faco`).

## Critérios de aceite

- [x] RF-04: tecnologias agrupadas por categoria (ex.: front-end, back-end, ferramentas)
- [x] Adicionar uma tecnologia no arquivo faz ela aparecer sem alterar código de tela
- [x] Responsivo e acessível (lista semântica)
- [x] Testes unitários e e2e

## Contexto relevante

- Depende de: T-008
- [[docs/01-requisitos/requisitos|Requisitos]]
- [[docs/03-tarefas/T-008-conteudo-secoes-estaticas|T-008]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).
- 2026-10-15 — George: modo trocado de `eu-faco` para `agente-faz` (o dev implementa).

## Dev

### Rodada 1

Resultado: CONCLUIDO
Resumo: A seção Stacks (RF-04) agora vem do arquivo de conteúdo (`conteudo.stacks.categorias`, tipo `CategoriaDeStack`). O componente `Stacks` mostra cada categoria como `<h3>` mais uma `<ul>` com o nome da categoria (`aria-labelledby`) e entrou no `App.tsx` no lugar da seção vazia. Layout responsivo mobile-first (1, 2 e 4 colunas), cores só das variáveis do tema. Testes unitários escritos antes do código (TDD): região #stacks, categorias como h3, uma lista com nome por categoria na ordem do arquivo, e uma tecnologia nova aparecendo sem mudar o componente (prop opcional `categorias`). O teste de RF-09 continua verde. Unitários (web 47, API 8, hooks 412), lint, build e e2e existentes (91 ok, 7 pulados) verdes.
Arquivos alterados:
- `apps/web/src/componentes/Stacks/` (novos): `Stacks.tsx`, `Stacks.module.css`, `Stacks.test.tsx`
- `apps/web/src/conteudo/tipos.ts`, `pt-BR.ts`, `index.ts`
- `apps/web/src/App.tsx`
Pendências:
1. e2e da seção Stacks são do qa (`e2e/**`).
2. A lista de tecnologias em `pt-BR.ts` está marcada como PROVISÓRIA (tecnologias da ADR-0001 em Front-end, Back-end, Testes, Ferramentas); o George precisa revisar e completar com as stacks reais — conteúdo, como o LinkedIn e o e-mail da T-008.
3. Observação: listas com `list-style: none` podem não ser anunciadas como "lista" no Safari + VoiceOver (igual à seção Sobre); `role="list"` resolveria.
Decisão pendente: nenhuma
Conceitos para estudo: dados que comandam a tela (`.map` sobre o conteúdo); prop opcional com valor padrão (injeção de dependência simples); `aria-labelledby` para nomear lista; HTML semântico (`ul`/`li`, h2 > h3); CSS Grid `repeat(n, minmax(0, 1fr))` mobile-first; flexbox com `flex-wrap`; consultas por papel (`getByRole('list', { name })`, `within`); TDD.
Commit: `feat(stacks): adiciona seção Stacks agrupada por categoria a partir do arquivo de conteúdo`

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: O diff entrega o RF-04 com a seção Stacks montada a partir do arquivo de conteúdo, em lista semântica com nome e layout responsivo mobile-first. Os testes unitários testam comportamento, por papel e nome acessível. Testes da web (47), lint e typecheck verdes. Todos os arquivos estão na área do dev; nada bloqueante.
Arquivos alterados: nenhum
Pendências:
1. *opcional* — `Stacks.test.tsx:10`: o nome do teste diz "com o título de nível 2", mas não confere o nível.
2. *opcional* — `Stacks.tsx:25`: `role="list"` para o Safari + VoiceOver anunciar a lista (vale também para a seção Sobre, em tarefa à parte).
3. *opcional* — `Stacks.tsx:20`: `key` é o título da categoria; títulos duplicados gerariam aviso do React.
4. Lista de tecnologias em `pt-BR.ts` marcada como PROVISÓRIA (conteúdo, revisão do George).
5. Descrição da nota ainda dizia "Modo `eu-faco`" — corrigida pelo orquestrador.
Decisão pendente: nenhuma
Conceitos para estudo: rótulo acessível de lista com `aria-labelledby`; `getByRole`/`within`; prop opcional com valor padrão; `key` estável em `.map`; `repeat(n, minmax(0, 1fr))`.

## QA

### Rodada 1

Resultado: PASSOU
Resumo: Os critérios de RF-04 foram validados com e2e novos em `e2e/testes/stacks.spec.ts`: categorias e listas com nome vindas do arquivo de conteúdo, layout com 1, 2 e 4 colunas sem rolagem horizontal de 320 a 1920px, contraste AA, nenhum elemento focável na seção e um teste que protege o arquivo de conteúdo (sem categoria vazia, título repetido ou tecnologia repetida — cobre o risco de `key` duplicada). e2e completo com 115 passando e 7 pulados; unitários (web 47, API 8, hooks 412), lint e validador verdes.
Arquivos alterados:
- `e2e/testes/stacks.spec.ts` (novo)
Pendências:
1. Lista de tecnologias em `pt-BR.ts` ainda PROVISÓRIA (conteúdo, para o George revisar); os e2e acompanham qualquer mudança nela.
2. *opcional* — `role="list"` nas listas sem marcador (Safari + VoiceOver); não verificado, o Playwright usa só o Chromium.
Decisão pendente: nenhuma
Conceitos para estudo: e2e guiados pelo arquivo de conteúdo; contar colunas de um grid com `getBoundingClientRect`; `toHaveText` com lista para conferir a ordem; contraste WCAG contra o fundo do próprio elemento; testes Playwright sem `page` para validar dados.

## Estudo

### Diário de estudo (documentador)

Resultado: CONCLUIDO
Resumo: Diário da T-009 escrito em `docs/04-estudos/tarefas/T-009.md` (template `diario-estudo.md`, `consolidado: false`, 13 conceitos, 2 exercícios), com base nos handoffs de Dev, Revisão e QA e no código da seção Stacks e dos e2e. Explica a tela montada a partir dos dados, a prop opcional com valor padrão, a `key` estável, o `aria-labelledby` nas listas, o grid com `minmax` e as etiquetas com `flex-wrap`, as consultas por papel, o TDD e os e2e guiados pelo conteúdo. Reaproveita nomes de conceitos da T-008. Nenhuma outra nota de estudo alterada.
Arquivos alterados:
- `docs/04-estudos/tarefas/T-009.md` (novo)
Pendências: nenhuma
Decisão pendente: nenhuma

## DevOps

## Log

- 2026-10-10 — tarefa criada
- 2026-10-15 — orquestrador: em-andamento — início no modo agente-faz por decisão do George; dev chamado
- 2026-10-15 — dev: CONCLUIDO — seção Stacks a partir do conteúdo; lista de tecnologias provisória para o George revisar
- 2026-10-15 — code-reviewer: APROVADO — RF-04 com lista semântica e responsiva; 47 testes, lint e typecheck verdes
- 2026-10-15 — qa: PASSOU — e2e da seção Stacks (115 passando, 7 pulados); suíte, lint e validador verdes
- 2026-10-15 — orquestrador: concluida — verificação verde; diário de estudo disparado após a integração
- 2026-10-15 — documentador: CONCLUIDO — diário integrado
