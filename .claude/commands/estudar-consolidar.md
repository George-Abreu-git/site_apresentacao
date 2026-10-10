---
description: Chama o instrutor para consolidar os diários de estudo pendentes (consolidado false) em notas por conceito.
argument-hint: "[T-XXX ...]"
---

Consolide os diários de estudo pendentes. Argumentos (opcional): $ARGUMENTS — ids de tarefa para consolidar só esses diários; sem argumento, todos os pendentes.

1. Liste os diários `docs/04-estudos/tarefas/T-*.md` com `consolidado: false` (filtrados pelos ids, se houver). Nenhum → avise o George e pare.
2. Garanta o checkout limpo (`git status --porcelain` vazio). Se houver uma tarefa em andamento no checkout, não troque de branch por conta própria: avise o George e rode quando ela estiver encerrada.
3. Crie a branch `estudos/consolidacao-AAAA-MM-DD` a partir de `main`.
4. Acione o subagente `instrutor` (passo "Consolidação"), passando a lista de diários. Id do handoff: `avulso`.
5. Confira a área: só `docs/04-estudos/<conceito>.md` (raiz) e o campo `consolidado` dos diários listados podem mudar; nenhuma nota existente movida ou renomeada.
6. Rode `python3 scripts/validar_estrutura.py`; commit `docs(estudos): consolida diários T-XXX, T-YYY em notas por conceito`.
7. Integre como uma branch de estudos: `git switch main && git merge --ff-only estudos/consolidacao-AAAA-MM-DD`, `git push origin main` e apague a branch. Falhou algum passo → não integre e apresente ao George (`apresentar-decisao`).
8. Mostre ao George as notas criadas/atualizadas.
