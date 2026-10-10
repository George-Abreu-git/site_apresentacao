---
id: T-001
titulo: Hooks PreToolUse de restrição de escrita por agente
status: em-andamento
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
- [ ] **Modo auto:** `.claude/settings.json` com o repositório `github.com/George-Abreu-git/site_apresentacao` marcado como confiável na configuração `autoMode` e regras `deny` para `git push --force`/`-f` e `rm -rf` (decisão do George, 2026-10-10)
- [ ] Testes demonstrando um caso bloqueado e um permitido por agente (dev, qa, instrutor, devops e code-reviewer), tanto para Edit/Write quanto para `Bash`

## Contexto relevante

- [[docs/02-arquitetura/specs/2026-10-09-orquestracao-agentes-design|Spec da orquestração]] (decisão "Restrição de escrita por agente")

## Decisões

- 2026-10-10 — George delegou ao orquestrador as decisões das tarefas T-005, T-006, T-001 e T-007 (ver T-005). As decisões abaixo, inclusive as que os critérios 28 e 29 marcam como "decisão do George", são tomadas pelo orquestrador, marcadas "decidido pelo orquestrador (delegação)" e documentadas com as opções, para revisão do George.
- 2026-10-10 — **D1 — Critérios escritos antes da ADR-0001 e da T-014 (decidido pelo orquestrador, delegação).** Os critérios citam `src/**` e não mencionam o documentador nem o orquestrador.
  - **A) Ler os critérios pela tabela "Áreas por caminho" vigente do `AGENTS.md`** (dev → `apps/**` e `packages/**` exceto `apps/api/test/**`; qa → `e2e/**` e `apps/api/test/**`; instrutor e documentador → `docs/04-estudos/**`; devops → plataforma; ninguém além do orquestrador em `docs/03-tarefas/**`), incluir o documentador (que roda no worktree dele) e garantir que a **sessão principal (orquestrador) não é bloqueada**
    - ✅ Os hooks protegem as regras que valem hoje, não as de 2026-10-09. ✅ Uma fonte única (a tabela) para hooks, conferência de área e revisão. ✅ Não trava o orquestrador nem o documentador, que o fluxo novo depende.
    - ❌ O texto literal dos critérios não muda (fica a nota explicando). ❌ Escopo um pouco maior (documentador). ❌ Os hooks precisam acompanhar futuras mudanças da tabela.
  - **B) Seguir o texto literal (`src/**`, sem documentador)**
    - ✅ Fiel à letra dos critérios. ✅ Escopo menor. ✅ Nenhuma interpretação.
    - ❌ `src/` não existe: o hook do dev bloquearia todo o código real em `apps/**`. ❌ O documentador seria bloqueado ao escrever o diário. ❌ Hooks e `AGENTS.md` ficariam em contradição.
  - **C) Reescrever os critérios antes de começar**
    - ✅ Nota e implementação ficam alinhadas na letra. ✅ Revisão e QA leem critérios exatos. ✅ Sem ambiguidade.
    - ❌ Muda critérios que o George escreveu sem ele estar presente. ❌ Atraso. ❌ O mesmo resultado prático da A.
  - **Escolha: A.** É a única leitura que funciona com o repositório de hoje; o texto original dos critérios fica intacto e esta decisão explica a leitura. O critério 26 ("nunca `src/**`") passa a ser "nunca `apps/**`/`packages/**`/`e2e/**`" (código e testes não são área do devops).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-09 — tarefa criada
- 2026-10-10 — orquestrador: início — implementador devops (tags `infra`, `orquestracao`); D1 (delegação): critérios lidos pela tabela de áreas vigente
