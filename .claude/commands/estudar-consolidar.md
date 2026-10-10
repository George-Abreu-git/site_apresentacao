---
description: Dispara o documentador, em segundo plano e num worktree isolado, para consolidar os diários de estudo pendentes (consolidado false) em notas por conceito.
argument-hint: "[T-XXX ...]"
---

Consolide os diários de estudo pendentes. Argumentos (opcional): $ARGUMENTS — ids de tarefa para consolidar só esses diários; sem argumento, todos os pendentes.

Quem consolida é o subagente `documentador` (uso "Consolidação"). Como o frontmatter dele tem `background: true` e `isolation: worktree`, a consolidação roda **do mesmo jeito que o diário de uma tarefa**: em segundo plano, num worktree criado a partir de `origin/main`, e o resultado entra na `main` pela branch `estudos/consolidacao-AAAA-MM-DD`, com o mesmo procedimento da branch de estudos (seção "Consolidação" da skill `orquestrar-tarefa`). Por isso pode rodar com uma tarefa em andamento: o checkout principal não troca de branch.

## Disparo
1. Liste os diários pendentes **na `main`** (o checkout pode estar na branch de outra tarefa): `git grep -l "^consolidado: false" main -- docs/04-estudos/tarefas/` (filtre pelos ids, se houver). Nenhum → avise o George e pare.
2. **Pré-condição: a `main` local não tem commits sem push** (`git log origin/main..main` vazio). O worktree nasce de `origin/main`; sem o push ele não veria os diários. Sem push (ex.: Cowork) → não dispare; avise o George. Um diário cuja integração ainda não terminou fica para a próxima consolidação (continua `consolidado: false`).
3. Chame o subagente `documentador` com: `consolidação` e a lista de diários (ex.: `T-006, T-007`). Nada além disso; não passe `isolation` nem `run_in_background`.
4. Avise o George que a consolidação está rodando em segundo plano e siga o trabalho. Pedidos de permissão do subagente: aprove só escritas em `docs/04-estudos/**` dentro de `.claude/worktrees/`.

## Integração (quando chegar a notificação de conclusão)
Siga a seção "Consolidação" da `orquestrar-tarefa` (mesmos passos da integração do diário, com as diferenças listadas lá): conferência de área no worktree, branch `estudos/consolidacao-AAAA-MM-DD`, commit `docs(estudos): consolida diários T-XXX, T-YYY em notas por conceito`, **só o validador**, `rebase main`, fast-forward, `git push origin main` e limpeza. Conflito no rebase → nada é forçado, o George decide. Falha → descarte o worktree e avise o George (não há nota de tarefa para registrar).

Ao final, mostre ao George as notas criadas e as atualizadas (lista do handoff).
