---
id: T-026
titulo: Cabeçalhos de segurança nas respostas da API
status: em-revisao
modo: agente-faz
tags: [back-end, api]
rodadas: 0
criada: 2026-10-16
---

# T-026 — Cabeçalhos de segurança nas respostas da API

## Descrição

BUG-Q5 da T-016 (segurança), funcionalidade 14. As respostas da API trazem `X-Powered-By: Express` e não trazem `X-Content-Type-Options: nosniff`. Correção com o pacote `helmet`, decidida pelo George ([[docs/02-arquitetura/ADR-0003-cabecalhos-de-seguranca-helmet|ADR-0003]]).

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
- 2026-10-17 — George: usar o pacote `helmet` (dependência nova) — ver [[docs/02-arquitetura/ADR-0003-cabecalhos-de-seguranca-helmet|ADR-0003]].

## Dev

### Rodada 1

Resultado: CONCLUIDO
Resumo: Instalei o `helmet` (ADR-0003) como dependência de produção de `apps/api` e liguei com `app.use(helmet())` em `criarApp()`, antes do prefixo global; vale para toda resposta, inclusive 404 e 400 do Nest. Escrevi 5 cenários unitários em `criar-app.spec.ts` (TDD: 4 falharam antes, todos passam depois). Os 2 `it.fails` do BUG-Q5 em `apps/api/test/health.e2e-spec.ts` agora "passam inesperadamente" (correção confirmada); não editei porque é área do qa. Lint, build e validador passaram; fora esses 2, a suíte passou toda.
Arquivos alterados: apps/api/package.json, apps/api/src/criar-app.ts, apps/api/src/criar-app.spec.ts, package-lock.json (gerado pelo npm install; só entradas do helmet)
Pendências:
1. qa: converter em testes normais os 2 `it.fails` do BUG-Q5 em `apps/api/test/health.e2e-spec.ts` ("sem X-Powered-By" e "nosniff") — critério 3 e parte do 5.
2. Para a T-013 (CORS/deploy): o `helmet` também envia `Cross-Origin-Resource-Policy: same-origin` e um `Content-Security-Policy` padrão; pela especificação do Fetch o CORP não bloqueia `fetch` em modo CORS, mas vale confirmar no e2e quando o CORS for ligado (consequência já prevista na ADR-0003).
3. O `npm install` mostrou aviso de `npm audit`; fica para o devops conferir.
Decisão pendente: nenhuma
Conceitos para estudo: cabeçalhos HTTP de segurança (X-Content-Type-Options/MIME sniffing, X-Powered-By e fingerprinting, X-Frame-Options/clickjacking, CORP e CSP); middleware no Express/Nest (`app.use`) e ordem de registro; pacote helmet; TDD com Supertest em teste unitário da fábrica da app; `it.fails` do Vitest

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-27 — orquestrador: em-andamento — branch feat/T-026-cabecalhos-de-seguranca-api; dev chamado
- 2026-10-27 — dev: CONCLUIDO — helmet ligado em criarApp(); 5 cenários unitários; it.fails do BUG-Q5 ficam para o qa
- 2026-10-27 — orquestrador: em-revisao — code-reviewer chamado
