---
id: T-026
titulo: Cabeçalhos de segurança nas respostas da API
status: backlog
modo: agente-faz
tags: [back-end, api]
rodadas: 0
criada: 2026-10-16
---

# T-026 — Cabeçalhos de segurança nas respostas da API

## Descrição

BUG-Q5 da T-016 (segurança), funcionalidade 14. As respostas da API trazem `X-Powered-By: Express` e não trazem `X-Content-Type-Options: nosniff`. Corrigir com o pacote `helmet` é dependência nova (decisão do George, nova ADR se for o caso); a alternativa é ajustar o Express à mão. A forma é apresentada ao George na execução.

Severidade: baixa.

## Critérios de aceite

- [ ] Nenhuma resposta da API traz `X-Powered-By`
- [ ] Toda resposta da API traz `X-Content-Type-Options: nosniff`
- [ ] Os `it.fails` do BUG-Q5 em `apps/api/test/health.e2e-spec.ts` viram testes normais e passam
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
