---
id: T-021
titulo: Arquivo curado salvo em UTF-8 com BOM é lido normalmente
status: em-andamento
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

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-17 — orquestrador: em-andamento — início no modo agente-faz; dev chamado
