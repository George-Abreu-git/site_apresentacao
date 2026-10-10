---
id: T-002
titulo: QA revisa todos os arquivos atuais antes da ADR de stack
status: concluida
modo: agente-faz
tags: [qa]
rodadas: 0
criada: 2026-10-09
---

# T-002 — QA revisa todos os arquivos atuais antes da ADR de stack

## Descrição

Antes de registrar a ADR de stack, o QA revisa todos os arquivos atuais do projeto (agentes, skills, comandos, docs, templates e scripts) para encontrar inconsistências, lacunas e contradições entre eles.
O objetivo é chegar à ADR com a base de orquestração e documentação coerente.

## Critérios de aceite

- [x] O QA percorre todos os arquivos atuais do repositório (`.claude/`, `docs/`, `scripts/`, `AGENTS.md`, `CLAUDE.md`)
- [x] Inconsistências e lacunas encontradas são listadas no handoff, com arquivo e severidade
- [x] `python3 scripts/validar_estrutura.py` roda e o resultado é reportado
- [x] Nada é alterado fora da área do QA; correções ficam como achados para o George decidir

## Contexto relevante

- [[docs/03-tarefas/T-001-hooks-restricao-escrita|T-001]] depende da ADR de stack, que vem depois desta revisão.

## Decisões

- 2026-10-09 — George escolheu a opção C: fluxo reduzido, sem implementador nem code-reviewer. O QA revisa e entrega os achados no handoff; o instrutor fecha com a nota de estudo. As tags passaram de `infra, release` para `qa`, porque a tarefa é uma revisão e não implementação de infra.

## Dev

## Revisão

## QA

### Rodada 1

**Resultado:** PASSOU — critérios de aceite atendidos; 5 achados de severidade média (M1–M5) e 14 de baixa (B1–B14), nenhum bloqueante. O QA não alterou nenhum arquivo.

Escopo: 34 arquivos versionados e 2 não versionados — `.claude/` (5 agentes, 9 skills, 3 comandos), `docs/`, `scripts/`, `.obsidian/`, `.gitignore`, `AGENTS.md`, `CLAUDE.md`.

**Validador:** `python3 scripts/validar_estrutura.py` saiu com código 0 — `OK: estrutura válida (base, docs, skills, agentes, comandos)`. No Windows o `python3` aponta para o alias da Microsoft Store (Python 3.14.7); no Git Bash os acentos aparecem quebrados (só exibição, ver B13).

#### Severidade média

**M1. Falta o levantamento de requisitos antes da ADR de stack.**
- Arquivos: `docs/00-visao/README.md`, `docs/01-requisitos/README.md`, `AGENTS.md`, descrição da T-002, spec §2 e §9.
- Não existem `docs/00-visao/visao.md` nem `docs/01-requisitos/requisitos.md`; só READMEs-esqueleto. O `AGENTS.md` cita uma "visão completa" que não existe.
- A spec define a ordem requisitos → ADR de stack. A T-002 fala em "antes da ADR" sem citar os requisitos. `qa` e `dev` são instruídos a ler RF/RNF, e nenhum existe.
- Sugestão: rodar `levantar-requisitos` antes da ADR de stack e deixar a dependência explícita no backlog (T-001 → ADR → requisitos).

**M2. Não existe fluxo formal para tarefa de revisão (como a T-002).**
- Arquivos: `orquestrar-tarefa/SKILL.md`, `agents/qa.md`, `commands/nova-tarefa.md`, `AGENTS.md`.
- A decisão do George (QA → instrutor, tag `qa`) está só em `## Decisões` da T-002. Pela skill, tag `qa` cairia no `dev`; uma nova sessão pode ignorar a decisão.
- O `qa.md` é acionado "depois do APROVADO do code-reviewer" e altera só testes; não prevê revisão documental nem "achados". A tag `qa` não está no vocabulário do `/nova-tarefa`.
- Sugestão: modo "revisão" na `orquestrar-tarefa`; passo de revisão documental no `qa.md`; tag `qa` no `nova-tarefa`.

**M3. As áreas por caminho do `AGENTS.md` se sobrepõem e têm lacunas.**
- `**/*.test.*` está na área do qa, mas o dev faz TDD e escreve testes; a área do dev é só `src/**`, então testes do dev seriam sinalizados errado na conferência.
- Sem dono: `scripts/**` (inclui o validador), `.gitignore`, `.obsidian/**`, configs na raiz (`package.json`, `.env.example`), `docs/**` (exceto `03-tarefas` e `04-estudos`) e `.claude/agents|skills|commands`. O `devops.md` cita "scripts de build", mas `scripts/**` não está na área dele. Não há linha do orquestrador.
- As áreas já são provisórias até a ADR de stack.
- Sugestão: definir na ADR quem escreve testes unitários (dev) e o que é do qa (e2e/aceitação); dar dono a `scripts/**`, configs da raiz e `docs/**`; incluir a linha do orquestrador.

**M4. Os hooks da T-001 não cobrem escrita via Bash.**
- Arquivo: `T-001-hooks-restricao-escrita.md`.
- dev, qa, devops e code-reviewer têm `Bash`; um hook em `Edit|Write` não impede `echo > arquivo`, `sed -i` ou `git checkout` em `docs/03-tarefas/`. O "somente leitura" do code-reviewer vale só por instrução. Falta verificar se o hook sabe qual subagente está agindo.
- Sugestão: critério para Bash (matcher `Bash` com caminhos protegidos, ou retirar Bash do qa/code-reviewer) e critérios para devops e code-reviewer.

**M5. Sequência de encerramento ambígua na `orquestrar-tarefa`.**
- O passo 2 marca `concluida` e commita; só no passo 3 rodam testes e validador, e se falharem o status vira `aguardando-decisao` sem dizer se o commit `concluida` é desfeito. "Rode a suíte completa" ignora que ainda não há suíte nem `src/`.
- Sugestão: verificar (testes + validador) antes de marcar `concluida`; escrever "sem suíte ainda: só o validador".

#### Severidade baixa

- **B1.** `registrar-decisao/SKILL.md` (linha 3): `description` com `": "` no valor, YAML inválido em parser estrito; o validador usa parser próprio e não detecta. Reescrever sem `": "` ou pôr aspas.
- **B2.** `scripts/validar_estrutura.py`: listas fixas (skill nova não é checada); exige "T-001" literal no backlog (linha 98); não valida `status`/`modo`, links `[[ ]]`, consistência backlog ↔ notas, `tools` coerentes com o papel nem a nota de estudo.
- **B3.** Plano `2026-10-09-estrutura-orquestracao-plano.md` desatualizado: status `em-revisao` com checkboxes vazios; Tarefa 5 com skills divergentes das reais e instrutor só com `Write` (real: `Edit` também); "8 skills" (são 9); Tarefa 6 fala em perguntar sobre merge (agora é automático); Tarefa 7 cria uma "T-002" fictícia (id já usado); restrição global ainda diz "3 voltas ao Dev". Spec: tabela §6 omite o devops como usuário de `definition-of-done`; §10 (teste a seco) sem registro.
- **B4.** `.gitignore`: `.env.*` ignoraria `.env.example` (acrescentar `!.env.example`); faltam `__pycache__/`, `*.pyc`, `.venv/`, `coverage/`, `.next/`. Revisar na ADR de stack.
- **B5.** `.obsidian/appearance.json` e `core-plugins.json` não versionados nem ignorados (George decide); `core-plugins.json` ativa `sync`, `daily-notes` e `bases`; `.gitignore` não cobre `.obsidian/plugins/` nem `.trash/`.
- **B6.** Sem `.gitattributes` e com `core.autocrlf=true`; sugestão `* text=auto eol=lf`.
- **B7.** `docs/02-arquitetura/README.md` usa links curtos; o restante (e o commit `c5ad20a`) usa caminho completo. Padronizar.
- **B8.** Templates: `tarefa.md` gera `# {{title}}` (notas reais usam `# T-XXX — título`), `titulo:` vazio, `criada:` sem aspas; `adr.md` sem documentar os `status` válidos nem link de ADR substituída; `nota-estudo.md` com `tarefa:` vazio e sem formato `[[...]]`.
- **B9.** Vocabulário de tags inconsistente entre `nova-tarefa`, `nota-de-estudo`, T-001 e T-002. Definir um só, num lugar só (ex.: `AGENTS.md`).
- **B10.** `commit-convencional` fixa `Co-Authored-By: Claude <noreply@anthropic.com>`; deveria seguir a atribuição vigente da sessão.
- **B11.** `nova-tarefa` passo 5: "mudanças não commitadas" ambíguo com arquivos não rastreados; não define a regra do `<slug>`.
- **B12.** Skills "exclusivas da sessão principal" (`orquestrar-tarefa`, `levantar-requisitos`, `registrar-decisao`) são visíveis aos subagentes; só a instrução textual impede o uso. Reavaliar com a T-001.
- **B13.** Saída do validador com acento quebrado em console cp1252; usar `sys.stdout.reconfigure(encoding="utf-8")` ou documentar `python -X utf8`.
- **B14.** `AGENTS.md`: árvore omite `.obsidian/` e `.gitignore`; code-reviewer "somente leitura" mas com `Bash` (ver M4); dev "Código e testes" mas caminho só `src/**` (ver M3).

#### Critérios de aceite
- [x] Percorreu `.claude/`, `docs/`, `scripts/`, `AGENTS.md`, `CLAUDE.md` (e também `.obsidian/` e `.gitignore`)
- [x] Achados listados com arquivo e severidade
- [x] `validar_estrutura.py` rodou e retornou OK
- [x] Nada alterado; correções ficam para o George decidir

**Decisão pendente (não bloqueia o encerramento):** como formalizar tarefas de revisão (tag `qa`) — A) modo "revisão" na `orquestrar-tarefa` (recomendada pelo QA); B) manter por tarefa em `## Decisões`; C) comando `/revisar <T-XXX>`.

## Estudo

### Rodada 1

**Resultado:** CONCLUIDO — o instrutor (modo explicador) explicou a revisão e criou 6 notas de estudo, uma por conceito, com exemplos reais do projeto, exercícios e links cruzados.

Notas criadas:
- [[docs/04-estudos/revisao-de-consistencia-documental|Revisão de consistência documental]]
- [[docs/04-estudos/hooks-pretooluse-e-bypass-via-bash|Hooks PreToolUse e bypass via Bash]]
- [[docs/04-estudos/areas-por-caminho-de-escrita|Áreas por caminho de escrita]]
- [[docs/04-estudos/yaml-frontmatter|YAML frontmatter]]
- [[docs/04-estudos/gitattributes-e-fim-de-linha|.gitattributes e fim de linha]]
- [[docs/04-estudos/ordem-requisitos-e-adr|Ordem entre requisitos e ADR]]

Exercícios sugeridos: (1) rodar `git ls-files` e apontar o dono de cada pasta pela tabela do `AGENTS.md`, comparando com o M3; (2) validar a linha 3 de `registrar-decisao/SKILL.md` num validador YAML e corrigi-la de duas formas.

Decisões que seguem com o George: formalizar tarefas de revisão (A/B/C, ver `## QA`); ordem entre requisitos, ADR e T-001; como fechar a brecha do `Bash` nos hooks.

## DevOps

## Log

- 2026-10-09 — tarefa criada
- 2026-10-09 — orquestrador: início — decisão do George (opção C), tags `qa`, fluxo reduzido (QA → instrutor)
- 2026-10-09 — qa: PASSOU — 5 achados médios (M1–M5), 14 baixos (B1–B14), validador OK, nenhum arquivo alterado
- 2026-10-09 — instrutor: CONCLUIDO — 6 notas de estudo em `docs/04-estudos/`
- 2026-10-09 — orquestrador: tarefa concluída — validador OK (sem suíte de testes, ainda não há `src/`)
