---
id: T-020
titulo: Projetos com o mesmo título não geram chave duplicada no React
status: em-andamento
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

- [ ] Dois projetos com o mesmo título não geram aviso de chave duplicada nem cards trocados
- [ ] A validação do arquivo curado (`validar-projetos-curados.ts`) recusa títulos repetidos, com mensagem clara que identifica os projetos (decisão do George: corrigir na API)
- [ ] O `it.fails` do BUG-3 em `Projetos.test.tsx` vira teste normal e passa
- [ ] 5 cenários de teste para a mudança (unitário, rota e/ou e2e, conforme a área), seguindo o padrão do George
- [ ] Suíte inteira e validador verdes

## Contexto relevante

- Origem: [[docs/03-tarefas/T-016-pente-fino-de-testes|T-016]] (pente-fino de testes)
- [[docs/01-requisitos/requisitos|Requisitos]]

## Decisões

- 2026-10-16 — George: bugs e erros do pente-fino viram tarefas, em modo `agente-faz` (pedido de 2026-10-15).
- 2026-10-17 — George: corrigir **na API** — a validação do arquivo curado recusa títulos repetidos (a API não sobe com erro claro); o front segue usando o título como `key`.

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-17 — orquestrador: em-andamento — início no modo agente-faz; dev chamado (parte da API; critério 3 levado ao George)
