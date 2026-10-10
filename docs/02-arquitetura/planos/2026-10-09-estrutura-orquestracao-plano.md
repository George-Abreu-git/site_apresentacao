---
tipo: plano
status: em-revisao
data: 2026-10-09
spec: "[[2026-10-09-orquestracao-agentes-design]]"
---

# Estrutura de orquestração — Plano de implementação

> **Para agentes executores:** use superpowers:subagent-driven-development ou superpowers:executing-plans, tarefa a tarefa. Passos em checkbox (`- [ ]`).

**Objetivo:** criar todos os arquivos de contexto, skills, agentes, comandos e docs da spec, validados por um script.

**Arquitetura:** a sessão principal do Claude Code é o orquestrador (CLAUDE.md + skill `orquestrar-tarefa`); 5 subagentes em `.claude/agents/` com skills pré-carregadas via campo `skills`; estado em notas `.md` por tarefa, escritas só pelo orquestrador.

**Tecnologias:** Markdown + YAML frontmatter (Claude Code), Obsidian, Git, Python 3 (só stdlib) para o validador.

**Spec:** `docs/02-arquitetura/specs/2026-10-09-orquestracao-agentes-design.md`

## Restrições globais

- Todo conteúdo em português.
- Frontmatter de agente: `name`, `description`, `tools`, `model: inherit`, `skills`, `color`. Nomes sem `:`.
- Frontmatter de skill: `name` (igual ao nome da pasta), `description` (diz *quando* usar).
- IDs de tarefa: `T-XXX` (3 dígitos); arquivo `docs/03-tarefas/T-XXX-<slug>.md`; branch `feat/T-XXX-<slug>`; branch principal `main`.
- Status válidos: `backlog | em-andamento | em-revisao | em-qa | aguardando-decisao | bloqueada | concluida`.
- Modos: `eu-faco | agente-faz`. Limite: 3 voltas ao Dev por tarefa (Reviewer + QA somados); na 4ª → `bloqueada`.
- Decisões: sempre 3 opções × 3 prós × 3 contras + recomendação; só a sessão principal pergunta ao George.
- Agentes nunca editam a nota da tarefa; terminam com bloco `## Handoff`.
- Commits convencionais com rodapé de coautoria; o orquestrador commita.

## Pontos de atenção na revisão

1. Skill citada no `skills:` de um agente sem pasta correspondente → o validador deve acusar `ERRO: agente <x> referencia skill inexistente <y>`.
2. `name` da skill diferente do nome da pasta → Claude Code não a encontra; validador acusa.
3. Agente sem `## Handoff` no corpo → orquestrador não consegue transcrever; validador acusa.
4. Obsidian indexando `node_modules/`/`dist/` futuramente → `userIgnoreFilters` em `.obsidian/app.json`.
5. Template de tarefa sem alguma seção da spec §8 → validador checa cada cabeçalho.

---

## Mapa de arquivos

```
scripts/validar_estrutura.py
.gitignore
.obsidian/app.json, .obsidian/templates.json
AGENTS.md, CLAUDE.md
docs/00-visao/README.md, docs/01-requisitos/README.md, docs/02-arquitetura/README.md,
docs/03-tarefas/backlog.md, docs/04-estudos/README.md
docs/_templates/tarefa.md, adr.md, nota-estudo.md
.claude/skills/<8 skills>/SKILL.md
.claude/agents/dev.md, code-reviewer.md, qa.md, instrutor.md, devops.md
.claude/commands/nova-tarefa.md, executar-tarefa.md, estudar.md
```

---

### Tarefa 1: Validador da estrutura

**Arquivos:** criar `scripts/validar_estrutura.py`

**Interface produzida:** `python3 scripts/validar_estrutura.py [--grupo base|docs|skills|agentes|comandos]` (sem argumento = todos). Imprime uma linha `FALTA: <caminho>` ou `ERRO: <mensagem>` por problema e sai com código 1; sem problemas imprime `OK: estrutura válida (<grupos>)` e sai com 0.

Regras por grupo:
- **base:** existem `AGENTS.md`, `CLAUDE.md`, `.gitignore`, `.obsidian/app.json`, `.obsidian/templates.json`; `CLAUDE.md` contém `@AGENTS.md`.
- **docs:** existem os 5 READMEs/backlog e os 3 templates do mapa; `tarefa.md` tem as chaves `id, titulo, status, modo, tags, rodadas, criada` e os cabeçalhos `## Descrição`, `## Critérios de aceite`, `## Contexto relevante`, `## Decisões`, `## Dev`, `## Revisão`, `## QA`, `## Estudo`, `## DevOps`, `## Log`; `backlog.md` contém `T-001`.
- **skills:** as 8 pastas existem com `SKILL.md`; `name` == nome da pasta; `description` não vazio.
- **agentes:** os 5 arquivos existem; `name`, `description`, `tools` não vazios; `model == inherit`; cada item de `skills` tem pasta em `.claude/skills/`; corpo contém `## Handoff`.
- **comandos:** os 3 arquivos existem com `description` não vazio.

Parser de frontmatter próprio (sem PyYAML): bloco entre `---`, `chave: valor`, listas `- item` em bloco e `[a, b]` em linha.

- [ ] **Passo 1:** escrever o script.
- [ ] **Passo 2:** rodar `python3 scripts/validar_estrutura.py` → esperado: código 1 com várias linhas `FALTA:` (prova que o teste falha).
- [ ] **Passo 3:** commit `chore(scripts): adiciona validador da estrutura de orquestração`.

### Tarefa 2: Base — contexto principal, git e Obsidian

**Arquivos:** criar `AGENTS.md`, `CLAUDE.md`, `.gitignore`, `.obsidian/app.json`, `.obsidian/templates.json`

- **AGENTS.md** (agnóstico), seções: Sobre o projeto (objetivo do site + aprendizado; link para `docs/00-visao`), Idioma, Estrutura de pastas, Stack (`A definir — ver ADRs em docs/02-arquitetura/`), Convenções de git (commits convencionais, `main`, `feat/T-XXX-<slug>`), Definition of Done (resumo + skill), Regra de decisões (3×3×3, George decide), Papéis dos agentes (tabela da spec §4), Regras de escrita (agentes não editam notas de tarefa; cada agente só edita sua área — ver tabela).
- **CLAUDE.md:** primeira linha `@AGENTS.md`; seção "Você é o orquestrador": usar `orquestrar-tarefa` para `/executar-tarefa`, `levantar-requisitos` para requisitos, delegar aos 5 agentes, ser o único a falar com o George, a escrever notas de tarefa e a commitar; usar `apresentar-decisao` para toda decisão.
- **.gitignore:** `node_modules/`, `dist/`, `build/`, `.env`, `.env.*`, `.obsidian/workspace*.json`, `.obsidian/cache`, `.claude/settings.local.json`, `.DS_Store`, `Thumbs.db`.
- **.obsidian/app.json:** `{"userIgnoreFilters": ["node_modules/", "dist/", "build/"]}`; **templates.json:** `{"folder": "docs/_templates"}`.

- [ ] **Passo 1:** criar os arquivos.
- [ ] **Passo 2:** `python3 scripts/validar_estrutura.py --grupo base` → `OK`.
- [ ] **Passo 3:** commit `chore: adiciona AGENTS.md, CLAUDE.md, gitignore e config do Obsidian`.

### Tarefa 3: Docs e templates

**Arquivos:** criar os READMEs de `00-visao`, `01-requisitos`, `02-arquitetura`, `04-estudos`; `03-tarefas/backlog.md`; `_templates/tarefa.md`, `adr.md`, `nota-estudo.md`.

- READMEs: 1 parágrafo do propósito da pasta + quem escreve nela + links `[[ ]]` relevantes. `02-arquitetura/README.md` lista a spec e o plano e explica a numeração `ADR-XXXX-<slug>.md`.
- **backlog.md:** tabela `| ID | Título | Status | Modo | Tags |` com a linha `T-001 | Hooks PreToolUse de restrição de escrita por agente | backlog | agente-faz | infra, orquestracao` e nota "depende da ADR de stack".
- **tarefa.md:** frontmatter da spec §8 com placeholders do Obsidian (`{{date}}`) e status `backlog`, `rodadas: 0`; seções da spec §8.
- **adr.md:** frontmatter `tipo: adr, numero, status (proposta|aceita|substituida), data`; seções Contexto, Opções (3 × prós/contras), Decisão, Consequências.
- **nota-estudo.md:** frontmatter `tipo: estudo, tarefa, tags, data`; seções Conceito, Por que importa, Como aparece no projeto, Exemplo, Para aprofundar, Links.

- [ ] **Passo 1:** criar os arquivos.
- [ ] **Passo 2:** `--grupo docs` → `OK`.
- [ ] **Passo 3:** commit `docs: adiciona estrutura de docs, backlog e templates do Obsidian`.

### Tarefa 4: Skills compartilhadas

**Arquivos:** criar `.claude/skills/<nome>/SKILL.md` para: `carregar-contexto`, `atualizar-tarefa`, `definition-of-done`, `registrar-decisao`, `nota-de-estudo`, `commit-convencional`, `apresentar-decisao`.

Conteúdo mínimo de cada uma:
- **carregar-contexto:** tabela papel → arquivos a ler (sempre `AGENTS.md` + nota da tarefa; dev: ADRs + arquivos citados; code-reviewer: `git diff` da branch + DoD; qa: critérios de aceite + diff; instrutor: nota da tarefa + handoffs + `04-estudos` existentes; devops: ADRs de infra). Regra: não ler o repositório inteiro.
- **atualizar-tarefa:** (1) contrato do bloco que todo agente devolve:
  ```
  ## Handoff — <agente> — <T-XXX>
  Resultado: CONCLUIDO | APROVADO | AJUSTES | PASSOU | FALHOU | AGUARDANDO-DECISAO
  Resumo:
  Arquivos alterados:
  Pendências:
  Decisão pendente: (bloco apresentar-decisao) | nenhuma
  Conceitos para estudo:
  Mensagem de commit sugerida:
  ```
  (2) regras do orquestrador: transcrever o handoff na seção do papel, atualizar `status`, incrementar `rodadas` em AJUSTES/FALHOU, adicionar linha datada no `## Log`, atualizar `backlog.md`.
- **definition-of-done:** checklist: critérios de aceite atendidos; testes novos passando e suíte verde; sem segredos no código; responsivo (mobile/desktop) quando houver UI; acessibilidade básica (semântica, contraste, alt); só arquivos da área do agente alterados; nota de estudo criada.
- **registrar-decisao:** criar `docs/02-arquitetura/ADR-XXXX-<slug>.md` a partir do template, próximo número sequencial, com as 3 opções apresentadas e a escolha do George; linkar na tarefa.
- **nota-de-estudo:** usar o template; um conceito por nota; nome `docs/04-estudos/<conceito-em-kebab>.md`; linkar tarefa e notas relacionadas; atualizar nota existente em vez de duplicar.
- **commit-convencional:** tipos `feat, fix, docs, style, refactor, test, chore, ci`; escopo opcional; mensagem em português no imperativo; referência `T-XXX` no corpo; rodapé de coautoria; branches `feat/T-XXX-<slug>`.
- **apresentar-decisao:** quando é decisão (algo não coberto por ADR/requisito/tarefa); formato de rodada numerada (❓ **Q1** — título, opções A/B/C com 3 ✅ e 3 ❌ cada, ➡️ recomendação); subagente devolve com `AGUARDANDO-DECISAO`; só a sessão principal pergunta; registrar a escolha (tarefa ou ADR).

- [ ] **Passo 1:** criar as 7 skills.
- [ ] **Passo 2:** `--grupo skills` → esperado ainda `FALTA` só para `orquestrar-tarefa` e `levantar-requisitos` (criadas na Tarefa 6).
- [ ] **Passo 3:** commit `feat(skills): adiciona skills compartilhadas dos agentes`.

### Tarefa 5: Agentes

**Arquivos:** criar `.claude/agents/{dev,code-reviewer,qa,instrutor,devops}.md`

| Agente | tools | skills | color |
|---|---|---|---|
| dev | Read, Grep, Glob, Edit, Write, Bash | carregar-contexto, atualizar-tarefa, definition-of-done, commit-convencional, registrar-decisao, apresentar-decisao | blue |
| code-reviewer | Read, Grep, Glob, Bash | carregar-contexto, atualizar-tarefa, definition-of-done, apresentar-decisao | red |
| qa | Read, Grep, Glob, Edit, Write, Bash | carregar-contexto, atualizar-tarefa, definition-of-done, apresentar-decisao | green |
| instrutor | Read, Grep, Glob, Write | carregar-contexto, atualizar-tarefa, nota-de-estudo, apresentar-decisao | purple |
| devops | Read, Grep, Glob, Edit, Write, Bash | carregar-contexto, atualizar-tarefa, commit-convencional, registrar-decisao, apresentar-decisao | orange |

Todos com `model: inherit`. Corpo de cada um: Papel; Quando é acionado; O que pode alterar (e o que nunca altera — sempre inclui "a nota da tarefa"); Passo a passo; Formato de saída `## Handoff` (referência a `atualizar-tarefa`).
Específicos: dev usa TDD e não commita; code-reviewer não altera arquivos e usa Bash só para `git diff`/`git log`, e verifica se cada agente ficou na sua área; qa só altera arquivos de teste; instrutor tem os dois modos (`eu-faco`: guia em passos, dá dicas, nunca escreve código de produção; `agente-faz`: explica e cria nota) e só escreve em `docs/04-estudos/`; devops só atua com tag `infra`/`release`.

- [ ] **Passo 1:** criar os 5 agentes.
- [ ] **Passo 2:** `--grupo agentes` → `OK`.
- [ ] **Passo 3:** commit `feat(agents): adiciona subagentes dev, code-reviewer, qa, instrutor e devops`.

### Tarefa 6: Orquestração e comandos

**Arquivos:** criar `.claude/skills/orquestrar-tarefa/SKILL.md`, `.claude/skills/levantar-requisitos/SKILL.md`, `.claude/commands/{nova-tarefa,executar-tarefa,estudar}.md`

- **orquestrar-tarefa:** fluxo da spec §5 nos dois modos, como passos numerados; antes de cada etapa: atualizar status; depois: transcrever handoff, commitar; regra das 3 voltas → `bloqueada` + `apresentar-decisao`; `AGUARDANDO-DECISAO` → perguntar ao George, registrar, retomar; criar branch `feat/T-XXX-<slug>` no início e, ao concluir, perguntar ao George (formato de decisão) se faz merge em `main`.
- **levantar-requisitos:** entrevista em rodadas (estilo grilling) cobrindo: público, objetivos, seções/páginas, conteúdo, contato, requisitos não funcionais (responsividade, desempenho, acessibilidade, SEO, hospedagem); grava `docs/00-visao/visao.md` e `docs/01-requisitos/requisitos.md` (RF-XX, RNF-XX); termina sugerindo a ADR de stack.
- **nova-tarefa** (`argument-hint: <título>`): próximo `T-XXX`, perguntar critérios de aceite, modo e tags, criar a nota pelo template, adicionar ao backlog, commitar.
- **executar-tarefa** (`argument-hint: <T-XXX>`): carregar `orquestrar-tarefa` e executar.
- **estudar** (`argument-hint: <tema>`): acionar o instrutor sob demanda, gerando ou atualizando a nota de estudo.

- [ ] **Passo 1:** criar os arquivos.
- [ ] **Passo 2:** `python3 scripts/validar_estrutura.py` (todos os grupos) → `OK: estrutura válida (base, docs, skills, agentes, comandos)`.
- [ ] **Passo 3:** commit `feat(orquestracao): adiciona skills de orquestração e comandos`.

### Tarefa 7: Teste a seco (George, no VS Code)

- [ ] **Passo 1:** abrir a pasta no Claude Code, rodar `/agents` → os 5 agentes aparecem.
- [ ] **Passo 2:** `/nova-tarefa Teste a seco` (modo `agente-faz`, critério: "criar `docs/04-estudos/teste.md`") → nota `T-002` criada e no backlog.
- [ ] **Passo 3:** `/executar-tarefa T-002` → Dev → Reviewer → QA → Instrutor acionados; nota com handoffs, status `concluida`, commits no `git log`.
- [ ] **Passo 4:** abrir o vault no Obsidian → templates em `docs/_templates` funcionam; links navegáveis.
- [ ] **Passo 5:** remover a tarefa de teste e seus arquivos; commit `chore: remove tarefa de teste a seco`; marcar spec e plano como `concluida`.
