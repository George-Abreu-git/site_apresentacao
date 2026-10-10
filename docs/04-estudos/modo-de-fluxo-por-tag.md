---
tipo: estudo
tarefa: T-003
tags: [orquestracao]
data: 2026-10-10
---

# Modo de fluxo por tag

## Conceito

Nem toda tarefa precisa passar pelas mesmas etapas. Um **modo de fluxo** é a sequência de agentes que a tarefa percorre. Neste projeto o orquestrador escolhe o modo olhando para a nota da tarefa:

- o campo `modo` (`agente-faz` ou `eu-faco`) diz **quem escreve o código** (um agente ou o George);
- as **tags** dizem **que tipo de trabalho** é, e algumas tags mudam o fluxo inteiro.

A T-003 criou a tag **`revisao`**: tarefas que só **leem arquivos existentes e listam achados**, sem alterar nada. Para elas o fluxo é curto:

```
agente-faz:  implementador -> code-reviewer -> qa -> instrutor -> encerramento
revisao:                                       qa -> instrutor -> encerramento
```

Sem implementador (ninguém escreve nada) e, portanto, sem code-reviewer (não há diff para revisar).

> **Atualização (T-014):** o instrutor saiu do fim do fluxo nos três modos. Hoje a tarefa termina no encerramento, logo após o `PASSOU` do qa, e o último passo do encerramento dispara o `documentador` em segundo plano (diário em `docs/04-estudos/tarefas/T-XXX.md`), sem esperar por ele: `agente-faz: implementador -> code-reviewer -> qa -> encerramento (-> documentador em paralelo)` e `revisao: qa -> encerramento (-> documentador em paralelo)`. No `eu-faco` o instrutor continua só como mentor. Os diagramas e o pseudocódigo abaixo mostram o fluxo da época da T-003. Ver [[docs/04-estudos/tarefas/T-014]].

## Por que importa

Antes da T-003, a T-002 (uma revisão documental feita pelo QA) não cabia em nenhum modo. A skill mandava tarefas sem tag `infra`/`release` para o **dev**, então a revisão "caía" no implementador errado (achado **M2**). O George teve de decidir o fluxo na hora. Formalizar o modo:

1. **Tira a improvisação**: a próxima revisão segue uma regra escrita, sem decisão ad hoc.
2. **Evita etapas vazias**: chamar code-reviewer sem diff só gasta tempo e tokens.
3. **Deixa a regra de área verificável**: no modo `revisao` o qa não pode alterar **nenhum** arquivo, então qualquer mudança no `git status` é violação.

## Como aparece no projeto

- `.claude/skills/orquestrar-tarefa/SKILL.md`, seção "Modo `revisao`": status `em-qa` → qa (passo "revisão documental") → encerramento, que dispara o documentador em segundo plano (antes da T-014 havia um instrutor entre o qa e o encerramento).
- Regra de precedência (interpretação do devops, aceita pelo code-reviewer): se a tarefa tem a tag `revisao`, esse modo vale **seja qual for o campo `modo`** da nota.
- `.claude/agents/qa.md` ganhou o passo **"Revisão documental"**: lista achados com arquivo e severidade, sem alterar arquivos.
- `.claude/commands/nova-tarefa.md` lista `revisao` (e também `orquestracao` e `docs`) entre as tags.
- `AGENTS.md`, linha do qa em "Áreas por caminho": "Na revisão documental (tag `revisao`), nenhum arquivo".
- **E se o qa devolver `FALHOU`?** No modo normal, `FALHOU` volta ao implementador e conta rodada. Aqui não há implementador, então a regra é: status `aguardando-decisao`, **sem** contar rodada, e o George decide. Essa regra nasceu de uma interpretação do devops (a nota não a definia) e foi aceita na revisão.

Repare que a **tag escolhe também o implementador**: `infra`, `release` ou `orquestracao` → devops; o resto → dev. A T-003 tem a tag `orquestracao`, por isso foi implementada pelo devops (seções `## DevOps` da nota), não pelo dev.

## Exemplo

Como o orquestrador decide, em pseudocódigo comentado:

```
se "revisao" in tags:            # a tag manda mais que o campo modo
    fluxo = [qa, instrutor]      # qa só lê; instrutor explica
senão se modo == "eu-faco":
    fluxo = [instrutor(mentor), George, code-reviewer, qa, instrutor]
senão:                           # agente-faz
    impl = devops se tags tem infra/release/orquestracao, senão dev
    fluxo = [impl, code-reviewer, qa, instrutor]
```

## Para aprofundar

- Exercício: imagine uma tarefa "revisar a acessibilidade da página inicial" com tags `[revisao, front-end]` e `modo: eu-faco`. Qual fluxo ela segue? Quem altera arquivos?
- Pergunta: o code-reviewer sugeriu (opcional) trocar "`git status --porcelain` deve ficar limpo" por "sem alterações novas em relação ao status capturado antes de chamar o qa". Por que a regra original é frágil? (Dica: lembre dos 2 arquivos `.obsidian/` não rastreados.)
- Pergunta: por que faz sentido que `FALHOU` no modo `revisao` **não** conte rodada?

## Links

- Tarefa: [[docs/03-tarefas/T-003-corrige-achados-t002]]
- Origem do problema: [[docs/03-tarefas/T-002-qa-revisa-arquivos-antes-adr]] (achado M2)
- Relacionadas: [[revisao-de-consistencia-documental]], [[areas-por-caminho-de-escrita]], [[verificar-antes-de-concluir]]
