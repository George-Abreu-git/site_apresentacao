---
id: T-021
titulo: Arquivo curado salvo em UTF-8 com BOM é lido normalmente
status: em-revisao
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

- [ ] `projetos.json` com BOM é lido normalmente e a API sobe
- [ ] Arquivo sem BOM continua funcionando igual
- [ ] O `it.fails` do BUG-4 em `ler-projetos-curados.spec.ts` vira teste normal e passa
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

## QA

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-17 — orquestrador: em-andamento — início no modo agente-faz; dev chamado
- 2026-10-17 — dev: CONCLUIDO — BOM inicial removido antes do JSON.parse
