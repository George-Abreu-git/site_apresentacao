---
description: Chama o instrutor sob demanda para explicar um tema e gerar ou atualizar a nota de estudo.
argument-hint: <tema>
---

Acione o subagente `instrutor` para explicar o tema: $ARGUMENTS

- Contexto: use exemplos do próprio projeto quando existirem.
- Ele deve criar ou atualizar a nota em `docs/04-estudos/` (skill `nota-de-estudo`).
- Mostre a explicação ao George e commite a nota (`docs(estudos): ...`).
