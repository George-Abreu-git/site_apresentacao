---
id: T-027
titulo: Checagem de tipos dos testes de ponta a ponta (pasta e2e/)
status: backlog
modo: agente-faz
tags: [infra]
rodadas: 0
criada: 2026-10-16
---

# T-027 — Checagem de tipos dos testes de ponta a ponta (pasta e2e/)

## Descrição

Erro achado pelo qa na T-016: `e2e/testes/projetos.spec.ts:238` tem um erro de tipo (`Promise<Disposable>` no lugar de `Promise<void>`) que ninguém acusa, porque nenhum `tsc` confere a pasta `e2e/` (nem localmente nem no CI).

Severidade: baixa.

## Critérios de aceite

- [ ] Existe um `tsconfig` para `e2e/` e um comando que checa os tipos dos testes de ponta a ponta
- [ ] O CI roda essa checagem
- [ ] O erro de `e2e/testes/projetos.spec.ts:238` está corrigido (pelo qa, dono de `e2e/**`) e a checagem fica verde
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
