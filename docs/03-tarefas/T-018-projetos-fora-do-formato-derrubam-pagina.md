---
id: T-018
titulo: Projeto fora do formato na resposta da API não derruba a página
status: concluida
modo: agente-faz
tags: [front-end, api]
rodadas: 0
criada: 2026-10-16
---

# T-018 — Projeto fora do formato na resposta da API não derruba a página

## Descrição

BUG-1 da T-016, funcionalidade 5 (RF-05). Se `GET /api/projetos` devolver um projeto fora do formato (ex.: sem `stacks`), o `CartaoDeProjeto` lança erro e, sem error boundary, o React desmonta a página inteira (tela em branco, sem `<h1>`). `apps/web/src/api/projetos.ts` só confere que a resposta é uma lista.

Severidade: média.

## Critérios de aceite

- [x] Projeto fora do formato na resposta não apaga a página: a seção Projetos mostra a mensagem amigável (ou ignora o item inválido) e o resto da página continua visível
- [x] Erros de renderização na seção Projetos ficam contidos nela (error boundary ou validação da resposta)
- [x] O `it.fails` do BUG-1 em `apps/web/src/App.test.tsx` vira teste normal e passa
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
Resumo: Duas proteções. (1) Causa: `buscarProjetos` confere cada item com a nova `ehProjeto` (`apps/web/src/api/formato-do-projeto.ts`): campos obrigatórios com o tipo certo, opcionais conferidos (inclusive `github`), links (`repositorio`, `demo`) só http(s) porque viram `href` (recusa `javascript:`), campos a mais aceitos. Um item inválido recusa a resposta inteira e a seção mostra a mensagem de erro já existente (coerente com o comentário de `projetos.ts`). (2) Contenção: novo `LimiteDeErro` (error boundary de classe, sem dependência nova) envolve a lista de cards; erro ao desenhar um card tira os cards e o aviso `role="status"` passa a mostrar a mensagem de erro. O `it.fails` do BUG-1 em `App.test.tsx` virou teste normal e mais rigoroso. O limite também segura o BUG-2 na página, mas o card ainda quebra (fica com a T-019; `it.fails` dela inalterado); `ehProjeto` não valida a data de propósito. 14 cenários novos: `formato-do-projeto.test.ts` (5), `projetos.test.ts` (+1), `LimiteDeErro.test.tsx` (3), `Projetos.test.tsx` (+2), `App.test.tsx` (1 convertido + 1). Resultados: shared 5, API 227 + 4 esperadas, web 166 + 2 esperadas + 3 falhas do nome (`pt-BR.ts` do George, T-015), hooks 412; lint, build e validador OK. Sem CSS/layout.
Arquivos alterados:
- `apps/web/src/api/formato-do-projeto.ts`, `formato-do-projeto.test.ts` (novos); `projetos.ts`, `projetos.test.ts`
- `apps/web/src/componentes/LimiteDeErro/LimiteDeErro.tsx`, `LimiteDeErro.test.tsx` (novos)
- `apps/web/src/componentes/Projetos/Projetos.tsx`, `Projetos.test.tsx`; `apps/web/src/App.test.tsx`
Pendências:
1. As 3 falhas do web vêm do `pt-BR.ts` do George (T-015): `index.html:6`, `Cabecalho.test.tsx:21`, `Rodape.test.tsx:11`.
2. e2e do cenário com o qa, se necessário.
3. Validação do front (`ehProjeto`) e da API (`validar-projetos-curados.ts`) são parecidas mas com propósitos diferentes; unificar em `packages/shared` exigiria código em tempo de execução no pacote (hoje só tipos).
Decisão pendente: nenhuma
Conceitos para estudo: error boundary (`getDerivedStateFromError`, `componentDidCatch`); type guard e validação de `unknown`; tipos somem em tempo de execução; defesa em profundidade; `href` com `javascript:` e allowlist de esquemas; região viva para erros.
Commit: `fix(web): impede que projeto fora do formato derrube a página`

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: Resolve o BUG-1 com defesa em profundidade: `ehProjeto` confere cada item (links só http(s)) e o `LimiteDeErro` contém erros de renderização na seção Projetos. `it.fails` do BUG-1 convertido e mais rigoroso; 14 cenários de comportamento. O front aceita tudo que a API aceita (regex da API mais rígida), então não recusa resposta válida. Web 166 + 2 esperadas + 3 falhas do nome (`pt-BR.ts` do George, T-015); lint, tsc e validador verdes. Código só em `apps/web/**`; sem segredos.
Arquivos alterados: nenhum
Pendências:
1. *(para a T-019)* `App.test.tsx` ("um erro ao desenhar um card fica contido…") e `Projetos.test.tsx` ("quando um card lança erro ao desenhar…") usam o BUG-2 para provocar o erro; quando a T-019 corrigir o card, trocar a forma de provocar (ex.: `vi.mock` do `CartaoDeProjeto`). → anotado na T-019.
2. *(opcional)* Unificar as validações do front e da API em `packages/shared` exigiria código em tempo de execução no pacote (decisão do George, tarefa futura).
Decisão pendente: nenhuma
Conceitos para estudo: error boundary; type guard sobre `unknown`; defesa em profundidade; allowlist de esquemas em `href`; acoplamento de teste a bug conhecido.

## QA

### Rodada 1

Resultado: PASSOU
Resumo: 5 cenários e2e em `e2e/testes/projetos.spec.ts` ("Projetos: projeto fora do formato na resposta (T-018)", celular e desktop): item sem `stacks`, `stacks` em texto, link `javascript:`, `github` fora do formato — o aviso `role="status"` mostra `ptBR.projetos.erro` uma vez, sem cards, `h2` de Projetos, conteúdo estático e 6 seções de pé, sem rolagem horizontal, sem link `javascript:`, sem `pageerror`, erro no console ou diálogo; e erro ao desenhar um card simulado com `addInitScript` (`Intl.NumberFormat.prototype.format` lança para um número marcado; independe do BUG-2), contido em Projetos, com o menu ainda funcionando. Os 6 falham contra o código da `main` (mutação manual) e passam com a correção; estáveis com `--repeat-each=5` (60/60). `seguranca.spec.ts` reescrito para o novo comportamento: endereço não http(s) da API (`javascript:`, `JAVASCRIPT:`, espaço antes, `data:`) não vira link nem roda. Container Linux (DejaVu, `pt-BR.ts` do HEAD): e2e 294 passaram, 12 pulados; shared 5, API 227 + 4, web 169 + 2, hooks 412; lint, build e validador OK.
Arquivos alterados:
- `e2e/testes/projetos.spec.ts`, `e2e/testes/seguranca.spec.ts`
Pendências:
1. *(T-027)* erro de tipo já existente em `e2e/testes/projetos.spec.ts:238`.
2. *(informativo)* no cenário 5 o `console.error` do React ao segurar o erro aparece repetido no log `[WebServer]` (ruído).
Decisão pendente: nenhuma
Conceitos para estudo: `page.addInitScript` para injetar falha; mutação manual; `pageerror` × `console.error` × erro segurado por error boundary; allowlist de esquemas em `href`.

## Estudo

### Diário de estudo (documentador)

Resultado: CONCLUIDO
Resumo: Diário `docs/04-estudos/tarefas/T-018.md` (`consolidado: false`) sobre as duas proteções da tarefa (`ehProjeto` conferindo cada projeto da resposta; `LimiteDeErro` contendo erros de desenho na seção Projetos), com 11 conceitos (nomes reaproveitados de diários anteriores; novos: `esquemas-permitidos-em-href` e `injetar-falha-no-navegador-com-addinitscript`) e 2 exercícios (allowlist × blocklist em `href`; tirar uma camada de proteção por vez). Nenhuma outra nota alterada.
Arquivos alterados:
- `docs/04-estudos/tarefas/T-018.md` (novo)
Pendências: nenhuma
Decisão pendente: nenhuma

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-16 — orquestrador: em-andamento — início no modo agente-faz; dev chamado
- 2026-10-16 — dev: CONCLUIDO — validação da resposta + error boundary na seção Projetos
- 2026-10-16 — code-reviewer: APROVADO — validação + error boundary; aviso para a T-019 anotado
- 2026-10-16 — qa: PASSOU — 5 cenários e2e; suíte verde no container Linux
- 2026-10-16 — orquestrador: concluida — verificação verde (shared 5; API 227 + 4; web 169 + 2; hooks 412; e2e CI=1 294 + 12 pulados; lint; validador), com o `pt-BR.ts` do George em stash durante a verificação; Linux comprovado pelo qa; CI da main acompanhado após o push; diário de estudo disparado após a integração
- 2026-10-16 — documentador: CONCLUIDO — diário integrado
