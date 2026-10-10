---
name: apresentar-decisao
description: Use sempre que surgir uma decisão não coberta por ADR, requisito ou tarefa — apresenta 3 opções com 3 prós e 3 contras cada para o George decidir.
---

# Apresentar decisão

O controle de decisão é do **George**. Nenhum agente decide por ele.

## O que é decisão

Qualquer escolha que mude o resultado e não esteja definida em ADR, requisito, tarefa ou `AGENTS.md`: tecnologia, biblioteca, estrutura, padrão, comportamento visível, trade-off de custo/qualidade, merge.
Detalhes triviais de implementação (nome de variável local, ordem de imports) **não** são decisão.

## Formato (rodadas numeradas, estilo grilling)

Agrupe numa rodada todas as decisões que já podem ser tomadas; decisões que dependem de outra ficam para a rodada seguinte.

```
❓ **Q1 — <título>**: <contexto em 1-3 linhas>

**A) <opção>**
- ✅ <pró>
- ✅ <pró>
- ✅ <pró>
- ❌ <contra>
- ❌ <contra>
- ❌ <contra>

**B) <opção>** (idem)

**C) <opção>** (idem)

➡️ **Recomendo <X>** porque <1-2 frases>.
```

Sempre **3 opções, 3 prós e 3 contras cada, e uma recomendação**.

## Quem pergunta

- **Subagente**: não pergunta. Coloca a rodada no campo "Decisão pendente" do handoff e devolve `Resultado: AGUARDANDO-DECISAO`.
- **Orquestrador**: apresenta ao George, espera a resposta, registra (`## Decisões` da tarefa ou ADR via `registrar-decisao`) e retoma o fluxo.
