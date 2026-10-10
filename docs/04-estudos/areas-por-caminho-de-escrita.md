---
tipo: estudo
tarefa: T-002
tags: [orquestracao]
data: 2026-10-09
---

# Áreas por caminho de escrita

## Conceito

Para cada agente, o projeto define **quais caminhos ele pode alterar** (a tabela "Áreas por caminho" do `AGENTS.md`). O orquestrador confere depois de cada agente com `git status`. É o mesmo princípio de **menor privilégio**: cada um mexe só no que precisa.

Uma boa tabela de áreas tem três propriedades:

1. **Sem sobreposição**: um caminho tem um único dono (ou a exceção é explícita).
2. **Sem lacuna**: todo caminho do repositório tem alguém responsável.
3. **Coerente com o papel**: o que o texto do papel diz ("dev altera código e testes") bate com o que a tabela permite.

## Por que importa

Se dois agentes "podem" mexer no mesmo caminho, a conferência fica ambígua. Se ninguém é dono de um caminho, ninguém é responsável por ele (ou todos mexem sem controle). E a tabela é a **base dos hooks** da T-001: o hook só consegue bloquear corretamente o que a tabela define corretamente.

## Como aparece no projeto

O achado **M3** da T-002 mostra os três problemas na tabela atual de `AGENTS.md`:

- **Sobreposição**: `**/*.test.*` está na área do **qa**, mas o dev faz TDD (escreve testes). Como a área do dev é só `src/**`, os testes do dev seriam sinalizados como violação.
- **Lacunas (sem dono)**: `scripts/**` (inclui o validador), `.gitignore`, `.obsidian/**`, configs da raiz (`package.json`, `.env.example`), `docs/**` fora de `03-tarefas` e `04-estudos`, e `.claude/agents|skills|commands`. Nem o orquestrador tem linha na tabela.
- **Incoerência**: o `devops.md` cita "scripts de build", mas `scripts/**` não está na área do devops (também **B14**: dev "código e testes" vs. caminho só `src/**`).

As áreas já são declaradas **provisórias** até a ADR de stack, porque ainda não existem `src/` nem pastas de teste. Por isso o QA sugeriu resolver isso na ADR: definir quem escreve testes unitários (dev) e o que é do qa (e2e/aceitação), e dar dono às lacunas.

## Exemplo

Ilustração de uma tabela mais completa (apenas para entender a ideia, **a decisão é do George**):

```
| Agente        | Caminhos                                      |
| dev           | src/**, **/*.test.* dentro de src/            |
| qa            | e2e/**, tests/aceitacao/**                    |
| devops        | .github/**, infra/**, Dockerfile*             |
| orquestrador  | docs/03-tarefas/**, docs/00-02, .claude/**    |
| instrutor     | docs/04-estudos/**                            |
```

Pergunta de teste para qualquer linha: "se eu alterar este arquivo, a quem pertence a alteração?" Se a resposta for "a ninguém" ou "a dois", há problema.

## Para aprofundar

- Exercício: pegue `git ls-files` e, para cada pasta de primeiro nível, diga o dono segundo a tabela atual. Quantas ficam sem dono?
- Pergunta: testes unitários ficam junto do código (`src/**/x.test.ts`) ou em pasta separada? Como isso muda quem é dono?
- Pergunta: por que o orquestrador também precisa de uma linha na tabela?

## Links

- Tarefa: [[docs/03-tarefas/T-002-qa-revisa-arquivos-antes-adr]]
- Relacionadas: [[hooks-pretooluse-e-bypass-via-bash]], [[revisao-de-consistencia-documental]]
