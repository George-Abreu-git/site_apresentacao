---
id: T-003
titulo: Corrigir achados médios da T-002, formalizar o modo revisão e normalizar fim de linha
status: em-andamento
modo: agente-faz
tags: [orquestracao, docs]
rodadas: 1
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
- 2026-10-09 — orquestrador: as edições em `.claude/agents/` desta tarefa decorrem de critérios definidos pelo George — `qa.md` (M2, revisão documental) e `devops.md` (dono da plataforma); `dev.md` foi ajustado como consequência do M3 (testes unitários do dev). **Pendente:** o George confirmar explicitamente a alteração do `dev.md` ao fechar a tarefa, já que a regra nova exige aprovação dele para `.claude/agents/**`.

## Dev

## Revisão

### Rodada 1

**Resultado:** AJUSTES — os critérios de aceite estão atendidos e o validador passa; há 2 ajustes de coerência. As 3 interpretações do devops foram avaliadas como aceitáveis (`tests/**` e `e2e/**` como área do qa; `FALHOU` no modo `revisao` vai ao George sem contar rodada — regra que nasceu da interpretação do devops e não constava na nota; tag `revisao` prevalece sobre `modo`).

**Ajustes pedidos:**
1. `AGENTS.md` (linha do orquestrador): diz "nenhum outro arquivo", mas as skills `registrar-decisao` (ADRs em `docs/02-arquitetura/`) e `levantar-requisitos` (`docs/00-visao/visao.md`, `docs/01-requisitos/requisitos.md`) mandam o orquestrador escrever fora de `03-tarefas`. Ajustar a frase e alinhar a mesma frase na spec, na linha "Áreas de dev e qa (T-003)".
2. `devops.md` ("O que pode alterar") e `AGENTS.md` (linha do devops): a ressalva "ADR só via decisão" se perdeu e `docs/**` passou a cobrir `docs/02-arquitetura/`. Acrescentar que ADRs (`docs/02-arquitetura/ADR-*`) não são criadas pelo devops (ele devolve `AGUARDANDO-DECISAO` e o orquestrador cria via `registrar-decisao`) e que `docs/00-visao/**` e `docs/01-requisitos/**` nascem do levantamento de requisitos, conduzido pela sessão principal.

**Pendências do orquestrador (tratadas):**
- B6 (`git status` limpo): resolvido com `git add --renormalize .`; sobram só os 2 arquivos `.obsidian/` não rastreados, que ficam para o George decidir (commitar ou ignorar).
- Aprovação das mudanças em `.claude/agents/`: ver `## Decisões`.

**Opcionais (não aplicados, ficam para o George decidir):**
- Modo `revisao`, passo 1: "`git status --porcelain` deve ficar limpo" é frágil; sugestão "sem alterações novas em relação ao status capturado antes de chamar o qa".
- Spec, linha "Implementador de infra": acrescentar `orquestracao`.
- `AGENTS.md`, "Sequência inicial": deixar explícito que a ordem vale para o produto e que tarefas de plataforma (`orquestracao`, `docs`, `revisao`) não entram nela.

## QA

## Estudo

## DevOps

### Rodada 1

**Resultado:** CONCLUIDO — o devops aplicou B6, M1 (parcial), M2, M3, M4, M5 e a regra de dono da plataforma, e atualizou a spec. O validador passou (`OK: base, docs, skills, agentes, comandos`). O devops não fez commits.

**B6 (primeiro passo):** `.gitattributes` com `* text=auto eol=lf` criado; `git add --renormalize .` não gerou mudança (o índice já estava em LF). Sete arquivos (nota da T-002 e as 6 notas de `docs/04-estudos/`) continuam com CRLF no disco e aparecem como modificados só pelo cache de status; não têm diferença de conteúdo e ficam em LF no próximo checkout.

**Por critério:**
- **M5:** o Encerramento da `orquestrar-tarefa` agora é DoD → verificação (testes + validador) → `concluida` + backlog + commit → merge/push. Sem `src/` nem suíte, roda só o validador. Se a verificação falhar: `aguardando-decisao`, sem `concluida` e sem merge.
- **M2:** `orquestrar-tarefa` ganhou a seção "Modo `revisao`" (QA → Instrutor, sem implementador nem code-reviewer); `qa.md` ganhou "Revisão documental" (achados com arquivo e severidade, sem alterar arquivos); `nova-tarefa` lista `orquestracao`, `docs` e `revisao` entre as tags.
- **M3:** tabela de áreas do `AGENTS.md` reescrita: dev com `src/**` (incluindo testes unitários), qa com `tests/**` e `e2e/**` na raiz, devops com a área de plataforma completa, linha do orquestrador (`docs/03-tarefas/**`) e linha "todos os subagentes: nunca `docs/03-tarefas/**`"; regra de que `.claude/agents/**` exige aprovação do George. Ajustados também `dev.md` e `carregar-contexto`.
- **Dono da plataforma:** `AGENTS.md`, `devops.md`, `orquestrar-tarefa` e a spec registram tag `orquestracao` → devops e a nova área. A spec ganhou linhas nas tabelas de decisões e de agentes, um bloco "Modo revisao" no §5, uma nota de encerramento no §5 e ajuste no §9.
- **M4:** a nota da T-001 ganhou critérios para `Bash` (matcher com caminhos protegidos, ou retirar `Bash` do qa/code-reviewer por decisão do George), para devops, para code-reviewer, para identificar o subagente e para exigir aprovação do George em `.claude/agents/**`.
- **M1 (parcial):** `AGENTS.md` não cita mais uma "visão completa" inexistente e ganhou a seção "Sequência inicial (ordem obrigatória)"; a descrição da T-001 registra a ordem. A linha do backlog foi aplicada pelo orquestrador.

**Interpretações do devops para o code-reviewer olhar:**
- `tests/**` e `e2e/**` na raiz como área do qa, no lugar de `**/tests/**`, `*.test.*`, `*.spec.*` (elimina a sobreposição com o dev); tabela segue provisória até a ADR de stack.
- No modo `revisao`, `FALHOU` vai ao George como `aguardando-decisao`, sem contar rodada (não há implementador). A nota não definia isso.
- A tag `revisao` prevalece sobre o campo `modo` da nota.

**Fora do escopo (como pedido):** B1–B5 e B7–B14. O B13 (acentos no console do Windows) continua exigindo `PYTHONUTF8=1`.

Arquivos alterados: `.gitattributes` (novo), `AGENTS.md`, `.claude/agents/{devops,qa,dev}.md`, `.claude/commands/nova-tarefa.md`, `.claude/skills/{orquestrar-tarefa,carregar-contexto}/SKILL.md`, spec da orquestração, `docs/03-tarefas/T-001-hooks-restricao-escrita.md`, `scripts/validar_estrutura.py` (acrescentado `.gitattributes` à lista da base).

Commits feitos pelo orquestrador: `36f0a29` (B6), `3bdcfba` (M2, M3, M5, M1 parcial, dono da plataforma), `92de6bd` (M4).

## Log

- 2026-10-09 — tarefa criada
- 2026-10-09 — orquestrador: início — implementador devops (decisão do George), área ampliada vigente nesta tarefa
- 2026-10-09 — devops: CONCLUIDO — B6, M1–M5 e dono da plataforma aplicados; validador OK
- 2026-10-09 — code-reviewer: AJUSTES — 2 ajustes de coerência (área do orquestrador; ressalva de ADR do devops); rodadas = 1
