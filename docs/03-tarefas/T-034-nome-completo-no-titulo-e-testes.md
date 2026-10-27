---
id: T-034
titulo: Nome completo do George no título da aba e nos testes do cabeçalho e do rodapé
status: concluida
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-27
---

# T-034 — Nome completo do George no título da aba e nos testes do cabeçalho e do rodapé

## Descrição

O commit `8f638a2` (`feat(conteudo): usa o nome completo do George`) trocou `pessoa.nome` em `apps/web/src/conteudo/pt-BR.ts` de "George Siqueira" para "George Abreu de Siqueira", mas deixou pendentes o `<title>` de `apps/web/index.html` e os testes do Cabecalho e do Rodape, que ainda esperam "George Siqueira". Resultado: 3 testes unitários vermelhos no `apps/web` (`npm test`):

- `src/conteudo/conteudo.test.tsx` — o título da aba (index.html) é o nome do arquivo de conteúdo;
- `src/componentes/Cabecalho/Cabecalho.test.tsx` — tem o nome do George como link de volta ao início;
- `src/componentes/Rodape/Rodape.test.tsx` — é o rodapé da página (contentinfo) com o nome do George e o ano atual.

O e2e (`npm run test:e2e`) já passa: o `texto-ampliado.spec.ts` usa nomes de teste fixos (`NOME_CURTO`, `NOME_LONGO`), independentes do nome real.

## Critérios de aceite

- [ ] O `<title>` de `apps/web/index.html` é igual a `ptBR.pessoa.nome` ("George Abreu de Siqueira").
- [ ] Os testes do Cabecalho e do Rodape leem o nome de `ptBR.pessoa.nome` em vez de texto fixo, para não quebrarem na próxima troca de nome.
- [ ] `npm test` e `npm run test:e2e` verdes na raiz.
- [ ] `npm run lint` e `python3 scripts/validar_estrutura.py` verdes.

## Contexto relevante

- Commit `8f638a2` (mensagem lista as pendências).
- RF-09 (textos separados do código) — `apps/web/src/conteudo/`.

## Decisões

- 2026-10-27 — George: critérios de aceite como propostos (testes leem `ptBR.pessoa.nome`), modo `agente-faz`, tag `front-end`.

## Dev

### Rodada 1

Resultado: CONCLUIDO
Resumo: O `<title>` de `apps/web/index.html` agora é "George Abreu de Siqueira". Os testes do Cabeçalho e do Rodapé leem `conteudo.pessoa.nome` (o mesmo objeto que `ptBR`, pelo ponto único `apps/web/src/conteudo/index.ts`) em vez do nome escrito à mão. Pela ordem do TDD, primeiro troquei os testes e só o do título continuou falhando; depois corrigi o HTML. `npm test`, `npm run test:e2e`, `npm run lint` e `python3 scripts/validar_estrutura.py` passam.
Arquivos alterados: apps/web/index.html; apps/web/src/componentes/Cabecalho/Cabecalho.test.tsx; apps/web/src/componentes/Rodape/Rodape.test.tsx
Pendências: nenhuma
Decisão pendente: nenhuma
Conceitos para estudo: fonte única da verdade em testes (o teste lê o dado do mesmo lugar que o componente, sem copiar o texto); consultas por papel e nome acessível no Testing Library (`getByRole('link', { name })`); `index.html` estático do Vite (o `<title>` não vem do React, por isso há um teste que compara os dois)

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: O diff cumpre os critérios de aceite: o `<title>` passou a "George Abreu de Siqueira" e os testes do Cabecalho e do Rodape leem `conteudo.pessoa.nome` (o mesmo objeto que `ptBR`), em vez de texto fixo. Testes unitários do web (189 passaram, mais 1 falha esperada) e dos hooks verdes; lint verde. O dev ficou dentro da área dele (`apps/web/**`) e não há escopo extra nem segredos.
Arquivos alterados: nenhum
Pendências: 1. *opcional*: os comentários do `e2e/testes/texto-ampliado.spec.ts` (linhas 12, 492 e 503) citam "George Siqueira" porque explicam as medidas feitas com `NOME_CURTO`; estão corretos e não precisam mudar nesta tarefa.
Decisão pendente: nenhuma
Conceitos para estudo: fonte única da verdade em testes; consultas por papel e nome acessível no Testing Library; `index.html` estático do Vite e o teste que confere se ele bate com o conteúdo

## QA

### Rodada 1

Resultado: PASSOU
Resumo: Todos os critérios de aceite foram atendidos. O `<title>` de `apps/web/index.html` é "George Abreu de Siqueira", igual a `ptBR.pessoa.nome`, e o unitário `conteudo.test.tsx` e o e2e `pagina-inicial.spec.ts:40` (celular e desktop) passam. Os testes do Cabecalho e do Rodape leem `conteudo.pessoa.nome`. `npm test` está verde (web 189 + 1 falha esperada; api 283 + 2 falhas esperadas; shared 5; hooks 412). `npm run test:e2e` está verde: 352 passaram, 12 foram pulados e o único "x" é o bug conhecido da T-029, marcado com `test.fail()`. Lint e validador estão verdes. Não houve mudança visual além do título da aba, e os e2e de responsividade, teclado e texto a 200% continuam passando.
Arquivos alterados: nenhum
Pendências: nenhuma
Decisão pendente: nenhuma
Conceitos para estudo: `test.fail(condição)` no Playwright (falha esperada condicional); `<title>` como nome acessível da página; artefatos de build ignorados pelo git (`dist/`)

## Estudo

## DevOps

## Log

- 2026-10-27 — tarefa criada
- 2026-10-27 — orquestrador: em-andamento — branch feat/T-034-nome-completo-no-titulo-e-testes; dev chamado
- 2026-10-27 — dev: CONCLUIDO — título da aba com o nome completo; testes do Cabecalho e do Rodape leem conteudo.pessoa.nome
- 2026-10-27 — orquestrador: em-revisao — code-reviewer chamado
- 2026-10-27 — code-reviewer: APROVADO — critérios atendidos, dentro da área, sem escopo extra
- 2026-10-27 — orquestrador: em-qa — qa chamado
- 2026-10-27 — qa: PASSOU — 4 critérios atendidos; npm test, e2e, lint e validador verdes
- 2026-10-27 — orquestrador: concluida — verificação verde; diário de estudo disparado após a integração
