---
id: T-004
titulo: Atualizar AGENTS.md com a stack e as áreas por caminho da ADR-0001
status: em-qa
modo: agente-faz
tags: [orquestracao]
rodadas: 0
criada: 2026-10-10
---

# T-004 — Atualizar AGENTS.md com a stack e as áreas por caminho da ADR-0001

## Descrição

Atualiza o `AGENTS.md` (seção Stack, árvore de pastas e tabela "Áreas por caminho") conforme as consequências da ADR-0001, e ajusta o `.gitignore` para projetos Node.

## Critérios de aceite

- [ ] Seção Stack do `AGENTS.md` resume a ADR-0001 e linka para ela
- [ ] Árvore de pastas inclui `apps/web/`, `apps/api/`, `packages/shared/`, `e2e/`
- [ ] Áreas por caminho: dev → `apps/**` e `packages/**` (incluindo testes unitários junto do código); qa → `e2e/**` e `apps/api/test/**`; devops → plataforma + configs de deploy e CI; nenhuma sobreposição entre dev e qa
- [ ] `.gitignore` cobre `node_modules/`, `dist/`, `coverage/`, `playwright-report/`, `test-results/`, `.env*` (mantendo `!.env.example`)
- [ ] `python3 scripts/validar_estrutura.py` passa

## Contexto relevante

- Depende de: —
- [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).

## Dev

## Revisão

### Rodada 1

**Resultado:** APROVADO — o commit `5eb5741` atende os 5 critérios de aceite; alterações só na área do devops (`AGENTS.md`, `.gitignore`); `.claude/agents/**` não foi tocado; sem segredos.

- **Stack** (`AGENTS.md:42-52`): bate com a seção "Decisão" da ADR-0001, traz as consequências (RNF-03, RNF-05, token só no Render) e mantém "tecnologia nova = decisão do George".
- **Árvore** (`AGENTS.md:30-36`): `apps/web/`, `apps/api/` (com `apps/api/test/`), `packages/shared/`, `e2e/`; `src/` saiu; linha sobre npm workspaces.
- **Áreas:** exceção explícita na linha do dev e frase em `AGENTS.md:100` garantem que dev e qa não se sobrepõem, conforme as "Consequências" da ADR-0001.
- **`.gitignore`:** conferido com `git check-ignore --no-index` (node_modules, dist, coverage, playwright-report, test-results, `.env*` ignorados; `.env.example` não, inclusive em `apps/api/`).
- **Validador:** OK, código 0.
- **Remoção de "Sequência inicial":** cabe no escopo — era subseção de `## Stack`, estava obsoleta e contradiria a seção nova; a ordem está preservada em `backlog.md:21`. A troca da frase de "Sobre o projeto" (`AGENTS.md:9`) também é aceitável.

**Opcionais (não aplicados, ficam para o George decidir):**
1. Falta linha em branco antes de `## Regras de escrita` (`AGENTS.md:100-101`).
2. A ressalva "exceto arquivos de infra" saiu da área do dev, e `Dockerfile*` do devops não se limita à raiz; um eventual `apps/api/Dockerfile` cairia em dev e devops. Tratar na tarefa de setup e deploy, junto com o dono de `playwright.config.*` e `tsconfig*.json`.
3. `AGENTS.md:95`: "(notas e backlog) os commits" — falta o "e" (erro anterior ao diff).

## QA

## Estudo

## DevOps

### Rodada 1

**Resultado:** CONCLUIDO — os 5 critérios de aceite foram implementados; validador OK (código 0). Arquivos em UTF-8; sem commit do agente.

- **Stack:** "A definir" virou uma tabela-resumo da ADR-0001 com link, mais as consequências que valem para todo agente (partida a frio RNF-03, CORS RNF-05, token do GitHub só no Render).
- **Sequência inicial:** subseção removida (passos 1 e 2 concluídos; a dependência da T-001 está no backlog). A linha "Sobre o projeto" que dizia que a visão não existia foi atualizada.
- **Árvore de pastas:** sai `src/`; entram `apps/web/`, `apps/api/` (com `apps/api/test/`), `packages/shared/` e `e2e/`, mais uma linha sobre o monorepo com npm workspaces.
- **Áreas por caminho:** dev → `apps/**` e `packages/**` **exceto `apps/api/test/**`** (inclui testes unitários junto do código e configs de cada app); qa → `e2e/**` e `apps/api/test/**` (sai `tests/**`); devops → plataforma, CI e deploy (configs na raiz, ex.: `render.yaml`, `wrangler.*`) e configs da raiz, incluindo `package.json` de workspaces e `package-lock.json`. Uma frase abaixo da tabela explicita que dev e qa não se sobrepõem. O aviso de áreas "provisórias" saiu.
- **`.gitignore`:** acrescentados `coverage/`, `playwright-report/`, `test-results/` e `!.env.example`. Conferido com `git check-ignore`: `.env`, `.env.local`, `apps/web/node_modules`, `apps/web/dist`, `coverage`, `e2e/playwright-report` e `test-results` ignorados; `.env.example` não.

Arquivos alterados: `AGENTS.md`, `.gitignore`.

**Pendências (fora do escopo):**
1. `.claude/agents/dev.md:24`, `qa.md:23` e `devops.md:26` ainda citam `src/**` e `tests/**`; alinhar exige aprovação do George (sugestão: nova tarefa).
2. `.claude/skills/orquestrar-tarefa/SKILL.md:56` usa "enquanto não houver `src/`" como gatilho da suíte de testes; ajustar para `apps/` em tarefa própria.
3. Dono de `playwright.config.*` e `tsconfig*.json` na raiz não definido; decidir na tarefa de setup do monorepo e do Playwright.

## Log

- 2026-10-10 — tarefa criada
- 2026-10-10 — orquestrador: início — implementador devops (tag `orquestracao`)
- 2026-10-10 — devops: CONCLUIDO — Stack, árvore, áreas e `.gitignore` atualizados; validador OK
- 2026-10-10 — code-reviewer: APROVADO — 5 critérios atendidos; remoção de "Sequência inicial" no escopo; 3 opcionais
