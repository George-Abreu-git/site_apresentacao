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

### Antes: o diagnóstico da T-002 (histórico)

> Esta subseção descreve a tabela **como era antes da T-003**. Ela foi mantida porque mostra o raciocínio do achado; a tabela vigente está na subseção seguinte.

O achado **M3** da T-002 mostrou os três problemas na tabela de `AGENTS.md` daquela época:

- **Sobreposição**: `**/*.test.*` estava na área do **qa**, mas o dev faz TDD (escreve testes). Como a área do dev era só `src/**`, os testes do dev seriam sinalizados como violação.
- **Lacunas (sem dono)**: `scripts/**` (inclui o validador), `.gitignore`, `.obsidian/**`, configs da raiz (`package.json`, `.env.example`), `docs/**` fora de `03-tarefas` e `04-estudos`, e `.claude/agents|skills|commands`. Nem o orquestrador tinha linha na tabela.
- **Incoerência**: o `devops.md` citava "scripts de build", mas `scripts/**` não estava na área do devops (também **B14**: dev "código e testes" vs. caminho só `src/**`).

As áreas já eram declaradas **provisórias** até a ADR de stack, porque ainda não existem `src/` nem pastas de teste. O QA sugeriu definir quem escreve testes unitários (dev) e o que é do qa (e2e/aceitação), e dar dono às lacunas. O George decidiu não esperar a ADR e corrigir isso na T-003.

### Depois: a tabela vigente (T-003)

Na [[docs/03-tarefas/T-003-corrige-achados-t002|T-003]] o devops reescreveu a tabela de `AGENTS.md`. Veja como cada problema foi resolvido:

| Problema (T-002) | Como ficou (T-003) |
|---|---|
| Sobreposição dev × qa nos testes | **dev**: `src/**`, incluindo os **testes unitários** junto do código. **qa**: só testes de **aceitação/e2e** em `tests/**` e `e2e/**` na raiz. Um padrão como `**/*.test.*` não aparece mais em duas linhas. |
| `scripts/**`, `.gitignore`, `.obsidian/**`, configs da raiz sem dono | Agora são do **devops**, que virou o **dono da plataforma** (veja [[dono-da-plataforma-e-aprovacao-humana]]). |
| `docs/**` fora de `03` e `04` e `.claude/agents\|skills\|commands` sem dono | Também do **devops**, com duas ressalvas: ele **não cria ADRs** e não escreve visão/requisitos (isso nasce das skills `registrar-decisao` e `levantar-requisitos`, conduzidas pelo orquestrador). |
| Orquestrador sem linha | Ganhou linha: `docs/03-tarefas/**`, os commits e os arquivos que as skills `registrar-decisao` e `levantar-requisitos` mandam criar. |
| `devops.md` cita scripts, mas a área não tinha `scripts/**` | Resolvido: `scripts/**` está na área do devops. |

Duas regras novas acompanham a tabela:

- **Todos os subagentes: nunca `docs/03-tarefas/**`** (só o orquestrador escreve nas notas de tarefa).
- **`.claude/agents/**` exige aprovação do George**, mesmo estando na área do devops: nenhum agente muda a própria definição sozinho.

Repare numa sobreposição que **continua existindo, mas é explícita e coerente**: `docs/02-arquitetura/`, `docs/00-visao/` e `docs/01-requisitos/` aparecem para o devops e para o orquestrador. O code-reviewer aceitou porque a divisão é clara: o devops edita specs e planos; o orquestrador cria ADRs, visão e requisitos pelas skills. É a propriedade 1 ("ou a exceção é explícita").

A tabela continua **provisória**: quando a ADR de stack definir as pastas reais de teste, as linhas de dev e qa podem mudar.

## Exemplo

Resumo da tabela vigente em `AGENTS.md` (abreviado; o texto completo está lá):

```
| Agente        | Caminhos permitidos                                              |
| dev           | src/** (inclui testes unitários junto do código)                 |
| qa            | tests/**, e2e/** (aceitação/e2e); na tag revisao, nenhum arquivo |
| instrutor     | docs/04-estudos/**                                               |
| devops        | .github/**, infra/**, Docker*, .claude/**, AGENTS.md, CLAUDE.md, |
|               | scripts/**, configs da raiz, docs/** exceto 03-tarefas e 04      |
| orquestrador  | docs/03-tarefas/**, commits, ADRs e visão/requisitos via skills  |
| subagentes    | nunca docs/03-tarefas/**                                         |
```

Pergunta de teste para qualquer linha: "se eu alterar este arquivo, a quem pertence a alteração?" Se a resposta for "a ninguém" ou "a dois" (sem regra que desempate), há problema. Faça o teste com `src/components/Header.test.tsx` (dev), `e2e/contato.spec.ts` (qa) e `scripts/validar_estrutura.py` (devops).

## Para aprofundar

- Exercício: pegue `git ls-files` e, para cada pasta de primeiro nível, diga o dono segundo a tabela **vigente** (T-003). Sobra alguma sem dono? (Dica: compare com a lista de lacunas da T-002.)
- Pergunta: a T-003 decidiu que testes unitários ficam junto do código (`src/**/x.test.ts`). Se a ADR de stack escolher uma pasta separada `tests/unit/`, qual linha da tabela teria de mudar, e por quê haveria nova sobreposição com o qa?
- Pergunta: por que o orquestrador também precisa de uma linha na tabela, se ele não é um subagente?

## Links

- Tarefas: [[docs/03-tarefas/T-002-qa-revisa-arquivos-antes-adr]] (diagnóstico), [[docs/03-tarefas/T-003-corrige-achados-t002]] (correção)
- Relacionadas: [[hooks-pretooluse-e-bypass-via-bash]], [[revisao-de-consistencia-documental]], [[dono-da-plataforma-e-aprovacao-humana]]
