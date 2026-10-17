---
id: T-021
titulo: Arquivo curado salvo em UTF-8 com BOM é lido normalmente
status: concluida
modo: agente-faz
tags: [back-end, api]
rodadas: 0
criada: 2026-10-16
---

# T-021 — Arquivo curado salvo em UTF-8 com BOM é lido normalmente

## Descrição

BUG-4 da T-016, funcionalidade 6. `projetos.json` salvo com BOM (comum em editores do Windows) impede a API de subir: `readFileSync` mantém o BOM e o `JSON.parse` falha ("não é um JSON válido").

Severidade: baixa.

## Critérios de aceite

- [x] `projetos.json` com BOM é lido normalmente e a API sobe
- [x] Arquivo sem BOM continua funcionando igual
- [x] O `it.fails` do BUG-4 em `ler-projetos-curados.spec.ts` vira teste normal e passa
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
Resumo: `lerProjetosCurados` remove um único BOM (U+FEFF) do início do texto antes do `JSON.parse`, numa função pequena (`removerBomInicial`), dentro do `try` (erros de JSON continuam apontando o arquivo). Não usa `trim()`, para preservar U+FEFF e espaços no conteúdo. O `it.fails` do BUG-4 virou teste normal com a mesma asserção; 7 cenários novos (com e sem BOM iguais, acentos e aspas, U+FEFF interno preservado, só BOM, BOM + espaços, BOM + JSON inválido com o caminho, dois BOMs). README do conteúdo: UTF-8, com ou sem BOM. API 275 passando; lint e tsc verdes.
Arquivos alterados:
- apps/api/src/projetos/ler-projetos-curados.ts
- apps/api/src/projetos/ler-projetos-curados.spec.ts
- apps/api/conteudo/README.md
Pendências:
1. Web com as 3 falhas locais do `pt-BR.ts` do George; validador com o orquestrador.
2. Teste de rota com arquivo com BOM, a critério do qa.
Decisão pendente: nenhuma
Conceitos para estudo: BOM (U+FEFF) e UTF-8; `readFileSync` com 'utf8' não remove o BOM; por que `trim()` também remove U+FEFF; TDD; `it.fails`; escapes Unicode em strings JS.

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: `removerBomInicial` tira um único U+FEFF do início antes do `JSON.parse`, dentro do `try` (erros de JSON seguem com o caminho do arquivo); sem `trim()`, preservando U+FEFF e espaços no conteúdo. O `it.fails` do BUG-4 virou `it` com a mesma asserção; 8 cenários (normal, igualdade com e sem BOM, só BOM, BOM + espaços, dois BOMs, erros). Área do dev; sem segredos. API 275 + 2 esperadas (de outros bugs); web com só as 3 falhas do `pt-BR.ts` do George; lint e validador verdes.
Arquivos alterados: nenhum
Pendências:
1. *opcional* — o teste "só o BOM e espaços" poderia também conferir o caminho na mensagem, como os vizinhos.
2. qa: teste de rota com `projetos.json` com BOM, confirmando que a API sobe.
Decisão pendente: nenhuma
Conceitos para estudo: BOM em UTF-8; `readFileSync` não remove o BOM; `trim()` e U+FEFF; remover só no início (`startsWith` + `slice`); `it.fails` que vira teste normal.

## QA

### Rodada 1

Resultado: PASSOU
Resumo: 5 cenários de rota em `apps/api/test/projetos.e2e-spec.ts` (bytes `EF BB BF` gravados no disco): com BOM sobe e responde igual ao arquivo sem BOM (inclusive o campo `github`); acentos, aspas e emoji intactos, sem U+FEFF no corpo; o `projetos.json` real regravado com BOM responde igual ao original; só BOM, BOM + espaços, BOM + JSON inválido e dois BOMs não sobem e o erro traz o caminho; BOM + título repetido continua recusado pela validação da T-020. Com o código do `main`, os cenários 1, 2, 3 e 5 falham; com uma correção ampla demais (`trimStart()`), o 4 falha. No `t029-linux` com o `pt-BR.ts` do HEAD: API 283 + 2 esperadas, web 189 + 1 esperada, lint e tsc verdes, e2e 352 passaram e 12 pulados; validador verde. Sem e2e novo: não há mudança de interface e o cenário 3 cobre o arquivo real.
Arquivos alterados:
- apps/api/test/projetos.e2e-spec.ts
Pendências:
1. *opcional* — o unitário "só o BOM e espaços" poderia conferir o caminho (o cenário de rota 4 já confere).
Decisão pendente: nenhuma
Conceitos para estudo: BOM como bytes EF BB BF e como U+FEFF; teste de rota com arquivo temporário e `overrideProvider`; provar que o teste pega o bug; testes contra correção ampla demais; comparar respostas em vez de fixar o valor esperado.

## Estudo

Resultado: CONCLUIDO
Resumo: Diário em `docs/04-estudos/tarefas/T-021.md` (`consolidado: false`): o BUG-4 (BOM `EF BB BF`/U+FEFF mantido pelo `readFileSync` e recusado pelo `JSON.parse`), a correção com `startsWith`/`slice` no lugar de `trim()`, o `it.fails` que virou teste normal e os testes que pegam tanto o bug quanto uma correção ampla demais (`trimStart()`). Dois exercícios; nomes de conceito da T-020 reaproveitados.
Arquivos alterados:
- docs/04-estudos/tarefas/T-021.md
Pendências: nenhuma
Decisão pendente: nenhuma

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-17 — orquestrador: em-andamento — início no modo agente-faz; dev chamado
- 2026-10-17 — dev: CONCLUIDO — BOM inicial removido antes do JSON.parse
- 2026-10-17 — code-reviewer: APROVADO — BOM inicial removido sem afetar o conteúdo
- 2026-10-17 — qa: PASSOU — rota cobre o arquivo com BOM; suíte e2e verde no container Linux
- 2026-10-17 — orquestrador: concluida — verificação verde (unitários, lint, validador, e2e 352 + 12 pulados); merge em main
- 2026-10-17 — documentador: CONCLUIDO — diário integrado
