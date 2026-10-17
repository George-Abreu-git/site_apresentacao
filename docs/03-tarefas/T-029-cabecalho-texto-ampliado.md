---
id: T-029
titulo: Cabeçalho e menu não passam da tela com texto ampliado a 200% em 360px
status: backlog
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-16
---

# T-029 — Cabeçalho e menu não passam da tela com texto ampliado a 200% em 360px

## Descrição

O CI da `main` está vermelho desde a T-025: o e2e `e2e/testes/acessibilidade.spec.ts:136` ("360px com o texto ampliado a 200% e textos longos: nada passa da largura da tela") falha no celular e no desktop, inclusive nas 2 novas tentativas. Os elementos que passam da largura são do cabeçalho: `nav`, `button` (Menu) e os `li`/`a` do menu (RNF-01, RNF-02; WCAG 1.4.4 e 1.4.10).

Só falha com fontes mais largas: o runner do GitHub usa **DejaVu Sans** como `sans-serif` padrão. Nos containers sem ela o cabeçalho cabia por pouco. Receita para reproduzir (orquestrador, 2026-10-16): container `ubuntu:24.04` com Node 24, `npm ci`, `npx playwright install --with-deps chromium`, **`apt-get install -y fonts-dejavu-core`** e `CI=true npx playwright test --workers=2` (script de referência em `C:/Users/GEORGE~1.SIQ/AppData/Local/Temp/claude/c--Users-george-siqueira-Documents-Site-Apresenta--o-George/97669f1a-3c8b-4262-b95e-b2e93096f078/scratchpad/ci-linux-2/rodar-dejavu.sh`, fora do repositório). Com a DejaVu, os 2 testes falham como no CI.

Severidade: média (CI vermelho na `main`).

## Critérios de aceite

- [ ] Em 360px com o texto a 200%, nada do cabeçalho (marca, botão Menu, lista do menu aberta ou fechada) passa da largura da tela, com qualquer fonte `sans-serif` do sistema (comprovado com a DejaVu Sans)
- [ ] O menu continua acessível e funcional (abrir/fechar, foco, teclado) no celular e no desktop
- [ ] Nada é cortado ou escondido para caber (sem `overflow: hidden`, reticências ou `nowrap` no texto)
- [ ] O e2e `acessibilidade.spec.ts:136` passa no container Linux com a DejaVu Sans (receita acima) e o CI da `main` volta ao verde após o push
- [ ] 5 cenários de teste para a mudança (unitário e e2e), seguindo o padrão do George
- [ ] Suíte inteira e validador verdes

## Contexto relevante

- Origem: CI de `604ef8c` (fim da T-025), log colado pelo George em 2026-10-16
- [[docs/03-tarefas/T-025-texto-longo-nos-cards|T-025]]
- [[docs/03-tarefas/T-007-layout-base|T-007]] (cabeçalho e menu)

## Decisões

- 2026-10-16 — George: bugs viram tarefas em `agente-faz` (pedido de 2026-10-15); CI vermelho na `main` → corrigir a causa com prioridade, sem enfraquecer testes (decisão A da T-025, aplicada ao mesmo caso).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
