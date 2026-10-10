---
description: Chama o instrutor sob demanda para tirar uma dúvida na hora, explicando um tema de forma interativa e gerando ou atualizando a nota por conceito.
argument-hint: <tema>
---

Acione o subagente `instrutor` (passo "Sob demanda") para explicar o tema: $ARGUMENTS

- É o tira-dúvidas interativo: roda na hora, no primeiro plano, sem esperar o fim de uma tarefa.
- Contexto: use exemplos do próprio projeto quando existirem.
- Ele deve criar ou atualizar a nota por conceito em `docs/04-estudos/` (skill `nota-de-estudo`). Para transformar os diários das tarefas em notas, use `/estudar-consolidar` (documentador, em segundo plano).
- Mostre a explicação ao George. Se ele fizer outra pergunta sobre o tema, chame o instrutor de novo com a pergunta.
- Commite a nota (`docs(estudos): ...`). Com uma tarefa em andamento no checkout, não troque de branch por conta própria: pergunte ao George onde commitar.
