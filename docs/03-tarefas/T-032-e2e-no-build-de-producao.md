---
id: T-032
titulo: e2e também contra o build de produção (vite preview)
status: backlog
modo: agente-faz
tags: [infra]
rodadas: 0
criada: 2026-10-17
---

# T-032 — e2e também contra o build de produção (vite preview)

## Descrição

Achado do qa na T-023. A suíte e2e só roda contra o servidor de desenvolvimento do Vite; o build de produção (`vite preview`) foi validado fora do repositório (config de apoio do dev em `scratchpad/t029/t023/preview.config.ts`). Ligar isso exige config ou projeto novo do Playwright e script na raiz (área do devops). Ao ligar, dois testes que pressupõem o servidor de desenvolvimento precisam se adaptar ao build minificado (área do qa): `e2e/testes/seguranca.spec.ts:54` (espera mais de 5 módulos JS; o build entrega 3) e `e2e/testes/projetos.spec.ts:322` (procura o nome `LimiteDeErro` na pilha de erro, que o build minificado troca).

Severidade: baixa.

## Critérios de aceite

- [ ] Existe um jeito de rodar a suíte e2e contra o build de produção (config ou projeto do Playwright e script na raiz), documentado
- [ ] O CI roda a suíte também contra o build de produção (ou ao menos os testes de navegação e de layout), sem deixar o CI muito mais lento
- [ ] `seguranca.spec.ts:54` e `projetos.spec.ts:322` passam nos dois modos, sem perder o que provam (ajuste do qa)
- [ ] 5 cenários de teste para a mudança, seguindo o padrão do George, estáveis e independentes de fonte (prova no container Linux com a DejaVu Sans)
- [ ] Suíte inteira e validador verdes

## Contexto relevante

- Origem: [[docs/03-tarefas/T-023-ancora-na-primeira-visita|T-023]] (achado do qa)
- [[docs/01-requisitos/requisitos|Requisitos]]

## Decisões

- 2026-10-17 — George: bugs e erros encontrados viram tarefas, em modo `agente-faz` (pedido de 2026-10-15).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-17 — tarefa criada
