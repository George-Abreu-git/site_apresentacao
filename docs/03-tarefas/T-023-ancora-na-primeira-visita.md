---
id: T-023
titulo: Abrir o site direto numa âncora rola até a seção
status: concluida
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-16
---

# T-023 — Abrir o site direto numa âncora rola até a seção

## Descrição

BUG-Q2 da T-016, funcionalidade 1 (RF-01); achado original da T-012. Numa visita nova, abrir `/#servicos` ou `/#contato` (link compartilhado) deixa a página no topo (`scrollY` 0): o navegador procura o fragmento antes de o React montar as seções.

Severidade: média.

## Critérios de aceite

- [x] Abrir `/#<secao>` numa visita nova mostra a seção na tela, para todas as seções
- [x] Funciona no servidor de desenvolvimento e no build de produção (`vite preview`)
- [x] Os `test.fail` do BUG-Q2 em `e2e/testes/navegacao.spec.ts` viram testes normais e passam, e o teste antigo "abrir a página já numa âncora" deixa de depender do `goto('/')` do `beforeEach`
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
Resumo: Causa: o navegador procura o elemento da âncora quando o HTML termina de chegar, e nessa hora o `index.html` só tem a `<div id="root">` vazia; ele não procura de novo depois que o React monta as seções. Correção: novo hook `useAncoraInicial` (`apps/web/src/useAncoraInicial.ts`, chamado no `App.tsx`) que, na primeira montagem, lê `location.hash` e chama `scrollIntoView({ behavior: 'instant', block: 'start' })` no elemento, se existir — em `useLayoutEffect` (sem piscar o topo) e respeitando o `scroll-padding-top`; id procurado como veio e decodificado (acentos), `%` solto não lança erro. 5 cenários unitários em `useAncoraInicial.test.tsx` (rola uma vez sem animação; sem âncora não rola; âncora inexistente não rola nem dá erro; redesenho não rola de novo; acento, `%` solto e `#` sozinho); 1 e 4 falham sem o hook. Container `t029-linux` (pt-BR.ts do HEAD): web 174, API 227, shared 5; lint e build ok; e2e 290 passaram, 12 pulados, sem instáveis; únicas falhas são os 4 `test.fail` do BUG-Q2, que agora passam. Windows: o mesmo. Diagnósticos fora do repositório (dev e preview): as 6 seções na primeira visita, movimento reduzido, sem âncora no topo, API respondendo depois da rolagem (o Chromium mantém a posição).
Arquivos alterados:
- `apps/web/src/useAncoraInicial.ts`, `useAncoraInicial.test.tsx` (novos)
- `apps/web/src/App.tsx`
Pendências:
1. qa: tirar o `test.fail()` dos 2 testes do BUG-Q2 (`e2e/testes/navegacao.spec.ts:433`) e fazer o teste "abrir a página já numa âncora" (linha 136) não depender do `goto('/')` do `beforeEach`. Opcional: e2e para as 6 seções, build de produção e API respondendo depois (diagnósticos em `scratchpad/t029/t023/`).
2. Os 3 unitários do web que falham no Windows vêm do `pt-BR.ts` do George (T-015).
3. Observação: com a API respondendo depois da rolagem, quem mantém a seção no lugar é o navegador (`overflow-anchor`); o Safari pode não fazer isso (sem tarefa).
T-030: não piora nem ajuda (mesmo `scroll-padding-top`). T-031: não piora (rolagem inicial instantânea).
Decisão pendente: nenhuma
Conceitos para estudo: fragmento e quando o navegador rola até ele; ciclo de vida de uma SPA; `useLayoutEffect` × `useEffect`; `scrollIntoView` com `instant`; `overflow-anchor`; `decodeURIComponent` e `URIError`; espiões no Vitest e limites do jsdom; `history.replaceState` em testes.
Commit: `fix(web): rola até a âncora do endereço ao abrir o site`

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: O hook `useAncoraInicial` (`useLayoutEffect` + `scrollIntoView` com `instant`, id como veio e depois decodificado, sem lançar erro) corrige a causa do BUG-Q2 sem escopo extra. Âncora só usada em `getElementById` (sem injeção); sem segredos. 5 cenários de comportamento (5/5); lint e tsc sem erros; unitários do web só com as 3 falhas de nome (`pt-BR.ts` do George, T-015). Dev só em `apps/web/src`. e2e não rodado pelo revisor.
Arquivos alterados: nenhum
Pendências:
1. qa: converter os `test.fail` do BUG-Q2 (`e2e/testes/navegacao.spec.ts` ~434) e fazer o teste "abrir a página já numa âncora" (~137) não depender do `goto('/')` do `beforeEach` (critério 3); cobrir o build de produção (critério 2).
2. *opcional* — `useAncoraInicial.ts:16` e `:24`: parâmetro `documento` não usado.
3. *opcional* — `useAncoraInicial.ts:36`: comentar que no StrictMode o efeito roda duas vezes (sem efeito visível).
Decisão pendente: nenhuma
Conceitos para estudo: fragmento de URL; `useLayoutEffect` × `useEffect`; StrictMode rodando efeitos duas vezes; `scrollIntoView` com `instant` e `scroll-padding-top`; espiões no protótipo no Vitest/jsdom.

## QA

### Rodada 1

Resultado: PASSOU
Resumo: Os 5 critérios estão cumpridos. Os `test.fail` do BUG-Q2 viraram testes normais e o teste antigo "abrir a página já numa âncora" saiu do bloco com `beforeEach` (o caso dele é coberto pelo laço das 6 seções; a troca de âncora com a página aberta virou teste próprio). 5 cenários e2e novos no bloco "abrir o site direto numa âncora (T-023)": as 6 seções numa visita nova; sem animação, com e sem movimento reduzido (eventos `scroll` registrados desde a carga); sem âncora no topo (`/` e `/#`); API respondendo depois da rolagem; navegar pelo menu sem voltar para a âncora. Sem medidas absolutas (independe da fonte). Container `t029-linux` (DejaVu, `CI=true`, `--workers=2`, `pt-BR.ts` do HEAD): e2e 314 passaram, 12 pulados, sem instáveis; unitários web 174 + 2, API 227 + 4, shared 5; lint e build ok. Windows: `navegacao.spec.ts` com `--repeat-each=3` 234 passaram; hooks 412, lint, validador OK. Mutação: sem o hook, 18 testes falham; com `smooth`, os "sem animação" falham. `vite preview` validado fora do repositório (config do dev): `navegacao.spec.ts` passa inteiro.
Arquivos alterados:
- `e2e/testes/navegacao.spec.ts`
Pendências:
1. devops: e2e contra o build de produção (`vite preview`) não roda na suíte (precisa de config/script novos); ao ligar, `seguranca.spec.ts:54` (espera > 5 módulos JS) e `projetos.spec.ts:322` (procura `LimiteDeErro` na pilha) precisam se adaptar ao build minificado. → vira tarefa.
2. Acessibilidade (baixa): numa visita nova a `/#contato`, o primeiro Tab vai para a marca do cabeçalho, não para o primeiro link de Contato (o `scrollIntoView` não move o ponto de partida do Tab). → vira tarefa.
3. Os 3 unitários do web que falham no Windows vêm do `pt-BR.ts` do George (T-015).
Decisão pendente: nenhuma
Conceitos para estudo: navegação para fragmento numa visita nova × mesma página; `page.addInitScript`; testar ausência de animação por eventos `scroll`; `emulateMedia({ reducedMotion })`; segurar uma rota com Promise; mutação de código; ponto de partida do Tab; dev × build minificado.

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-16 — orquestrador: em-andamento — início no modo agente-faz; dev chamado
- 2026-10-16 — dev: CONCLUIDO — hook useAncoraInicial; BUG-Q2 corrigido em dev e preview
- 2026-10-16 — code-reviewer: APROVADO — hook corrige a causa; conversão dos test.fail com o qa
- 2026-10-17 — qa: PASSOU — BUG-Q2 convertido; 5 cenários e2e; suíte verde no container Linux
- 2026-10-17 — orquestrador: concluida — verificação verde (shared 5; API 227 + 4; web 174 + 2; hooks 412; e2e CI=1 314 + 12 pulados; lint; validador), com o `pt-BR.ts` do George em stash durante a verificação; Linux comprovado pelo qa; build de produção validado fora da suíte (e2e de preview vira tarefa do devops); CI da main acompanhado após o push; diário de estudo disparado após a integração
