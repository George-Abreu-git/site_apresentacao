---
id: T-020
titulo: Projetos com o mesmo título não geram chave duplicada no React
status: concluida
modo: agente-faz
tags: [front-end, back-end]
rodadas: 0
criada: 2026-10-16
---

# T-020 — Projetos com o mesmo título não geram chave duplicada no React

## Descrição

BUG-3 da T-016, funcionalidades 5 e 6. `Projetos.tsx` usa `key={projeto.titulo}` e a validação do arquivo curado não recusa títulos repetidos; o React avisa "Encountered two children with the same key" e pode trocar ou repetir cards. Onde corrigir (chave única no front ou recusar títulos repetidos na API) é decisão do George, a apresentar na execução.

Severidade: baixa.

## Critérios de aceite

- [x] Dois projetos com o mesmo título não geram aviso de chave duplicada nem cards trocados
- [x] A validação do arquivo curado (`validar-projetos-curados.ts`) recusa títulos repetidos, com mensagem clara que identifica os projetos (decisão do George: corrigir na API)
- [x] O `it.fails` do BUG-3 em `Projetos.test.tsx` continua como bug conhecido do front, com o comentário apontando para a validação na API que impede títulos repetidos (decisão do George, 2026-10-17)
- [x] 5 cenários de teste para a mudança (unitário, rota e/ou e2e, conforme a área), seguindo o padrão do George
- [x] Suíte inteira e validador verdes

## Contexto relevante

- Origem: [[docs/03-tarefas/T-016-pente-fino-de-testes|T-016]] (pente-fino de testes)
- [[docs/01-requisitos/requisitos|Requisitos]]

## Decisões

- 2026-10-16 — George: bugs e erros do pente-fino viram tarefas, em modo `agente-faz` (pedido de 2026-10-15).
- 2026-10-17 — George: corrigir **na API** — a validação do arquivo curado recusa títulos repetidos (a API não sobe com erro claro); o front segue usando o título como `key`.
- 2026-10-17 — George (critério 3): opção A — manter o `it.fails` do front, com o comentário apontando para a validação na API; critério 3 reescrito. Opções avaliadas: A) manter o `it.fails` e reescrever o critério; B) mudar também a `key` no front; C) apagar o `it.fails` e cobrir só na API.

## Dev

### Rodada 1

Resultado: CONCLUIDO
Resumo: A validação do arquivo curado recusa títulos repetidos com `problemasDeTitulosRepetidos`, que compara a forma normalizada (`tituloParaComparar`: sem espaços nas pontas, espaços do meio juntados, minúsculas pt-BR) e gera, na mesma mensagem dos outros problemas, uma linha por repetição: `projeto N ("título"): título repetido — o mesmo do projeto M ("título"); cada projeto precisa de um título único`. Itens sem título válido ou que não são objeto ficam fora da comparação. 9 testes unitários novos e 1 de leitura de arquivo; o teste antigo de numeração passou a usar títulos distintos, com as mesmas asserções. README do conteúdo documenta a regra; o `projetos.json` real é válido. Complemento (critério 3, opção A do George): só o comentário do `it.fails` do BUG-3 em `Projetos.test.tsx` mudou, apontando para o contrato da API. API 260 + 3 esperadas; web 186 + 1 esperada + 3 falhas do `pt-BR.ts` do George; lint verde.
Arquivos alterados:
- apps/api/src/projetos/validar-projetos-curados.ts
- apps/api/src/projetos/validar-projetos-curados.spec.ts
- apps/api/src/projetos/ler-projetos-curados.spec.ts
- apps/api/conteudo/README.md
- apps/web/src/componentes/Projetos/Projetos.test.tsx (só o comentário)
Pendências:
1. Teste de rota para título repetido, se o qa achar útil (área do qa).
2. A comparação ignora espaços e maiúsculas/minúsculas (escolha do dev, justificada: para o visitante seriam cards com o mesmo nome); comparar só textos idênticos é mudança de uma linha em `tituloParaComparar`.
Decisão pendente: nenhuma
Conceitos para estudo: validação em tempo de execução de dados `unknown`; normalização de texto (`trim`, `\s+`, `toLocaleLowerCase`); `Map` para achar duplicatas numa passada; `key` de listas no React; fail fast na inicialização; contrato entre front e API; `it.fails` como registro de bug conhecido.

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: O diff atende aos 5 critérios: a API recusa títulos repetidos com mensagem que identifica os dois projetos (número e título), na mesma lista dos outros problemas; o `it.fails` do BUG-3 ficou, só com o comentário novo (opção A). 10 cenários novos (9 unitários e 1 de leitura de arquivo); o teste antigo de numeração manteve as asserções. Normalização razoável, documentada (README e JSDoc) e testada. Área do dev, sem segredos. API 260 + 3 esperadas; web 186 + 1 esperada + 3 do `pt-BR.ts` do George; lint e validador verdes.
Arquivos alterados: nenhum
Pendências:
1. *opcional* — avisar o George que a comparação ignora espaços nas pontas, espaços a mais no meio e maiúsculas/minúsculas (um pouco mais rígido que "título idêntico"); para mudar, uma linha em `tituloParaComparar` (`apps/api/src/projetos/validar-projetos-curados.ts:130`).
2. *opcional* — teste de rota para título repetido, a critério do qa.
Decisão pendente: nenhuma
Conceitos para estudo: validação de dados `unknown`; normalização de texto para comparação; `Map` para duplicatas; fail fast; contrato entre front e API; `it.fails` como bug conhecido; teste que olha a saída em vez da implementação.

## QA

### Rodada 1

Resultado: PASSOU
Resumo: Critérios atendidos. 5 cenários de rota (7 testes) em `apps/api/test/projetos.e2e-spec.ts`: com título repetido (idêntico, espaços, caixa) a API não sobe e o erro traz o arquivo e os projetos; títulos parecidos sobem com 200 na ordem do arquivo; a repetição sai na mesma mensagem dos outros erros (4 linhas exatas); o `projetos.json` real não tem repetidos; três iguais apontam para o primeiro. 1 e2e com o conteúdo curado real: um `<h3>` por projeto, sem repetidos e sem erros no console (falha quando o arquivo tem título duplicado). Com o validador do `main`, 5 dos 7 de rota falham (os 2 restantes protegem contra rigor excessivo). No `t029-linux` com o `pt-BR.ts` do HEAD: API 267 + 3 esperadas, web 189 + 1 esperada, lint verde, Playwright 352 passaram e 12 pulados, validador verde.
Arquivos alterados:
- apps/api/test/projetos.e2e-spec.ts
- e2e/testes/projetos.spec.ts
Pendências: nenhuma
Decisão pendente: nenhuma
Conceitos para estudo: teste de inicialização (fail fast) com `Test.createTestingModule` e `overrideProvider`; testes contra rigor excessivo; prova de que o teste falha sem a correção; e2e com dados reais e observação do console; contrato validado na API versus no front.

## Estudo

Resultado: CONCLUIDO
Resumo: Diário em `docs/04-estudos/tarefas/T-020.md` (`consolidado: false`): o BUG-3 (título como `key` dos cards), a correção na API (`problemasDeTitulosRepetidos` com um `Map` do primeiro projeto de cada título; `tituloParaComparar` normalizando), por que o `it.fails` do front ficou (opção A) e o que cobrem os testes unitário, de rota e e2e, inclusive os que barram rigor excessivo. Dois exercícios.
Arquivos alterados:
- docs/04-estudos/tarefas/T-020.md
Pendências:
1. Três nomes para o mesmo conceito nas notas de estudo: `chave-key-no-react` (T-016), `key-estavel-em-listas-react` (T-009) e `key-em-listas-do-react` (T-012); a consolidação escolhe um.
2. Conceitos novos sem nota: `normalizacao-de-texto-para-comparacao`, `map-para-achar-duplicatas`, `contrato-entre-front-e-api`.
Decisão pendente: nenhuma

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-17 — orquestrador: em-andamento — início no modo agente-faz; dev chamado (parte da API; critério 3 levado ao George)
- 2026-10-17 — George: critério 3 decidido (opção A, manter o `it.fails` do front)
- 2026-10-17 — dev: CONCLUIDO — API recusa títulos repetidos; comentário do BUG-3 aponta para a API
- 2026-10-17 — code-reviewer: APROVADO — critérios atendidos; normalização avisada ao George
- 2026-10-17 — qa: PASSOU — rota e e2e cobrem títulos repetidos; suíte e2e verde no container Linux
- 2026-10-17 — orquestrador: concluida — verificação verde (unitários, lint, validador, e2e 352 + 12 pulados); merge em main
- 2026-10-17 — documentador: CONCLUIDO — diário integrado
