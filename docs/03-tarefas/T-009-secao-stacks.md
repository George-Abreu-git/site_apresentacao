---
id: T-009
titulo: Seção Stacks a partir de arquivo de conteúdo
status: em-revisao
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-10
---

# T-009 — Seção Stacks a partir de arquivo de conteúdo

## Descrição

Lista de tecnologias agrupada por categoria, vinda de um arquivo de conteúdo. Modo `eu-faco`.

## Critérios de aceite

- [ ] RF-04: tecnologias agrupadas por categoria (ex.: front-end, back-end, ferramentas)
- [ ] Adicionar uma tecnologia no arquivo faz ela aparecer sem alterar código de tela
- [ ] Responsivo e acessível (lista semântica)
- [ ] Testes unitários e e2e

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

## QA

## Estudo

## DevOps

## Log

- 2026-10-10 — tarefa criada
- 2026-10-15 — orquestrador: em-andamento — início no modo agente-faz por decisão do George; dev chamado
- 2026-10-15 — dev: CONCLUIDO — seção Stacks a partir do conteúdo; lista de tecnologias provisória para o George revisar
