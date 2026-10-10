---
name: nota-de-estudo
description: Use para escrever material de estudo em docs/04-estudos — o diário por tarefa (documentador) ou a nota por conceito (instrutor, em /estudar e /estudar-consolidar).
---

# Nota de estudo

Há **dois formatos**, com donos diferentes:

| Formato | Caminho | Quem escreve | Quando |
|---|---|---|---|
| Diário por tarefa | `docs/04-estudos/tarefas/T-XXX.md` | `documentador` | No encerramento de cada tarefa, em segundo plano (worktree isolado) |
| Nota por conceito | `docs/04-estudos/<conceito>.md` | `instrutor` | Sob demanda: `/estudar <tema>` e `/estudar-consolidar` |

O diário é rápido e barato (um arquivo novo por tarefa, sem ler outras notas). A nota por conceito acumula o conhecimento entre tarefas e nasce da consolidação dos diários.

## Diário por tarefa

1. Um arquivo por tarefa: `docs/04-estudos/tarefas/T-XXX.md`. Só o documentador escreve nele (o instrutor só muda o campo `consolidado`).
2. Use o template `docs/_templates/diario-estudo.md`:
   - frontmatter: `tipo: diario`, `tarefa: T-XXX`, `data`, `consolidado: false`, `conceitos: [conceito-a, conceito-b]` (kebab-case, os nomes que as notas por conceito terão);
   - **O que foi feito**: resumo da tarefa para quem está aprendendo;
   - **Conceitos**: um item curto por conceito, com o **porquê**;
   - **Onde aparece no projeto**: caminhos de arquivo;
   - **Exercícios**: 1-2 para fixar;
   - **Links**: `[[docs/03-tarefas/T-XXX-<slug>]]`.
3. Fonte: só a nota da tarefa e os arquivos citados nela. O diário não lê nem cita outras notas de estudo.

## Nota por conceito

1. **Um conceito por nota.** Nome em kebab-case: `docs/04-estudos/<conceito>.md` (ex.: `api-rest.md`, `css-grid.md`). Notas existentes nunca são movidas nem renomeadas.
2. Se a nota já existe, **atualize com Edit** — só o trecho novo, sem reescrever o arquivo (acrescente "Como aparece no projeto" com a nova tarefa) em vez de duplicar.
3. Use o template `docs/_templates/nota-estudo.md` e preencha:
   - **Conceito**: explicação simples, como para quem está aprendendo.
   - **Por que importa**: o problema que resolve.
   - **Como aparece no projeto**: onde e como foi usado, com caminho de arquivo.
   - **Exemplo**: trecho curto e comentado.
   - **Para aprofundar**: próximos passos de estudo (perguntas, exercícios).
   - **Links**: `[[docs/03-tarefas/T-XXX-<slug>]]`, o diário de origem `[[docs/04-estudos/tarefas/T-XXX]]` (quando vier da consolidação) e notas relacionadas `[[<conceito>]]`.
4. Frontmatter: `tarefa: T-XXX`, `tags` com a área (`front-end`, `back-end`, `api`, `devops`, `orquestracao`).
5. Na consolidação, depois de criar/atualizar as notas de um diário, marque-o com `consolidado: true`.

## Nos dois formatos

Linguagem didática e direta; prefira exemplos do próprio projeto a exemplos genéricos.
