# AGENTS.md — Site_Apresentação_George

Regras do projeto para qualquer agente de código (Claude Code, Copilot, etc.).

## Sobre o projeto

Site pessoal de apresentação do George: portfólio, stacks, projetos e contato, navegável e responsivo.
Além do produto, o projeto é uma **trilha de aprendizado** de front-end, back-end, API e integração entre front e back.
Por isso, clareza e explicação importam tanto quanto o código. Visão completa: `docs/00-visao/`.

## Idioma

Todo conteúdo (docs, notas, mensagens de commit, comentários explicativos) em **português**.
Nomes no código seguem a convenção da stack escolhida.

## Estrutura de pastas

```
AGENTS.md / CLAUDE.md   contexto principal
.claude/agents/         subagentes (dev, code-reviewer, qa, instrutor, devops)
.claude/skills/         skills compartilhadas e de orquestração
.claude/commands/       /nova-tarefa, /executar-tarefa, /estudar
docs/00-visao/          visão, objetivos, público
docs/01-requisitos/     requisitos funcionais (RF-XX) e não funcionais (RNF-XX)
docs/02-arquitetura/    ADRs, specs e planos
docs/03-tarefas/        backlog.md + uma nota por tarefa (T-XXX-<slug>.md)
docs/04-estudos/        notas de estudo do Instrutor
docs/_templates/        templates (tarefa, ADR, nota de estudo)
scripts/                utilitários (ex.: validar_estrutura.py)
src/                    código — criado após a ADR de stack (monorepo)
```

## Stack

**A definir** — será registrada como ADR em `docs/02-arquitetura/`. Até lá, nenhum agente escolhe tecnologia por conta própria.

## Convenções de git

- Branch principal: `main`. Uma branch por tarefa: `feat/T-XXX-<slug>`.
- Commits convencionais em português (detalhes na skill `commit-convencional`).
- Quem commita é o orquestrador (sessão principal). Agentes sugerem a mensagem no handoff.

## Definition of Done

Uma tarefa só está pronta quando cumpre o checklist da skill `definition-of-done`
(critérios de aceite, testes verdes, sem segredos, responsivo, acessível, cada agente na sua área, nota de estudo criada).

## Regra de decisões

Toda decisão não coberta por ADR, requisito ou tarefa é do **George**.
Ela é apresentada com **3 opções, 3 prós e 3 contras cada, e uma recomendação** (skill `apresentar-decisao`).
Subagentes não decidem: registram a decisão no handoff e devolvem com `AGUARDANDO-DECISAO`.

## Papéis dos agentes

| Agente | Papel | Pode alterar |
|---|---|---|
| dev | Implementa a tarefa com TDD | Código e testes da tarefa |
| code-reviewer | Revisa o diff (convenções, segurança, legibilidade, área de cada agente) | Nada (somente leitura) |
| qa | Valida critérios de aceite, responsividade e acessibilidade | Apenas arquivos de teste |
| instrutor | Guia (modo `eu-faco`) ou explica (modo `agente-faz`) | Apenas `docs/04-estudos/` |
| devops | Implementador de tarefas com tag `infra`/`release` (CI, ambientes, deploy, hooks) | Apenas arquivos de infra |

## Áreas por caminho

Usadas pelo orquestrador para conferir os arquivos alterados por cada agente. **Provisórias** — serão ajustadas na ADR de stack.

| Agente | Caminhos permitidos |
|---|---|
| dev | `src/**` (exceto arquivos de infra) |
| qa | `**/tests/**`, `**/*.test.*`, `**/*.spec.*`, `e2e/**` |
| instrutor | `docs/04-estudos/**` |
| devops | `.github/**`, `infra/**`, `Dockerfile*`, `docker-compose*`, `.claude/settings.json`, `.claude/hooks/**` |
| todos | nunca `docs/03-tarefas/**` (só o orquestrador) |

## Regras de escrita

- **Agentes nunca editam a nota da tarefa.** Terminam com um bloco `## Handoff` (formato em `atualizar-tarefa`); o orquestrador transcreve.
- Cada agente altera apenas a sua área (tabela acima). O orquestrador confere após cada agente (`git status`); o code-reviewer confere no diff do implementador.
- Limite de retrabalho: 3 voltas ao implementador por tarefa (code-reviewer + qa somados); na 4ª a tarefa fica `bloqueada`. Se o George escolher mais rodadas, o contador é zerado.
