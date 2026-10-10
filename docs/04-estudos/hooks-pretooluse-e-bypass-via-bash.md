---
tipo: estudo
tarefa: T-002
tags: [orquestracao, devops]
data: 2026-10-09
---

# Hooks PreToolUse e o bypass via Bash

## Conceito

Um **hook** do Claude Code é um programa que roda automaticamente em um momento do ciclo de vida. O `PreToolUse` roda **antes** de uma ferramenta ser executada e pode **bloquear** a chamada. Ele escolhe quais ferramentas observar por um **matcher** (por exemplo `Edit|Write`).

Isso muda a natureza da regra:

- **Instrução** (texto no `AGENTS.md`): o agente *deveria* obedecer. Depende de boa vontade.
- **Hook** (código): o agente *não consegue* fazer. É imposto pelo sistema.

O **bypass via Bash** é a brecha clássica. Se o hook só vigia `Edit` e `Write`, mas o agente tem a ferramenta `Bash`, ele pode escrever no mesmo arquivo por outro caminho:

```
echo "texto" > docs/03-tarefas/T-002.md     # redirecionamento
sed -i 's/a/b/' docs/03-tarefas/T-002.md    # edição direta
git checkout -- docs/03-tarefas/            # reescreve arquivos
```

Nenhum desses comandos passa por `Edit`/`Write`, então o hook não enxerga.

## Por que importa

A regra "agentes nunca editam a nota da tarefa" é central no projeto (só o orquestrador escreve nela). Se a proteção tiver furo, a regra volta a depender só de instrução, e o dev/qa/devops/code-reviewer, que têm `Bash`, poderiam violá-la, mesmo sem querer. O code-reviewer, que deveria ser "somente leitura", também tem `Bash`.

Há ainda uma segunda pergunta em aberto: **o hook sabe qual subagente está agindo?** Sem saber quem é, ele não consegue aplicar "dev só em `src/`, qa só em testes".

## Como aparece no projeto

- [[docs/03-tarefas/T-001-hooks-restricao-escrita|T-001]] planeja os hooks de `Edit/Write` por agente.
- O achado **M4** da T-002 aponta que os critérios da T-001 não cobrem escrita via Bash.
- Sugestões do QA: (a) um matcher `Bash` com lista de caminhos protegidos; ou (b) retirar `Bash` do qa e do code-reviewer; e acrescentar critérios para devops e code-reviewer.
- Achado **B12** é parente: skills "exclusivas do orquestrador" (`orquestrar-tarefa`, `levantar-requisitos`, `registrar-decisao`) continuam visíveis aos subagentes; só o texto impede o uso.

Repare que a escolha entre (a) e (b) é uma **decisão do George**, a ser tomada na T-001. É um trade-off entre segurança e conveniência dos agentes.

> Atualização (T-001, concluída): ficou a (a). O `Bash` mostrou ser analisável e ninguém perdeu a ferramenta. O hook identifica o subagente pelos campos `agent_id`/`agent_type` do JSON de entrada (`.claude/hooks/restringir-escrita.mjs`). Detalhes em [[docs/04-estudos/tarefas/T-001]].

## Exemplo

Esboço conceitual (não é a implementação final) de como um hook decide:

```
entrada do hook: ferramenta = "Bash", comando = "echo x > docs/03-tarefas/T-002.md"
regra: se o comando mencionar "docs/03-tarefas/" e quem age não for o orquestrador -> bloquear
saída: código de bloqueio + mensagem explicando o porquê
```

Dificuldade real: analisar comandos Bash é frágil (`cd docs && echo x > 03-tarefas/a.md` escapa de uma busca simples por texto). Por isso retirar a ferramenta Bash de quem não precisa costuma ser mais seguro que tentar filtrar comandos.

## Para aprofundar

- Exercício: liste 3 comandos Bash que alterariam um arquivo sem usar `Edit`/`Write`. Um deles escaparia de uma busca por `docs/03-tarefas/`?
- Pergunta: quais agentes realmente precisam de `Bash`? (Veja o campo `tools` em `.claude/agents/`.)
- Pergunta: qual a diferença entre "segurança por instrução" e "segurança por mecanismo"?

## Links

- Tarefa: [[docs/03-tarefas/T-002-qa-revisa-arquivos-antes-adr]]
- Relacionadas: [[areas-por-caminho-de-escrita]], [[revisao-de-consistencia-documental]]
