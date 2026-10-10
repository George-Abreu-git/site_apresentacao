---
tipo: estudo
tarefa: T-004
tags: [orquestracao]
data: 2026-10-10
---

# ADR como fonte única (o AGENTS.md resume e cita)

## Conceito

**Fonte única de verdade** (em inglês, *single source of truth*) quer dizer: cada informação tem **um** lugar oficial. Os outros documentos podem **resumir** e **apontar** para ele, mas não competem com ele.

No projeto, duas peças convivem:

- A **ADR** (Architecture Decision Record) é o registro **completo** de uma decisão: contexto, opções com prós e contras, a escolha do George e as consequências. Na prática comum, uma ADR aceita não é reescrita: se a decisão mudar, nasce uma ADR nova que a substitui.
- O **`AGENTS.md`** é o que **todo agente lê primeiro** (skill `carregar-contexto`). Ele precisa ser curto e prático: o agente quer saber "qual é a stack e o que eu não posso fazer", não o histórico do debate.

A solução é a divisão: a ADR **decide e explica**; o `AGENTS.md` **resume o que vale hoje e linka para a ADR**.

## Por que importa

- **Evita contradição**: se o `AGENTS.md` copiasse a ADR inteira, cada mudança teria de ser feita em dois lugares. Uma hora alguém esquece um deles, e os agentes passam a seguir versões diferentes da verdade. Foi esse tipo de divergência que a [[revisao-de-consistencia-documental]] da T-002 caçou.
- **Contexto enxuto**: os agentes leem o `AGENTS.md` em toda tarefa. Um resumo de 10 linhas custa pouco; as 80 linhas da ADR, com as opções rejeitadas, só são lidas por quem precisa (o dev em tarefa de stack, por exemplo).
- **Protege a regra de decisões**: com a stack escrita como "decidida na ADR-0001", fica claro o que **já está decidido** (pode usar) e o que **não está** (tecnologia nova = decisão do George, nova ADR).

## Como aparece no projeto

Antes da [[docs/03-tarefas/T-004-atualiza-agents-stack|T-004]], a seção Stack do `AGENTS.md` dizia "**A definir** — será registrada como ADR. Até lá, nenhum agente escolhe tecnologia por conta própria." A [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]] foi aceita, e uma das suas consequências era justamente "atualizar o `AGENTS.md`".

O que o devops fez, e por quê:

| No `AGENTS.md` (T-004) | Por que assim |
|---|---|
| "Definida na [ADR-0001 — Stack da v1](...)" no topo da seção | O link deixa claro **quem manda**: em caso de dúvida, vale a ADR. |
| Tabela-resumo: front, back, repositório, estilização, testes, hospedagem | Só a **escolha** de cada decisão. As opções rejeitadas (Astro, Express, Vercel...) ficaram só na ADR. |
| Linha de consequências: partida a frio (RNF-03), CORS (RNF-05), token só no Render | São as consequências que **qualquer agente** precisa respeitar no dia a dia, por isso valem ser repetidas. |
| "Qualquer tecnologia fora desta lista é decisão do George (nova ADR)." | Mantém a regra de decisões que já existia no "A definir". |
| A tabela "Áreas por caminho" diz "Definidas a partir das consequências da ADR-0001" | Mesma ideia: a origem fica citada. |

A subseção "Sequência inicial" saiu: ela descrevia passos que já tinham sido feitos (requisitos e ADR) e contradiria a seção nova. O code-reviewer aceitou porque a ordem continua registrada no backlog.

Como os revisores conferiram: o code-reviewer e o QA leram a seção "Decisão" da ADR e compararam **item por item** com a tabela do `AGENTS.md`. Resumo e fonte batiam. Esse é o teste de um bom resumo: **nada no resumo que não esteja na fonte**.

## Exemplo

O padrão em miniatura:

```markdown
## Stack

Definida na [ADR-0001 — Stack da v1](docs/02-arquitetura/ADR-0001-stack.md). Resumo:

| Camada    | Escolha                                  |
|-----------|------------------------------------------|
| Front-end | React + Vite + TypeScript, em apps/web/  |   <- só a escolha
| ...       | ...                                      |

Qualquer tecnologia fora desta lista é decisão do George (nova ADR).   <- a regra
```

Contraexemplo (o que **não** fazer): copiar para o `AGENTS.md` a tabela de prós e contras do Express contra o NestJS. Se a ADR-0002 um dia trocar o NestJS, o `AGENTS.md` continuaria "defendendo" a escolha antiga.

## Para aprofundar

- Exercício: imagine uma futura ADR-0002 que troca a hospedagem da API do Render para um plano pago. Liste **exatamente** quais linhas do `AGENTS.md` mudariam, e o que aconteceria com a ADR-0001 (dica: ela não é apagada; na prática comum de ADRs ela fica marcada como "substituída pela ADR-0002". O template do projeto, `docs/_templates/adr.md`, ainda só prevê `status: proposta`, então o jeito de marcar isso seria uma decisão do George).
- Pergunta: a linha de consequências (RNF-03, RNF-05, token) **repete** informação da ADR. Por que isso não fere a ideia de fonte única? Onde está o limite entre "resumir" e "duplicar"?
- Exercício: procure outro lugar do projeto onde a mesma informação aparece em dois arquivos (dica: as pendências do devops na T-004 citam `.claude/agents/dev.md`, `qa.md` e `devops.md`, que ainda falam em `src/**`). Qual deles deveria ser a fonte, e qual deveria só apontar?

## Links

- Tarefa: [[docs/03-tarefas/T-004-atualiza-agents-stack]]
- ADR: [[docs/02-arquitetura/ADR-0001-stack]]
- Relacionadas: [[ordem-requisitos-e-adr]], [[revisao-de-consistencia-documental]], [[monorepo-com-npm-workspaces]], [[areas-por-caminho-de-escrita]]
