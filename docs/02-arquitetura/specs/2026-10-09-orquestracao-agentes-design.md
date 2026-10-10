---
tipo: spec
status: aprovada
data: 2026-10-09
tags: [orquestracao, agentes, skills, contexto]
---

# Spec — Orquestração de agentes do projeto Site_Apresentação_George

## 1. Objetivo

Montar a estrutura de arquivos de contexto, subagentes, skills e comandos que permita desenvolver o site de apresentação pessoal (portfólio, stacks, projetos, contato — navegável e responsivo) por meio de orquestração de agentes, servindo também como trilha de aprendizado de front-end, back-end, API e integração.

**Critérios de sucesso**
- Rodar `/nova-tarefa` e `/executar-tarefa` no Claude Code (VS Code) e ver o fluxo Implementador (Dev ou DevOps) → Reviewer → QA → Encerramento (→ Documentador em segundo plano) acontecer com status registrado na nota da tarefa.
- Abrir a pasta como vault no Obsidian e navegar entre requisitos, ADRs, tarefas e notas de estudo por links `[[ ]]`.
- Cada agente lê apenas o contexto do seu papel.

**Fora de escopo nesta etapa:** escolha da stack, código do site, pipeline real de CI/CD. Isso vem nas fases seguintes (requisitos → ADR de stack → tarefas).

## 2. Decisões tomadas

| Decisão | Escolha |
|---|---|
| Ferramenta | Claude Code como motor; `AGENTS.md` espelha regras para outras ferramentas |
| Obsidian | Vault = pasta inteira do projeto |
| Instrutor | Mentor no modo `eu-faco` e tira-dúvidas interativo no `/estudar`. Desde a T-014 não explica mais no fim do `agente-faz`, não fecha o `eu-faco` e não consolida (decisão Q3-B do George) |
| Documentação de estudo (T-014) | Fora do caminho crítico: **o fluxo da tarefa termina quando o QA passa** (verificação → `concluida` → merge → push); aí o orquestrador dispara o `documentador` em paralelo (`background: true`) num git worktree isolado (`isolation: worktree`, criado a partir de `origin/main` já com a tarefa) e a próxima tarefa começa sem esperar por ele (ex.: o QA passa a T-006 → o documentador documenta a T-006 enquanto a T-007 já começa). O produto dele é o **diário** `docs/04-estudos/tarefas/T-XXX.md`; como instrutor e documentador leem e gravam em `docs/04-estudos/**`, ele também pode consultar e, se necessário, atualizar outras notas de estudo. O resultado entra na `main` pela branch `estudos/T-XXX`, só com o validador (exceção registrada no `AGENTS.md`), sem interromper a tarefa seguinte; conflito no rebase vai ao George, sem forçar. Falha do documentador só vai para o Log. Notas por conceito nascem sob demanda: no `/estudar` (instrutor) ou na consolidação dos diários (`/estudar-consolidar`), também feita pelo documentador, do mesmo jeito (segundo plano, worktree a partir de `origin/main`), e integrada pela branch `estudos/consolidacao-AAAA-MM-DD` com o mesmo procedimento (Q3-B) |
| Stack | Definida no levantamento de requisitos, registrada como ADR |
| Orquestrador | A sessão principal do Claude Code (subagentes não chamam outros subagentes) |
| Idioma | Português |
| Limite de retrabalho | 3 voltas ao implementador por tarefa, somando Reviewer e QA; se o George escolher mais rodadas, o contador é zerado |
| Decisões | Sempre apresentadas ao George com 3 opções × 3 prós × 3 contras + recomendação (skill `apresentar-decisao`, no estilo grilling); o George decide |
| Repositório | Monorepo (front e back no mesmo repo), branch principal `main`, branches por tarefa `feat/T-XXX-...`; layout interno definido na ADR de stack |
| Versionamento | Git ativo; o orquestrador commita automaticamente ao fim de cada etapa seguindo `commit-convencional` (dev/devops sugerem a mensagem no handoff) |
| Integração | Testes + validador verdes → merge local em `main` e push para `origin` (github.com/George-Abreu-git/site_apresentacao); falhou → decisão do George. Exceção (T-014): as branches de estudo (`estudos/T-XXX`, `estudos/consolidacao-*`) só alteram Markdown e entram com o validador verde, sem a suíte |
| Escrita na nota da tarefa | Só o orquestrador escreve; agentes devolvem um bloco `## Handoff` no formato definido por `atualizar-tarefa` |
| Implementador de infra | Tarefas `infra`/`release` são implementadas pelo DevOps no lugar do Dev (DevOps → Reviewer → QA → Encerramento) |
| Dono da plataforma (T-003) | O DevOps é dono da plataforma: orquestração (`.claude/**`, `AGENTS.md`, `CLAUDE.md`), `scripts/**`, configs da raiz (`.gitignore`, `.gitattributes`, `.obsidian/**`) e `docs/**` exceto `03-tarefas` e `04-estudos`. Tarefas com tag `orquestracao` são implementadas por ele. Mudança em `.claude/agents/**` exige aprovação do George |
| Tarefas de revisão (T-003) | Tag `revisao`: modo próprio, QA → Encerramento (com o diário do documentador desde a T-014), sem implementador e sem code-reviewer; o QA só lê e lista achados (arquivo + severidade) |
| Áreas de dev e qa (T-003) | Testes unitários são do dev (em `src/**`, junto do código); testes de aceitação/e2e são do qa (`tests/**`, `e2e/**`). O orquestrador tem linha própria na tabela: `docs/03-tarefas/**`, os commits, e os arquivos que as skills `registrar-decisao` (ADRs) e `levantar-requisitos` (visão e requisitos) mandam a sessão principal criar |
| Fim de linha (T-003) | `.gitattributes` com `* text=auto eol=lf`: o repositório e o checkout usam LF |
| Restrição de escrita por agente | Por instrução no prompt + conferência do orquestrador (`git status` vs. "Áreas por caminho" do AGENTS.md) após cada agente + checagem do Code-Reviewer, com commits de código e de nota separados; hooks `PreToolUse` depois da ADR de stack (tarefa T-001 no backlog) |
| Modelo dos agentes | `model: inherit` em todos (troca de modelo centralizada na sessão) |

## 3. Estrutura de pastas

```
Site_Apresentação_George/
├── CLAUDE.md              # entrada do Claude Code; importa @AGENTS.md + regras de orquestração
├── AGENTS.md              # regras do projeto, convenções, Definition of Done (agnóstico)
├── .claude/
│   ├── agents/            # dev.md, code-reviewer.md, qa.md, instrutor.md, devops.md, documentador.md
│   ├── skills/            # uma pasta por skill, cada uma com SKILL.md
│   ├── commands/          # nova-tarefa.md, executar-tarefa.md, estudar.md, estudar-consolidar.md
│   └── worktrees/         # worktrees temporários dos subagentes isolados (ignorado pelo git)
├── docs/
│   ├── 00-visao/          # visão, objetivos, público
│   ├── 01-requisitos/     # funcionais, não funcionais, histórias
│   ├── 02-arquitetura/    # ADRs e specs
│   ├── 03-tarefas/        # backlog.md + uma nota por tarefa
│   ├── 04-estudos/        # notas por conceito (Instrutor no /estudar; Documentador no /estudar-consolidar) + tarefas/T-XXX.md (diários do Documentador)
│   └── _templates/        # tarefa.md, adr.md, nota-estudo.md, diario-estudo.md
├── .obsidian/             # config mínima: templates em docs/_templates, ignorar node_modules/dist/build
└── src/                   # criado após a ADR de stack
```

## 4. Agentes (`.claude/agents/`)

| Agente | Responsabilidade | Ferramentas / escrita | Saída |
|---|---|---|---|
| dev | Implementa a tarefa com TDD seguindo ADRs e AGENTS.md | Read, Grep, Glob, Edit, Write, Bash | Seção "Dev" na nota da tarefa: arquivos alterados, decisões, pendências |
| code-reviewer | Revisa o diff: convenções, segurança, legibilidade, aderência à tarefa | Read, Grep, Glob, Bash (somente git diff/log) — sem edição | `APROVADO` ou `AJUSTES` com lista numerada |
| qa | Valida critérios de aceite, responsividade, acessibilidade; escreve/roda testes de aceitação; faz a revisão documental nas tarefas `revisao` | Read, Grep, Glob, Bash, Edit/Write apenas em pastas de teste de aceitação/e2e (nenhuma na revisão documental) | `PASSOU` ou `FALHOU` com bugs reproduzíveis; na revisão, achados com arquivo e severidade |
| instrutor | `eu-faco`: mentor que guia o George passo a passo sem escrever o código (não fecha a tarefa). Sob demanda: `/estudar <tema>`, tira-dúvidas interativo | Read, Grep, Glob, Edit, Write apenas em `docs/04-estudos/` | Guia em `## Estudo`; nota por conceito com links `[[ ]]` no `/estudar` |
| documentador | Sempre em segundo plano e num worktree isolado. (1) Disparado no fim do encerramento de toda tarefa (inclusive `eu-faco`), em paralelo à tarefa seguinte: escreve o diário da tarefa a partir da nota dela; pode consultar e, se necessário, atualizar outras notas de estudo. (2) `/estudar-consolidar`: consolida os diários pendentes em notas por conceito | Read, Grep, Glob, Write, Edit apenas em `docs/04-estudos/` (igual ao instrutor); `background: true`, `isolation: worktree` | Diário `docs/04-estudos/tarefas/T-XXX.md` (`consolidado: false`); na consolidação, notas por conceito e diários `consolidado: true` |
| devops | Implementador de tarefas com tag `infra`, `release` ou `orquestracao`; dono da plataforma (CI, ambientes, deploy, hooks, orquestração, `scripts/**`, configs da raiz, `docs/**` exceto `03-tarefas`/`04-estudos`) | Read, Grep, Glob, Edit/Write na área de plataforma, Bash | Configuração ou checklist de deploy |

Cada agente: descrição clara de quando é usado, lista do que lê (via skill `carregar-contexto`), formato fixo de saída e retorno obrigatório em bloco `## Handoff` (formato de `atualizar-tarefa`). Agentes não editam a nota da tarefa; o orquestrador transcreve.

## 5. Fluxo de orquestração

Conduzido pela sessão principal com a skill `orquestrar-tarefa`, disparada por `/executar-tarefa <id>`.

**Modo `agente-faz`**
1. Ler a nota da tarefa; status → `em-andamento`.
2. Implementador (Dev; ou DevOps se a tarefa tem tag `infra`, `release` ou `orquestracao`) implementa.
3. Code-Reviewer revisa. Se `AJUSTES` → volta ao implementador.
4. QA valida. Se `FALHOU` → volta ao implementador.
5. Encerramento (abaixo), que termina disparando o Documentador.

**Modo `revisao`** (tag `revisao`, qualquer `modo`)
1. Status → `em-qa`; o QA faz a revisão documental (só lê; nenhum arquivo alterado) e devolve os achados com arquivo e severidade.
2. Encerramento (dispara o Documentador). Sem implementador, não há rodadas de retrabalho; `FALHOU` (revisão não cumprida) vai ao George como decisão.

**Modo `eu-faco`**
1. Instrutor guia; George codifica.
2. Quando George sinaliza que terminou: Reviewer → QA (ajustes voltam para George, com dicas do Instrutor).
3. Encerramento logo após o QA passar, igual ao `agente-faz` (dispara o Documentador em paralelo, que lê os guias do Instrutor). O Instrutor não fecha o `eu-faco` nem escreve nota de estudo no fechamento.

**Encerramento (todos os modos):** primeiro a verificação (suíte de testes + `scripts/validar_estrutura.py`; sem `apps/` nem suíte, só o validador); só se estiver verde o status vira `concluida`, o backlog é atualizado e a branch é integrada em `main` (merge + push). Falhou → `aguardando-decisao`, sem `concluida` e sem merge. Por último, o orquestrador dispara o Documentador e não espera por ele. **O fluxo da tarefa termina aqui**, quando o QA passa e a tarefa é integrada: a próxima tarefa pode começar enquanto o Documentador trabalha em paralelo.

**Diário de estudo em paralelo (T-014):** o Documentador roda em segundo plano num worktree que o Claude Code cria a partir de `origin/main` (por isso o push vem antes do disparo). Quando ele termina, o orquestrador, sem trocar a branch do checkout principal, confere a área (qualquer arquivo em `docs/04-estudos/**`, com o diário presente), cria `estudos/T-XXX` no worktree, commita as alterações de estudo e a transcrição do handoff na nota da tarefa, roda **só o validador** (exceção das branches de estudo no `AGENTS.md`), faz rebase na `main`, avança a `main` por fast-forward, faz push e remove o worktree. Conflito no rebase (ex.: a mesma nota por conceito mudou na `main`) → `rebase --abort`, nada é forçado nem descartado, e o George decide. Se ele falhar, o orquestrador só registra no Log da tarefa. Passo a passo em `orquestrar-tarefa`.

**Limite de retrabalho:** no máximo 3 voltas ao implementador por tarefa (somando Reviewer e QA). Na quarta, o fluxo para, status → `bloqueada`, e o orquestrador pede decisão ao George. Se ele escolher mais rodadas, `rodadas` volta a 0.

**Handoff:** os agentes não compartilham conversa; tudo que um precisa do outro está na nota da tarefa.

**Decisões no meio do fluxo:** se um subagente encontra uma decisão que não está coberta por ADR, requisito ou pela tarefa, ele não decide sozinho. Ele para, registra a decisão no campo "Decisão pendente" do Handoff usando o formato de `apresentar-decisao` e devolve ao orquestrador com status `aguardando-decisao`. O orquestrador apresenta ao George, registra a escolha (na tarefa ou como ADR via `registrar-decisao`) e retoma o fluxo.

**Commits:** ao final de cada etapa que altera arquivos, o orquestrador commita seguindo `commit-convencional`, referenciando o id da tarefa.

## 6. Skills (`.claude/skills/`)

Compartilhadas:
| Skill | Propósito | Usada por |
|---|---|---|
| carregar-contexto | Mapa "papel → arquivos a ler", evitando leitura do projeto inteiro | todos |
| atualizar-tarefa | Contrato do bloco `## Handoff` que os agentes devolvem (as regras de escrita do orquestrador ficam em `orquestrar-tarefa`) | todos |
| definition-of-done | Checklist único de "pronto" | dev, code-reviewer, qa |
| registrar-decisao | Criar ADR a partir do template | sessão principal |
| nota-de-estudo | Os dois formatos Obsidian: diário por tarefa (`tarefas/T-XXX.md`) e nota por conceito (conceito, por que, exemplo do projeto, links) | documentador (diário e consolidação em notas por conceito), instrutor (nota por conceito no `/estudar`); os outros sugerem conceitos |
| commit-convencional | Conventional Commits e nomes de branch | dev, devops, sessão principal |
| apresentar-decisao | Formato obrigatório de decisão: 3 opções, 3 prós e 3 contras cada, recomendação; perguntas numeradas em rodadas (estilo grilling). Subagentes registram e devolvem; só a sessão principal pergunta ao George | todos |

Exclusivas da sessão principal:
| Skill | Propósito |
|---|---|
| orquestrar-tarefa | O fluxo da seção 5 |
| levantar-requisitos | Entrevista o George e preenche `00-visao` e `01-requisitos` |

## 7. Comandos (`.claude/commands/`)

- `/nova-tarefa` — cria nota em `docs/03-tarefas/` a partir do template; pergunta título, critérios de aceite, modo (`eu-faco`/`agente-faz`) e tags.
- `/executar-tarefa <id>` — roda `orquestrar-tarefa`.
- `/estudar <tema>` — chama o Instrutor sob demanda para tirar uma dúvida na hora (interativo).
- `/estudar-consolidar [T-XXX ...]` — o Documentador, em segundo plano e num worktree a partir de `origin/main`, transforma os diários com `consolidado: false` em notas por conceito e marca os diários como `consolidado: true`; o orquestrador integra pela branch `estudos/consolidacao-AAAA-MM-DD`, com o mesmo procedimento da branch de estudos.

## 8. Nota de tarefa (template)

Frontmatter: `id`, `titulo`, `status` (`backlog | em-andamento | em-revisao | em-qa | aguardando-decisao | bloqueada | concluida`), `modo` (`eu-faco | agente-faz`), `tags`, `rodadas` (contador de retrabalho), `criada`.
Seções: Descrição, Critérios de aceite, Contexto relevante (links), Decisões, Dev, Revisão, QA, Estudo, DevOps, Log.

## 9. Próximas fases

1. Criar a estrutura desta spec (plano de implementação via writing-plans).
2. Rodar `levantar-requisitos`.
3. ADR da stack.
4. T-001 (hooks de restrição de escrita, depende da ADR) e demais tarefas no backlog.

A ordem é obrigatória: levantamento de requisitos → ADR de stack → T-001 (registrada também no `AGENTS.md`).

## 10. Verificação

- Todos os arquivos existem e têm frontmatter válido.
- `git log` mostra commits convencionais gerados pelo fluxo.
- Um teste a seco: criar uma tarefa fictícia com `/nova-tarefa` e rodar `/executar-tarefa` para ver os agentes acionados e a nota atualizada.
- Obsidian abre o vault, templates funcionam, pastas de build ignoradas.
