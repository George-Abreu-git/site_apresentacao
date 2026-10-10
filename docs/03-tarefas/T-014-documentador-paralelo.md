---
id: T-014
titulo: Documentação de estudo em paralelo (diário por tarefa em worktree) e consolidação sob demanda
status: backlog
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

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-10 — tarefa criada
