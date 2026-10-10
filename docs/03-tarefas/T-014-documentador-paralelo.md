---
id: T-014
titulo: Documentação de estudo em paralelo (diário por tarefa em worktree) e consolidação sob demanda
status: em-andamento
modo: agente-faz
tags: [orquestracao]
rodadas: 0
criada: 2026-10-10
---

# T-014 — Documentação de estudo em paralelo (diário por tarefa em worktree) e consolidação sob demanda

## Descrição

Na T-005 o instrutor (modo explicador) levou mais de 350 min na etapa final e travou o encerramento e o início da T-006. Causa: ele é a última etapa do caminho crítico e, a cada tarefa, lê e reescreve notas por conceito existentes (custo crescente e risco de conflito).

Esta tarefa tira a documentação do caminho crítico:
1. A tarefa **fecha logo após o QA** (verificação → `concluida` → merge → push).
2. Em seguida o orquestrador dispara, **em segundo plano e num git worktree isolado** (branch `estudos/T-XXX`, criada a partir da `main` já com a tarefa integrada), um agente que escreve **um único diário** da tarefa em `docs/04-estudos/tarefas/T-XXX.md`.
3. O orquestrador integra a branch de estudos na `main` quando o agente termina, enquanto a próxima tarefa segue em paralelo.
4. As notas por conceito passam a ser geradas sob demanda pelo comando `/estudar-consolidar`.

O modo `eu-faco` não muda: o instrutor continua síncrono como mentor (ele precisa ler o código da branch da tarefa).

## Critérios de aceite

- [ ] **Novo subagente `documentador`** (`.claude/agents/documentador.md`): `background: true`, `isolation: worktree`, `model: inherit`; escreve **somente** `docs/04-estudos/tarefas/T-XXX.md`; lê apenas a nota da tarefa (handoffs) e os arquivos citados nela — **não** lê nem edita outras notas de estudo; termina com `## Handoff`
- [ ] **Template** `docs/_templates/diario-estudo.md`: frontmatter `tipo: diario`, `tarefa`, `data`, `consolidado: false`, `conceitos: []`; seções O que foi feito, Conceitos (curtos, com o porquê), Onde aparece no projeto (caminhos), Exercícios, Links
- [ ] **`orquestrar-tarefa`**: no modo `agente-faz` (e no fechamento do `eu-faco`), o fluxo vira implementador → code-reviewer → qa → **encerramento** → **dispara o documentador em background**; regras para integrar `estudos/T-XXX` na `main` (merge + push) quando ele terminar, sem interromper a tarefa em andamento; se o documentador falhar, registrar no Log e seguir (não bloqueia nada)
- [ ] **`instrutor`**: deixa de ter o modo explicador no fluxo; mantém o modo mentor (`eu-faco`), o `/estudar` e passa a fazer a consolidação
- [ ] **Comando `/estudar-consolidar`**: lê os diários com `consolidado: false`, cria/atualiza notas por conceito em `docs/04-estudos/` (raiz) e marca os diários como `consolidado: true`
- [ ] **`nota-de-estudo`** descreve os dois formatos (diário por tarefa e nota por conceito) e quem escreve cada um
- [ ] **`definition-of-done`**: o item de encerramento vira "diário de estudo disparado" (não exige o diário pronto)
- [ ] **Áreas por caminho** (`AGENTS.md`): documentador → `docs/04-estudos/tarefas/**`; instrutor → `docs/04-estudos/**`
- [ ] As notas por conceito atuais **ficam onde estão** (nenhum link quebra); `docs/04-estudos/README.md` explica os dois formatos e a pasta `tarefas/`
- [ ] Spec e `scripts/validar_estrutura.py` incluem o novo agente, o comando e o template
- [ ] **Prova:** o encerramento desta própria tarefa já usa o fluxo novo — o diário `docs/04-estudos/tarefas/T-014.md` é gerado em background e integrado na `main`

## Contexto relevante

- Depende de: nenhuma (entra antes da [[docs/03-tarefas/T-006-ci-github-actions|T-006]], que está pausada na branch dela)
- Recursos do Claude Code usados: campos `background` e `isolation: worktree` do frontmatter de subagentes
- Notas existentes em `docs/04-estudos/` (permanecem como notas por conceito)

## Decisões

- 2026-10-10 — George (Q1-A): tirar a documentação do caminho crítico; formato **diário por tarefa** + consolidação sob demanda (`/estudar-consolidar`); execução em paralelo num worktree.
- 2026-10-10 — consequência registrada na abertura: o diário fica com um **novo agente** (`documentador`), porque o instrutor em modo mentor precisa ler a branch da tarefa e não pode rodar isolado a partir da `main`. Se o George preferir manter um agente só, o orquestrador apresenta a alternativa (`apresentar-decisao`) antes de implementar.
- 2026-10-10 — orquestrador: as alterações em `.claude/agents/**` desta tarefa (novo `documentador.md`; `instrutor.md` sem o modo explicador) estão **aprovadas pelo George** por constarem explicitamente nos critérios de aceite que ele definiu (decisão Q1-A).

## Dev

## Revisão

## QA

## Estudo

### README de `docs/04-estudos/` (pendência 1 do devops)

**Resultado:** CONCLUIDO — o instrutor substituiu as linhas 3-4 do README por: uma tabela com os dois formatos (onde fica, quem escreve, quando — a mesma da skill `nota-de-estudo`); um item sobre `tarefas/` (um diário por tarefa, template `docs/_templates/diario-estudo.md`, campo `consolidado`); um item sobre a raiz (nota por conceito em kebab-case, criada por `/estudar` ou `/estudar-consolidar`; notas existentes nunca são movidas nem renomeadas). Título, linha do grafo e links mantidos. Base: o resumo do devops na nota e a skill `nota-de-estudo`.

## DevOps

### Rodada 1

**Resultado:** CONCLUIDO — todos os critérios implementados, exceto o README de `docs/04-estudos/` (área do instrutor; texto pronto) e a "Prova" (encerramento, orquestrador). Validador OK; as checagens novas foram testadas numa cópia e pegam `background`/`isolation` errados, comando faltando, diário com `tipo`/`tarefa`/`consolidado` inválidos ou sem seções, template com `consolidado: true`.

**Frontmatter conferido na documentação do Claude Code** (`sub-agents.md`, `worktrees.md`): `background: true` (fica em segundo plano), `isolation: worktree` (worktree temporário em `.claude/worktrees/<nome>/`, branch `worktree-<nome>`), `model: inherit`. Pontos que mudaram o desenho:
1. Com `worktree.baseRef: "fresh"` (padrão), o worktree nasce de `origin/main`, não do `HEAD` → o disparo só acontece **depois do `git push origin main`** (sem push, não disparar; avisar o George).
2. A branch criada é `worktree-<nome>`; na integração o orquestrador roda `git -C "$WT" switch -c estudos/T-XXX` e commita (o documentador não tem Bash).
3. `.claude/worktrees/` entrou no `.gitignore` (recomendação da documentação; evita ruído na conferência de área).
- A sessão vigia `.claude/agents/`, então o `documentador` é reconhecido sem reiniciar. Antes de escrever, ele confere se está em `.claude/worktrees/` e se a nota no worktree está `concluida` (senão `FALHOU`).

**Disparo e integração** (passo a passo na `orquestrar-tarefa`, seção "Diário de estudo em paralelo"): disparo depois do push, só com id, caminho e modo, sem esperar; aprovar só a escrita do diário dentro de `.claude/worktrees/`. Integração com `git -C "$WT"` (sem trocar a branch do checkout principal): conferir que só o diário mudou, `switch -c estudos/T-XXX`, commits do diário e da nota (`## Estudo` + Log), validador, `rebase main` → `merge --ff-only` → `git push origin main`, remover o worktree e apagar as branches com `git merge-base --is-ancestor ... main && git branch -D`. Falha não bloqueia: descartar o worktree e registrar no Log via worktree próprio.

**Arquivos:** `.claude/agents/documentador.md` (novo), `.claude/agents/instrutor.md` (sem modo explicador; ganha a consolidação), `.claude/commands/estudar-consolidar.md` (novo), `estudar.md`, `nova-tarefa.md`, skills `orquestrar-tarefa`, `nota-de-estudo` (dois formatos), `definition-of-done` ("diário de estudo disparado"), `atualizar-tarefa`, `carregar-contexto`, `commit-convencional`, `docs/_templates/diario-estudo.md` (novo), spec, `scripts/validar_estrutura.py`, `AGENTS.md` (estrutura, papéis, áreas), `CLAUDE.md`, `.gitignore`. Nenhuma nota por conceito movida ou renomeada. Na spec, "sem `src/`" virou "sem `apps/`".

**Pendências:**
1. `docs/04-estudos/README.md` (área do instrutor) — texto proposto pelo devops para as linhas 3-4, explicando o diário por tarefa (`tarefas/T-XXX.md`, documentador) e a nota por conceito (instrutor, `/estudar` e `/estudar-consolidar`).
2. `.claude/agents/devops.md` com dois trechos desatualizados (linha 18: "code-reviewer → qa → instrutor" → "→ encerramento (documentador)"; linha 26: `docs/04-estudos/**` "do instrutor" → "do instrutor e do documentador"); exige aprovação do George.
3. Leitura do devops: a branch `estudos/T-XXX` entra na `main` só com o validador (sem a suíte), porque só altera Markdown e o worktree não tem `node_modules`.

## Log

- 2026-10-10 — tarefa criada
- 2026-10-10 — orquestrador: início — implementador devops (tag `orquestracao`)
- 2026-10-10 — devops: CONCLUIDO — documentador, template, `/estudar-consolidar`, fluxo novo na `orquestrar-tarefa`, áreas e validador; README de estudos e `devops.md` pendentes
- 2026-10-10 — instrutor: CONCLUIDO — README de `docs/04-estudos/` explica os dois formatos e a pasta `tarefas/`
- 2026-10-10 — orquestrador: Q1 (`devops.md`) e Q2 (verificação da branch de estudos) apresentadas ao George; revisão aguarda a resposta
