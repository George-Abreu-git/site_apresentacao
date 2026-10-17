---
id: T-030
titulo: Âncora não esconde o título atrás do cabeçalho alto
status: concluida
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

- [x] Ao seguir um link do menu ou uma âncora, o título da seção fica inteiro abaixo do cabeçalho, qualquer que seja a altura real dele (tamanho normal e texto a 200%, 360px a 1440px)
- [x] Navegação por Tab e Shift+Tab continua sem deixar o foco atrás do cabeçalho
- [x] O `test.fail` do bug em `texto-ampliado.spec.ts` vira teste normal e passa nos dois ambientes (Windows e container Linux com a DejaVu Sans)
- [x] 5 cenários de teste para a mudança, seguindo o padrão do George
- [x] Suíte inteira e validador verdes

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

### Rodada 1

Resultado: APROVADO
Resumo: Resolve a causa: `useAlturaDoCabecalho` mede a altura real (ResizeObserver `border-box`, arredondando para cima) e grava `--altura-real-do-cabecalho` no `<html>`; o `scroll-padding-top` lê a variável e o padrão em `tema.css` cobre o caso sem JS. A ordem dos `useLayoutEffect` (filho antes do pai, conferida em `useAncoraInicial.ts:35`) garante a altura certa na âncora inicial. Sem risco de laço no observer; dependência estável; limpeza ao desmontar. 5 cenários de comportamento; lint e tsc ok; Vitest só com as 3 falhas de nome (`pt-BR.ts` do George, T-015). Área do dev; lock inalterado; sem segredos.
Arquivos alterados: nenhum
Pendências:
1. *opcional* — `useAlturaDoCabecalho.test.tsx:64-67`: acrescentar `vi.unstubAllGlobals()` no `afterEach`.
2. *opcional* — `useAlturaDoCabecalho.test.tsx:106`: título "com 4rem de reserva" ambíguo.
3. qa: converter o `test.fail` de `texto-ampliado.spec.ts:277` e cobrir Shift+Tab a 200% e os dois ambientes.
Decisão pendente: nenhuma
Conceitos para estudo: ordem dos `useLayoutEffect`; ResizeObserver com `border-box`; inline × `:root` para variáveis CSS; `vi.stubGlobal` × `vi.unstubAllGlobals`; `scroll-padding-top` com cabeçalho `sticky`.

## QA

### Rodada 1

Resultado: PASSOU
Resumo: `test.fail` de `texto-ampliado.spec.ts` ("seguir um link do menu deixa o título da seção abaixo do cabeçalho") convertido em teste normal, no novo bloco "Âncora e foco abaixo do cabeçalho, qualquer que seja a altura dele (T-030)"; o `test.fail` da T-024 intocado. 5 cenários e2e com a expectativa calculada da altura medida do cabeçalho (borda da seção entre -1 e +1,5px da base do cabeçalho): rolagem suave pelo menu a 200% com nome longo em 360 e 768px; abrir `/#contato` a 200% (texto ampliado e nome longo aplicados antes de o React montar); Tab até o fim e Shift+Tab a 200% sem foco atrás do cabeçalho; mudar a largura 360 → 1440 → 360px; regressão no tamanho normal de 360 a 1440px. Comentário desatualizado corrigido em `navegacao.spec.ts:107`. Sem a correção (container, `--retries=0`), 12 dos 14 testes falham. Container `t029-linux` (DejaVu, `CI=true`, `--workers=2`, `pt-BR.ts` do HEAD): e2e 336 passaram, 12 pulados, sem instáveis; unitários shared 5, API 227 + 4, web 184 + 2. Windows: arquivos com `--repeat-each=3` 318 passaram; suíte 336 + 12 pulados; lint e validador OK. Cobre WCAG 2.4.11 e 1.4.4.
Arquivos alterados:
- `e2e/testes/texto-ampliado.spec.ts`
- `e2e/testes/navegacao.spec.ts` (só comentário)
Pendências:
1. "Voltar do navegador" (`navegacao.spec.ts:347`) falhou 1 vez em 3 no container com `--retries=0` — instabilidade conhecida (T-031).
2. Os 3 unitários do web que falham no Windows vêm do `pt-BR.ts` do George (T-015).
Decisão pendente: nenhuma
Conceitos para estudo: esperar a rolagem suave terminar antes de medir; `addInitScript` com `MutationObserver`; `::after` para simular texto mais longo; provar o teste sem a correção; WCAG 2.4.11 com Shift+Tab.

## Estudo

### Diário de estudo (documentador)

Resultado: CONCLUIDO
Resumo: Diário `docs/04-estudos/tarefas/T-030.md` (`consolidado: false`) explicando por que o `scroll-padding-top` fixo falhava com o cabeçalho em várias linhas, a correção (`useAlturaDoCabecalho` com `ResizeObserver` `border-box` gravando `--altura-real-do-cabecalho` no `<html>`, padrão em `tema.css`), a ordem dos `useLayoutEffect` diante da âncora inicial, os dublês do jsdom e as técnicas dos e2e (esperar a rolagem parar, `addInitScript` com `MutationObserver`, contraprova). 18 conceitos (nomes reaproveitados), 2 exercícios e links para T-029 e o diário da T-023. Nenhuma outra nota alterada.
Arquivos alterados:
- `docs/04-estudos/tarefas/T-030.md` (novo)
Pendências: nenhuma
Decisão pendente: nenhuma

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-17 — orquestrador: em-andamento — início no modo agente-faz; dev chamado
- 2026-10-17 — dev: CONCLUIDO — altura real do cabeçalho medida com ResizeObserver
- 2026-10-17 — code-reviewer: APROVADO — altura real medida; conversão do test.fail com o qa
- 2026-10-17 — qa: PASSOU — test.fail convertido; 5 cenários e2e; verde no Linux e no Windows
- 2026-10-17 — orquestrador: concluida — verificação verde (shared 5; API 227 + 4; web 184 + 2; hooks 412; e2e CI=1 336 + 12 pulados; lint; validador), com o `pt-BR.ts` do George em stash durante a verificação; Linux comprovado pelo qa; CI da main acompanhado após o push; diário de estudo disparado após a integração
- 2026-10-17 — documentador: CONCLUIDO — diário integrado
