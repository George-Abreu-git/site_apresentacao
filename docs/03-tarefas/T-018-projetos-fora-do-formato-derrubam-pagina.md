---
id: T-018
titulo: Projeto fora do formato na resposta da API não derruba a página
status: backlog
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

- [ ] Projeto fora do formato na resposta não apaga a página: a seção Projetos mostra a mensagem amigável (ou ignora o item inválido) e o resto da página continua visível
- [ ] Erros de renderização na seção Projetos ficam contidos nela (error boundary ou validação da resposta)
- [ ] O `it.fails` do BUG-1 em `apps/web/src/App.test.tsx` vira teste normal e passa
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
