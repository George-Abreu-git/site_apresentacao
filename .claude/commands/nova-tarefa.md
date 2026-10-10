---
description: Cria uma nova tarefa no backlog a partir do template.
argument-hint: <título da tarefa>
---

Crie uma nova tarefa com o título: $ARGUMENTS

1. Próximo id: maior `T-XXX` em `docs/03-tarefas/` e no `backlog.md` + 1.
2. Pergunte ao George, numa única rodada: descrição, critérios de aceite, modo (`eu-faco` ou `agente-faz`) e tags (ex.: `front-end`, `back-end`, `api`, `infra`, `release`, `orquestracao`, `docs`, `revisao`). A tag `infra`, `release` ou `orquestracao` escolhe o devops como implementador; a tag `revisao` escolhe o fluxo QA → instrutor, sem implementador (ver `orquestrar-tarefa`). Se ele não souber o modo, apresente a escolha com a skill `apresentar-decisao`.
3. Crie `docs/03-tarefas/T-XXX-<slug>.md` a partir de `docs/_templates/tarefa.md`, preenchendo o frontmatter (`id`, `titulo`, `status: backlog`, `rodadas: 0`, `tags`) e as seções. Substitua **todos** os placeholders `{{...}}` (data de hoje, título).
4. Adicione a linha no `docs/03-tarefas/backlog.md`, com o id como link: `[[docs/03-tarefas/T-XXX-<slug>|T-XXX]]`.
5. Troque para `main` (se houver mudanças não commitadas na branch atual, pare e avise o George) e commite seguindo `commit-convencional` (`docs(tarefas): cria T-XXX <título>`).
