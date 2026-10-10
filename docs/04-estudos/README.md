# 04 — Estudos

Material de estudo gerado a partir das tarefas do projeto (skill `nota-de-estudo`). Há **dois formatos**:

| Formato | Onde fica | Quem escreve | Quando |
|---|---|---|---|
| Diário por tarefa | `tarefas/T-XXX.md` | agente **documentador** | No encerramento de cada tarefa, em segundo plano |
| Nota por conceito | raiz desta pasta (`<conceito>.md`) | agente **instrutor** | Sob demanda: `/estudar <tema>` e `/estudar-consolidar` |

- **Pasta `tarefas/`**: um diário por tarefa (template `docs/_templates/diario-estudo.md`) com o que foi feito, os conceitos com o porquê, onde aparecem no projeto, exercícios e o link da tarefa. O campo `consolidado` do frontmatter indica se o diário já virou notas por conceito.
- **Raiz da pasta**: uma nota por conceito, nomeada em kebab-case (ex.: `api-rest.md`), que acumula o conhecimento entre tarefas. Nasce da consolidação dos diários (`/estudar-consolidar`) ou de um `/estudar` e liga a tarefa de origem, o diário e as notas relacionadas. Notas existentes nunca são movidas nem renomeadas, para não quebrar os links.

Use a visualização de grafo do Obsidian para enxergar a trilha de aprendizado.

Relacionados: [[docs/03-tarefas/backlog|Backlog]]
