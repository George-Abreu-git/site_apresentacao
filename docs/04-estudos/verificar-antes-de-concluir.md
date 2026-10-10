---
tipo: estudo
tarefa: T-003
tags: [orquestracao, devops]
data: 2026-10-10
---

# Verificar antes de marcar como concluído

## Conceito

"Concluído" é uma afirmação: "isto funciona e pode ir para a branch principal". Uma afirmação só vale se foi **conferida antes** de ser feita. A regra é simples: **primeiro verifica (testes, validador), depois marca como concluído e integra**. Nunca o contrário.

É a mesma ideia de um **portão de qualidade** (*quality gate*) em CI: o merge só acontece se a verificação passar. Se falhar, o estado não muda.

## Por que importa

Se a ordem for invertida (marca `concluida`, commita e só então roda os testes), acontece um destes problemas:

1. **Estado mentiroso**: a nota e o backlog dizem "concluída" enquanto o teste está vermelho.
2. **Desfazer dá trabalho**: é preciso reabrir a tarefa, reverter o status e explicar no Log, em vez de simplesmente não avançar.
3. **Risco de merge quebrado**: como o merge em `main` é automático quando tudo passa, uma verificação fora de ordem pode deixar código ruim chegar à `main` (e ao `origin`).

## Como aparece no projeto

- Achado **M5** da T-002: a skill `orquestrar-tarefa` marcava `concluida` e commitava **antes** de rodar os testes.
- Na T-003 o devops reescreveu o **Encerramento** de `.claude/skills/orquestrar-tarefa/SKILL.md` nesta ordem: `definition-of-done` → **verificação** (suíte de testes + `python3 scripts/validar_estrutura.py`) → `concluida` + Log + backlog + commit → merge local e `git push origin main`.
- **Fase atual sem código**: enquanto não houver `src/` nem suíte de testes, roda **só o validador**. Isso está escrito explicitamente para ninguém pensar que "não há testes" significa "não há verificação". Quando a suíte existir, ela passa a ser obrigatória.
- **Se falhar**: não marca `concluida`, não faz merge; status `aguardando-decisao` e a decisão vai ao George (`apresentar-decisao`). Isso bate com `AGENTS.md`: "Se algo falhar, não há merge — o George decide."
- O mesmo princípio aparece em pequena escala nos handoffs: o devops e o QA da T-003 sempre relatam o resultado do validador (`OK: estrutura válida ...`, código de saída 0) antes de devolver `CONCLUIDO` ou `PASSOU`.

## Exemplo

O Encerramento, resumido e comentado:

```
1. definition-of-done        # checklist com base nos handoffs
2. verificação               # testes (quando existirem) + validador
   falhou? -> aguardando-decisao, sem concluida, sem merge
3. tudo verde -> concluida   # só agora o status muda
4. merge em main + push      # integração é o último passo
```

Em CI, o equivalente seria um job de testes obrigatório antes do merge de um pull request.

## Para aprofundar

- Exercício: rode `python3 scripts/validar_estrutura.py` e observe o código de saída (`echo $LASTEXITCODE` no PowerShell). Por que o orquestrador olha o código de saída, e não só o texto?
- Pergunta: o validador não pega contradições entre documentos (veja [[revisao-de-consistencia-documental]]). Então "validador verde" garante que a tarefa está certa? O que mais compõe a verificação?
- Pergunta: quando a stack existir, onde essa mesma regra deveria morar além da skill? (Dica: CI no GitHub Actions, área do devops.)

## Links

- Tarefa: [[docs/03-tarefas/T-003-corrige-achados-t002]]
- Origem do problema: [[docs/03-tarefas/T-002-qa-revisa-arquivos-antes-adr]] (achado M5)
- Relacionadas: [[modo-de-fluxo-por-tag]], [[revisao-de-consistencia-documental]]
