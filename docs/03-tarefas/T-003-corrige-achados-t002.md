---
id: T-003
titulo: Corrigir achados médios da T-002, formalizar o modo revisão e normalizar fim de linha
status: em-andamento
modo: agente-faz
tags: [orquestracao, docs]
rodadas: 0
criada: 2026-10-09
---

# T-003 — Corrigir achados médios da T-002, formalizar o modo revisão e normalizar fim de linha

## Descrição

Aplica as correções dos achados médios (M1–M5) da [[docs/03-tarefas/T-002-qa-revisa-arquivos-antes-adr|T-002]], o modo "revisão" e o `.gitattributes` (B6), conforme as decisões do George de 2026-10-09.
Os achados baixos (B1–B5, B7–B14) ficam para a ADR de stack ou para uma tarefa futura.

> **Atenção, orquestrador:** antes desta tarefa, 8 arquivos (nota da T-002, backlog e as 6 notas de estudo) aparecem como modificados só por diferença de fim de linha (CRLF/LF), sem mudança de conteúdo (`git diff --ignore-cr-at-eol` vazio). Eles **não** contam como alteração fora da área. O primeiro passo desta tarefa (critério 1) resolve isso.

## Critérios de aceite

- [ ] **B6 — fim de linha:** `.gitattributes` com `* text=auto eol=lf` + commit de normalização (`git add --renormalize .`); depois disso, `git status` fica limpo
- [ ] **M5 — encerramento:** a `orquestrar-tarefa` roda testes + validador **antes** de marcar `concluida`; sem `src/`/suíte, roda só o validador (escrito explicitamente)
- [ ] **M2 / Q2-A — modo revisão:** a `orquestrar-tarefa` tem um modo para a tag `revisao` (QA → Instrutor, sem implementador e sem code-reviewer); o `qa.md` tem o passo "revisão documental" (lista achados com arquivo e severidade, sem alterar arquivos); `nova-tarefa` lista `revisao` entre as tags
- [ ] **M3 — áreas:** a tabela "Áreas por caminho" do `AGENTS.md` dá dono a `scripts/**`, `.gitignore`, `.gitattributes`, `.obsidian/**`, configs da raiz, `docs/**` (exceto `03-tarefas` e `04-estudos`) e `.claude/agents|skills|commands`; tem a linha do orquestrador; testes unitários são do dev (junto do código) e testes de aceitação/e2e são do qa
- [ ] **Dono da plataforma:** `AGENTS.md`, `devops.md`, `orquestrar-tarefa` e a spec registram que tag `orquestracao` → implementador devops e a nova área do devops
- [ ] **M4 — hooks e Bash:** a nota da T-001 ganha critérios para escrita via `Bash` (caminhos protegidos), para o devops e o code-reviewer, para identificar qual subagente está agindo e para exigir aprovação do George em mudanças em `.claude/agents/**` (nenhum agente altera a própria definição sem aprovação)
- [ ] **M1 — ordem:** o backlog e o `AGENTS.md` deixam explícita a sequência levantamento de requisitos → ADR de stack → T-001; o `AGENTS.md` não cita mais uma "visão completa" inexistente sem dizer que ela vem do levantamento
- [ ] `python3 scripts/validar_estrutura.py` passa

## Contexto relevante

- Achados completos: `## QA` da [[docs/03-tarefas/T-002-qa-revisa-arquivos-antes-adr|T-002]]
- [[docs/02-arquitetura/specs/2026-10-09-orquestracao-agentes-design|Spec da orquestração]] (atualizar onde as regras mudarem)

## Decisões

- 2026-10-09 — George: tratar os achados numa única tarefa (M1–M5 + B6); formalizar o modo revisão (opção A); `.gitattributes` entra nesta tarefa (opção B).
- 2026-10-09 — George (opção B): o **DevOps é dono da plataforma** — orquestração (`.claude/**`, `AGENTS.md`, `CLAUDE.md`), `scripts/**`, configs da raiz (`.gitignore`, `.gitattributes`, `.obsidian/**`) e `docs/**` exceto `03-tarefas` e `04-estudos`. Tarefas com tag `orquestracao` são implementadas pelo **devops**. **Nesta tarefa** essa área já vale para o devops (a tabela do `AGENTS.md` é atualizada no critério M3).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-09 — tarefa criada
- 2026-10-09 — orquestrador: início — implementador devops (decisão do George), área ampliada vigente nesta tarefa
