---
id: T-030
titulo: Âncora não esconde o título atrás do cabeçalho alto
status: em-revisao
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-16
---

# T-030 — Âncora não esconde o título atrás do cabeçalho alto

## Descrição

Achado da T-029 (qa, rodada 1). O `scroll-padding-top` é fixo em `var(--altura-cabecalho)` (4rem = 128px a 200%) em `apps/web/src/index.css:12`, mas com o texto a 200% em 360px o cabeçalho quebra em 2+ linhas (249px com a DejaVu). Ao seguir um link do menu, o título da seção fica atrás do cabeçalho (título em y=225, cabeçalho até y=249). Teste marcado: `e2e/testes/texto-ampliado.spec.ts`, "360px a 200%: seguir um link do menu deixa o título da seção abaixo do cabeçalho" (`test.fail` com pré-condição e nome longo).

Severidade: média.

## Critérios de aceite

- [ ] Ao seguir um link do menu ou uma âncora, o título da seção fica inteiro abaixo do cabeçalho, qualquer que seja a altura real dele (tamanho normal e texto a 200%, 360px a 1440px)
- [ ] Navegação por Tab e Shift+Tab continua sem deixar o foco atrás do cabeçalho
- [ ] O `test.fail` do bug em `texto-ampliado.spec.ts` vira teste normal e passa nos dois ambientes (Windows e container Linux com a DejaVu Sans)
- [ ] 5 cenários de teste para a mudança, seguindo o padrão do George
- [ ] Suíte inteira e validador verdes

## Contexto relevante

- Origem: [[docs/03-tarefas/T-029-cabecalho-texto-ampliado|T-029]]
- [[docs/01-requisitos/requisitos|Requisitos]]

## Decisões

- 2026-10-16 — George: bugs e erros encontrados viram tarefas, em modo `agente-faz` (pedido de 2026-10-15).

## Dev

### Rodada 1

Resultado: CONCLUIDO
Resumo: Causa: `scroll-padding-top` fixo em 4rem, mas o cabeçalho cresce ao quebrar em várias linhas, e o CSS não lê a altura de um elemento. Correção: novo hook `useAlturaDoCabecalho` (usado no `Cabecalho`) mede a altura com borda (arredonda para cima) e grava `--altura-real-do-cabecalho` no `<html>`; um `ResizeObserver` (`box: 'border-box'`) atualiza; ao desmontar para de observar e remove a variável; sem `ResizeObserver` fica a primeira medida. Em `useLayoutEffect`: como o `Cabecalho` é filho do `App`, roda antes do `useAncoraInicial`, então a âncora inicial já rola com a altura certa. `tema.css` declara o padrão `--altura-real-do-cabecalho: var(--altura-cabecalho)` (sem JS continua 4rem); `index.css` usa `scroll-padding-top: var(--altura-real-do-cabecalho)`. Mudança visível: no tamanho normal a reserva passa de 64px para 65px (conta a borda). Vale para menu, âncora inicial, Tab e Shift+Tab (ajuda indireta: WCAG 2.4.11). 5 cenários unitários em `useAlturaDoCabecalho.test.tsx`. Container `t029-linux` (DejaVu, `CI=true`, `--workers=2`, `pt-BR.ts` do HEAD): e2e 322 passaram, 12 pulados, 2 falhas = o `test.fail` de `texto-ampliado.spec.ts:277` que agora passa; unitários shared 5, API 227 + 4, web 184 + 2; lint e build ok. Windows: o mesmo. Diagnóstico fora do repositório (`scratchpad/t029/diag030/`): 34/34 com a correção; 16 falham no HEAD.
Arquivos alterados:
- `apps/web/src/componentes/Cabecalho/useAlturaDoCabecalho.ts`, `useAlturaDoCabecalho.test.tsx` (novos)
- `apps/web/src/componentes/Cabecalho/Cabecalho.tsx`, `Cabecalho.test.tsx` (regex do `scroll-padding-top`)
- `apps/web/src/index.css`, `apps/web/src/tema.css`
Pendências:
1. qa: tirar o `test.fail()` e a conferência da condição do bug em `texto-ampliado.spec.ts:277` (e o comentário "BUG CONHECIDO"); e2e sugeridos: rolagem suave a 200% em 360 e 768px; `/#contato` a 200%; Shift+Tab a 200% com nome longo; mudar a largura com a página aberta.
2. Os 3 unitários que falham no Windows vêm do `pt-BR.ts` do George (T-015).
3. "Voltar do navegador" (`navegacao.spec.ts:346`) segue com a T-031. T-024 não muda (o 2º `test.fail` de `texto-ampliado.spec.ts` continua falhando como esperado).
Decisão pendente: nenhuma
Conceitos para estudo: `scroll-padding-top` com cabeçalho `sticky`; `ResizeObserver` (`content-box` × `border-box`); variáveis CSS escritas pelo JS e precedência inline × `:root`; valor padrão de variável CSS; ordem dos `useLayoutEffect`; dublês no jsdom; WCAG 2.4.11.
Commit: `fix(web): âncora respeita a altura real do cabeçalho (scroll-padding-top medido)`

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-17 — orquestrador: em-andamento — início no modo agente-faz; dev chamado
- 2026-10-17 — dev: CONCLUIDO — altura real do cabeçalho medida com ResizeObserver
