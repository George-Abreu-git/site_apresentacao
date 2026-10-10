---
tipo: spec
status: em-revisao
data: 2026-10-09
tags: [orquestracao, agentes, skills, contexto]
---

# Spec — Orquestração de agentes do projeto Site_Apresentação_George

## 1. Objetivo

Montar a estrutura de arquivos de contexto, subagentes, skills e comandos que permita desenvolver o site de apresentação pessoal (portfólio, stacks, projetos, contato — navegável e responsivo) por meio de orquestração de agentes, servindo também como trilha de aprendizado de front-end, back-end, API e integração.

**Critérios de sucesso**
- Rodar `/nova-tarefa` e `/executar-tarefa` no Claude Code (VS Code) e ver o fluxo Dev → Reviewer → QA → Instrutor (→ DevOps) acontecer com status registrado na nota da tarefa.
- Abrir a pasta como vault no Obsidian e navegar entre requisitos, ADRs, tarefas e notas de estudo por links `[[ ]]`.
- Cada agente lê apenas o contexto do seu papel.

**Fora de escopo nesta etapa:** escolha da stack, código do site, pipeline real de CI/CD. Isso vem nas fases seguintes (requisitos → ADR de stack → tarefas).

## 2. Decisões tomadas

| Decisão | Escolha |
|---|---|
| Ferramenta | Claude Code como motor; `AGENTS.md` espelha regras para outras ferramentas |
| Obsidian | Vault = pasta inteira do projeto |
| Instrutor | Híbrido por tarefa: modo `eu-faco` (mentor) ou `agente-faz` (explica depois) |
| Stack | Definida no levantamento de requisitos, registrada como ADR |
| Orquestrador | A sessão principal do Claude Code (subagentes não chamam outros subagentes) |
| Idioma | Português |
| Limite de retrabalho | 3 voltas ao Dev por tarefa, somando Reviewer e QA |
| Decisões | Sempre apresentadas ao George com 3 opções × 3 prós × 3 contras + recomendação (skill `apresentar-decisao`, no estilo grilling); o George decide |
| Repositório | Monorepo (front e back no mesmo repo), branch principal `main`, branches por tarefa `feat/T-XXX-...`; layout interno definido na ADR de stack |
| Versionamento | Git ativo; agentes (dev, devops) e sessão principal commitam automaticamente seguindo `commit-convencional` |

## 3. Estrutura de pastas

```
Site_Apresentação_George/
├── CLAUDE.md              # entrada do Claude Code; importa @AGENTS.md + regras de orquestração
├── AGENTS.md              # regras do projeto, convenções, Definition of Done (agnóstico)
├── .claude/
│   ├── agents/            # dev.md, code-reviewer.md, qa.md, instrutor.md, devops.md
│   ├── skills/            # uma pasta por skill, cada uma com SKILL.md
│   └── commands/          # nova-tarefa.md, executar-tarefa.md, estudar.md
├── docs/
│   ├── 00-visao/          # visão, objetivos, público
│   ├── 01-requisitos/     # funcionais, não funcionais, histórias
│   ├── 02-arquitetura/    # ADRs e specs
│   ├── 03-tarefas/        # backlog.md + uma nota por tarefa
│   ├── 04-estudos/        # notas do Instrutor
│   └── _templates/        # tarefa.md, adr.md, nota-estudo.md
├── .obsidian/             # config mínima: templates em docs/_templates, ignorar node_modules/dist/build
└── src/                   # criado após a ADR de stack
```

## 4. Agentes (`.claude/agents/`)

| Agente | Responsabilidade | Ferramentas / escrita | Saída |
|---|---|---|---|
| dev | Implementa a tarefa com TDD seguindo ADRs e AGENTS.md | Read, Grep, Glob, Edit, Write, Bash | Seção "Dev" na nota da tarefa: arquivos alterados, decisões, pendências |
| code-reviewer | Revisa o diff: convenções, segurança, legibilidade, aderência à tarefa | Read, Grep, Glob, Bash (somente git diff/log) — sem edição | `APROVADO` ou `AJUSTES` com lista numerada |
| qa | Valida critérios de aceite, responsividade, acessibilidade; escreve/roda testes de aceitação | Read, Grep, Glob, Bash, Edit/Write apenas em pastas de teste | `PASSOU` ou `FALHOU` com bugs reproduzíveis |
| instrutor | `eu-faco`: guia o George passo a passo sem escrever o código. `agente-faz`: explica o que foi feito e os conceitos | Read, Grep, Glob, Write apenas em `docs/04-estudos/` | Nota de estudo com links `[[ ]]` |
| devops | CI, ambientes, deploy; acionado só em tarefas com tag `infra` ou `release` | Read, Grep, Glob, Edit/Write em arquivos de infra, Bash | Configuração ou checklist de deploy |

Cada agente: descrição clara de quando é usado, lista do que lê (via skill `carregar-contexto`), formato fixo de saída e regra de atualizar a nota da tarefa (via `atualizar-tarefa`).

## 5. Fluxo de orquestração

Conduzido pela sessão principal com a skill `orquestrar-tarefa`, disparada por `/executar-tarefa <id>`.

**Modo `agente-faz`**
1. Ler a nota da tarefa; status → `em-andamento`.
2. Dev implementa.
3. Code-Reviewer revisa. Se `AJUSTES` → volta ao Dev.
4. QA valida. Se `FALHOU` → volta ao Dev.
5. Instrutor gera a nota de estudo.
6. DevOps, se a tarefa tiver tag `infra`/`release`.
7. Status → `concluida`; atualizar `backlog.md`.

**Modo `eu-faco`**
1. Instrutor guia; George codifica.
2. Quando George sinaliza que terminou: Reviewer → QA (ajustes voltam para George, com dicas do Instrutor).
3. Instrutor fecha com a nota de estudo; status → `concluida`.

**Limite de retrabalho:** no máximo 3 voltas ao Dev por tarefa (somando Reviewer e QA). Na quarta, o fluxo para, status → `bloqueada`, e o orquestrador pede decisão ao George.

**Handoff:** os agentes não compartilham conversa; tudo que um precisa do outro está na nota da tarefa.

**Decisões no meio do fluxo:** se um subagente encontra uma decisão que não está coberta por ADR, requisito ou pela tarefa, ele não decide sozinho. Ele para, registra a decisão na nota da tarefa usando o formato de `apresentar-decisao` e devolve ao orquestrador com status `aguardando-decisao`. O orquestrador apresenta ao George, registra a escolha (na tarefa ou como ADR via `registrar-decisao`) e retoma o fluxo.

**Commits:** ao final de cada etapa que altera arquivos, o orquestrador (ou dev/devops) commita seguindo `commit-convencional`, referenciando o id da tarefa.

## 6. Skills (`.claude/skills/`)

Compartilhadas:
| Skill | Propósito | Usada por |
|---|---|---|
| carregar-contexto | Mapa "papel → arquivos a ler", evitando leitura do projeto inteiro | todos |
| atualizar-tarefa | Formato padrão de status (frontmatter) e seção de handoff/log | todos |
| definition-of-done | Checklist único de "pronto" | dev, code-reviewer, qa |
| registrar-decisao | Criar ADR a partir do template | sessão principal, dev, devops |
| nota-de-estudo | Formato de nota Obsidian (conceito, por que, exemplo do projeto, links) | instrutor (outros sugerem conceitos) |
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
- `/estudar <tema>` — chama o Instrutor sob demanda.

## 8. Nota de tarefa (template)

Frontmatter: `id`, `titulo`, `status` (`backlog | em-andamento | em-revisao | em-qa | aguardando-decisao | bloqueada | concluida`), `modo` (`eu-faco | agente-faz`), `tags`, `rodadas` (contador de retrabalho), `criada`.
Seções: Descrição, Critérios de aceite, Contexto relevante (links), Decisões, Dev, Revisão, QA, Estudo, DevOps, Log.

## 9. Próximas fases

1. Criar a estrutura desta spec (plano de implementação via writing-plans).
2. Rodar `levantar-requisitos`.
3. ADR da stack.
4. Primeiras tarefas no backlog.

## 10. Verificação

- Todos os arquivos existem e têm frontmatter válido.
- `git log` mostra commits convencionais gerados pelo fluxo.
- Um teste a seco: criar uma tarefa fictícia com `/nova-tarefa` e rodar `/executar-tarefa` para ver os agentes acionados e a nota atualizada.
- Obsidian abre o vault, templates funcionam, pastas de build ignoradas.
