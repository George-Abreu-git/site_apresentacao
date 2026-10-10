---
name: nota-de-estudo
description: Use para criar ou atualizar notas de estudo em docs/04-estudos a partir dos conceitos que apareceram numa tarefa.
---

# Nota de estudo

1. **Um conceito por nota.** Nome em kebab-case: `docs/04-estudos/<conceito>.md` (ex.: `api-rest.md`, `css-grid.md`).
2. Se a nota já existe, **atualize com Edit** — só o trecho novo, sem reescrever o arquivo (acrescente "Como aparece no projeto" com a nova tarefa) em vez de duplicar.
3. Use o template `docs/_templates/nota-estudo.md` e preencha:
   - **Conceito**: explicação simples, como para quem está aprendendo.
   - **Por que importa**: o problema que resolve.
   - **Como aparece no projeto**: onde e como foi usado, com caminho de arquivo.
   - **Exemplo**: trecho curto e comentado.
   - **Para aprofundar**: próximos passos de estudo (perguntas, exercícios).
   - **Links**: `[[docs/03-tarefas/T-XXX-<slug>]]` e notas relacionadas `[[<conceito>]]`.
4. Frontmatter: `tarefa: T-XXX`, `tags` com a área (`front-end`, `back-end`, `api`, `devops`, `orquestracao`).
5. Linguagem didática e direta; prefira exemplos do próprio projeto a exemplos genéricos.
