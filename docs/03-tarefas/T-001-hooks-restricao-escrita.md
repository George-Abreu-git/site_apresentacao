---
id: T-001
titulo: Hooks PreToolUse de restrição de escrita por agente
status: backlog
modo: agente-faz
tags: [infra, orquestracao]
rodadas: 0
criada: 2026-10-09
---

# T-001 — Hooks PreToolUse de restrição de escrita por agente

## Descrição

Hoje a regra "cada agente só altera a sua área" é garantida por instrução e pela checagem do code-reviewer.
Esta tarefa cria hooks `PreToolUse` no Claude Code que bloqueiam Edit/Write fora das pastas permitidas para cada agente.
**Depende da ADR de stack** (as pastas de código, testes e infra precisam existir), que por sua vez depende do levantamento de requisitos: a ordem é levantamento → ADR → T-001.
Hooks em `Edit|Write` não impedem escrita via `Bash` (`echo > arquivo`, `sed -i`, `git checkout`), então a tarefa também cobre o `Bash`.

## Critérios de aceite

- [ ] Um hook bloqueia Edit/Write do dev fora das pastas de código/teste
- [ ] Um hook bloqueia Edit/Write do qa fora das pastas de teste
- [ ] Um hook bloqueia Edit/Write do instrutor fora de `docs/04-estudos/`
- [ ] Nenhum subagente consegue editar `docs/03-tarefas/`
- [ ] Um hook bloqueia Edit/Write do devops fora da sua área (tabela "Áreas por caminho" do `AGENTS.md`): nunca `src/**`, `docs/03-tarefas/**` nem `docs/04-estudos/**`
- [ ] O code-reviewer não consegue usar Edit/Write; o `Bash` dele fica restrito a leitura (`git diff`, `git log`, `git show`, `git status`) e a rodar testes/lint
- [ ] **Escrita via `Bash`:** um hook com matcher `Bash` bloqueia comandos que escrevem em caminhos protegidos (redirecionamento `>`/`>>`, `tee`, `sed -i`, `mv`, `cp`, `rm`, `git checkout`/`restore`/`reset`...) em `docs/03-tarefas/**` e fora da área de cada agente. Se a análise de comandos se mostrar inviável, a alternativa é retirar o `Bash` do qa e do code-reviewer; a escolha é do George (`apresentar-decisao`)
- [ ] **Identificação do subagente:** verificado se o payload do hook informa qual subagente está agindo (ex.: campos de identificação do agente no JSON de entrada); se não informar, definida uma alternativa (decisão do George) antes de implementar os demais hooks
- [ ] **Definição dos agentes protegida:** nenhum subagente (devops incluso) altera `.claude/agents/**` sem aprovação explícita do George; o hook bloqueia (ou pede confirmação) e há um teste com caso bloqueado e um permitido
- [ ] Testes demonstrando um caso bloqueado e um permitido por agente (dev, qa, instrutor, devops e code-reviewer), tanto para Edit/Write quanto para `Bash`

## Contexto relevante

- [[docs/02-arquitetura/specs/2026-10-09-orquestracao-agentes-design|Spec da orquestração]] (decisão "Restrição de escrita por agente")

## Decisões

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-09 — tarefa criada
