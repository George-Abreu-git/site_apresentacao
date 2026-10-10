---
tipo: estudo
tarefa: T-002
tags: [orquestracao, qa]
data: 2026-10-09
---

# Revisão de consistência documental

## Conceito

Revisar um projeto não é só testar código. Quando o projeto tem muitos documentos que se referenciam (regras, skills, agentes, specs, planos), é preciso conferir se eles **dizem a mesma coisa**. Isso é a revisão de consistência documental: ler os arquivos em conjunto e procurar três tipos de problema.

- **Contradição**: dois arquivos afirmam coisas diferentes (o plano diz "3 voltas ao Dev", a regra atual diz "3 voltas ao implementador").
- **Lacuna**: algo é citado mas não existe (o `AGENTS.md` fala em "visão completa" e não existe `visao.md`).
- **Desatualização**: o documento era verdade ontem e hoje não é mais (o plano fala em perguntar sobre merge, mas o merge agora é automático).

Cada achado ganha uma **severidade** para ajudar a priorizar: nesta tarefa, *média* (pode atrapalhar o fluxo, vale decidir logo) e *baixa* (higiene, pode esperar). Nenhum achado foi *bloqueante*.

## Por que importa

Neste projeto, **os documentos são o "código" da orquestração**: os agentes se comportam conforme o que `AGENTS.md`, as skills e os agentes dizem. Uma contradição entre dois arquivos vira comportamento imprevisível (cada sessão pode obedecer um arquivo diferente). Achar isso **antes da ADR de stack** evita construir a stack em cima de uma base inconsistente.

## Como aparece no projeto

A T-002 foi exatamente isso: o QA leu 34 arquivos versionados (mais 2 não versionados) e entregou 5 achados médios (M1-M5) e 14 baixos (B1-B14) na seção `## QA` de [[docs/03-tarefas/T-002-qa-revisa-arquivos-antes-adr]].

Exemplos reais de cada tipo:

| Tipo | Achado | Onde |
|---|---|---|
| Lacuna | Não existem `visao.md` nem `requisitos.md` (M1) | `docs/00-visao/`, `docs/01-requisitos/` |
| Contradição | Tag `qa` cai no `dev` pela skill, mas o George decidiu outro fluxo (M2) | `orquestrar-tarefa/SKILL.md` vs. `## Decisões` da T-002 |
| Desatualização | Plano ainda diz "8 skills" (são 9) e `status: em-revisao` (B3) | `docs/02-arquitetura/plans/` |
| Ambiguidade | Marca `concluida` e commita antes de rodar testes (M5) | `orquestrar-tarefa/SKILL.md` |

Também houve o resultado do **validador automático** (`scripts/validar_estrutura.py`, saiu com código 0). Ele pega só o que está programado para pegar (existência de arquivos e campos); os achados acima passaram por ele sem alarme. Por isso a leitura humana (ou do QA) continua necessária. O achado B2 lista justamente o que o validador ainda não checa.

## Exemplo

Como transformar uma observação em achado útil. Um bom achado tem **onde, o quê, por quê importa e sugestão**:

```
M1. Falta o levantamento de requisitos antes da ADR de stack.   <- o quê
- Arquivos: docs/00-visao/README.md, AGENTS.md ...             <- onde
- A spec define a ordem requisitos -> ADR; ...                  <- por quê
- Sugestão: rodar `levantar-requisitos` antes da ADR.           <- o que fazer
```

Note que o QA **não corrigiu nada**: a decisão de corrigir (e como) é do George. Revisão e correção são papéis separados.

## Para aprofundar

- Exercício: abra `AGENTS.md` e a skill `definition-of-done`. Algum item de um cita algo que o outro não menciona? Anote como mini-achado (arquivo, severidade, sugestão).
- Pergunta: por que separar quem revisa de quem corrige ajuda a não "esconder" problemas?
- Pergunta: qual achado B1-B14 você automatizaria no validador? (Dica: B1 e B2.)

## Links

- Tarefa: [[docs/03-tarefas/T-002-qa-revisa-arquivos-antes-adr]]
- Relacionadas: [[ordem-requisitos-e-adr]], [[areas-por-caminho-de-escrita]], [[yaml-frontmatter]]
