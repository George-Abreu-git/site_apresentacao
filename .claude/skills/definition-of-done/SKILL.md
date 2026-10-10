---
name: definition-of-done
description: Use para conferir se uma tarefa está pronta — o dev antes de entregar, o code-reviewer e o qa ao avaliar.
---

# Definition of Done

Uma tarefa só está pronta quando **todos** os itens aplicáveis estão marcados. No handoff, liste os itens não atendidos em "Pendências".

Itens marcados com *(encerramento)* são verificados pelo orquestrador ao final do fluxo — dev, code-reviewer e qa **ignoram** esses itens.

- [ ] Todos os critérios de aceite da tarefa atendidos
- [ ] Testes novos cobrindo o comportamento da tarefa, passando, e suíte inteira verde
- [ ] Nenhum segredo, token ou dado sensível no código ou nos commits (usar `.env`, que é ignorado pelo git)
- [ ] Interface responsiva (mobile e desktop), quando a tarefa tem UI
- [ ] Acessibilidade básica: HTML semântico, contraste adequado, `alt` em imagens, navegação por teclado
- [ ] O implementador alterou apenas a sua área (ver tabela em `AGENTS.md`)
- [ ] Código legível, sem código morto ou comentários de debug
- [ ] *(encerramento)* Nota de estudo criada ou atualizada pelo instrutor
