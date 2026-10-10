# AGENTS.md — Site_Apresentação_George

Regras do projeto para qualquer agente de código (Claude Code, Copilot, etc.).

## Sobre o projeto

Site pessoal de apresentação do George: portfólio, stacks, projetos e contato, navegável e responsivo.
Além do produto, o projeto é uma **trilha de aprendizado** de front-end, back-end, API e integração entre front e back.
Por isso, clareza e explicação importam tanto quanto o código. Visão completa: `docs/00-visao/`; requisitos: `docs/01-requisitos/`.

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
apps/web/               front-end (React + Vite + TypeScript)
apps/api/               API (NestJS, um módulo por domínio; testes de rotas em apps/api/test/)
packages/shared/        tipos compartilhados entre front e API (ex.: Projeto)
e2e/                    testes de aceitação/e2e (Playwright)
```

O código é um **monorepo com npm workspaces** (`apps/*` e `packages/*`), conforme a ADR-0001.

## Stack

Definida na [ADR-0001 — Stack da v1](docs/02-arquitetura/ADR-0001-stack.md). Resumo:

| Camada | Escolha |
|---|---|
| Front-end | React + Vite + TypeScript, em `apps/web/` |
| Back-end | Node.js + TypeScript com NestJS, monolito modular (um módulo por domínio — v1: `projetos` e `github`), em `apps/api/` |
| Repositório | Monorepo com npm workspaces: `apps/web`, `apps/api`, `packages/shared` |
| Estilização | CSS Modules + variáveis de CSS |
| Testes | Vitest + Testing Library (unitários), Supertest (rotas da API), Playwright (aceitação/e2e) |
| Hospedagem v1 | Cloudflare Pages (front) + Render plano gratuito (API) |

Consequências que todo agente respeita: o front nunca bloqueia o conteúdo estático esperando a API (partida a frio, RNF-03); a API aceita só a origem do front publicado (CORS, RNF-05); o token do GitHub fica só em variável de ambiente no Render.
Qualquer tecnologia fora desta lista é decisão do George (nova ADR).

## Convenções de git

- Branch principal: `main`. Uma branch por tarefa: `feat/T-XXX-<slug>`.
- Commits convencionais em português (detalhes na skill `commit-convencional`).
- Quem commita é o orquestrador (sessão principal). Agentes sugerem a mensagem no handoff.
- Integração: com todos os testes e o validador passando, o orquestrador faz merge local em `main` e depois `git push origin main`. Se algo falhar, não há merge — o George decide.
- Remoto: `origin` → https://github.com/George-Abreu-git/site_apresentacao

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
| devops | Implementador de tarefas com tag `infra`, `release` ou `orquestracao`. **Dono da plataforma**: CI, ambientes, deploy, hooks, orquestração (`.claude/**`, `AGENTS.md`, `CLAUDE.md`), `scripts/**`, configs da raiz e `docs/**` (exceto `03-tarefas` e `04-estudos`). Não cria ADRs (`docs/02-arquitetura/ADR-*`): devolve `AGUARDANDO-DECISAO` e o orquestrador cria via `registrar-decisao`. `docs/00-visao/**` e `docs/01-requisitos/**` nascem do levantamento de requisitos, conduzido pela sessão principal | Apenas a área de plataforma (tabela abaixo) |

O **orquestrador** (sessão principal) não é um subagente: coordena o fluxo, escreve nas notas de tarefa e no backlog e faz os commits.

## Áreas por caminho

Usadas pelo orquestrador para conferir os arquivos alterados por cada agente. Definidas a partir das consequências da [ADR-0001](docs/02-arquitetura/ADR-0001-stack.md).

| Agente | Caminhos permitidos |
|---|---|
| dev | `apps/**` e `packages/**`, **exceto `apps/api/test/**`** (que é do qa). Inclui os **testes unitários** (`*.spec.ts`, `*.test.ts`, `*.test.tsx`), que ficam junto do código, e as configs de cada app/pacote (ex.: `apps/web/vite.config.ts`, `apps/api/package.json`) |
| qa | **Testes de aceitação/e2e**: `e2e/**` (Playwright) e `apps/api/test/**` (testes de rotas da API com Supertest). Na revisão documental (tag `revisao`), nenhum arquivo |
| instrutor | `docs/04-estudos/**` |
| devops | Plataforma: `.claude/**` (agentes, skills, comandos, `settings.json`, hooks), `AGENTS.md`, `CLAUDE.md`, `scripts/**`, `docs/**` exceto `docs/03-tarefas/**` e `docs/04-estudos/**`. CI e deploy: `.github/**`, `infra/**`, `Dockerfile*`, `docker-compose*`, configs de deploy na raiz (ex.: `render.yaml`, `wrangler.*`). Configs da raiz: `.gitignore`, `.gitattributes`, `.obsidian/**`, `package.json` (workspaces), `package-lock.json`, `.env.example` etc. |
| orquestrador | `docs/03-tarefas/**` (notas e backlog) os commits, e os arquivos que as skills `registrar-decisao` (ADRs) e `levantar-requisitos` (visão e requisitos) mandam a sessão principal criar |
| todos os subagentes | nunca `docs/03-tarefas/**` (só o orquestrador) |

Uma alteração em `.claude/agents/**` (a definição de um agente) exige **aprovação do George**, mesmo dentro da área do devops: nenhum agente altera a própria definição por conta própria. Na tarefa que pedir essa mudança, a aprovação é a decisão do George registrada em `## Decisões`.

Dev e qa não se sobrepõem: `apps/api/test/**` está dentro de `apps/**`, mas pertence só ao qa.

**`package-lock.json` é arquivo gerado** (decisão do George na T-005): o implementador da tarefa (dev ou devops) pode alterá-lo quando instala ou atualiza dependências (`npm install`), mesmo fora da sua área; ninguém o edita à mão. O code-reviewer confere o diff do lock (pacotes novos ou removidos devem corresponder às mudanças nos `package.json`).

**Lint** ([ADR-0002](docs/02-arquitetura/ADR-0002-lint.md)): a configuração do ESLint é única, em `eslint.config.mjs` na raiz (área do devops). Os workspaces não têm configuração própria; o script `lint` de cada um é `eslint .`.

## Regras de escrita

- **Agentes nunca editam a nota da tarefa.** Terminam com um bloco `## Handoff` (formato em `atualizar-tarefa`); o orquestrador transcreve.
- Cada agente altera apenas a sua área (tabela acima). O orquestrador confere após cada agente (`git status`); o code-reviewer confere no diff do implementador.
- Limite de retrabalho: 3 voltas ao implementador por tarefa (code-reviewer + qa somados); na 4ª a tarefa fica `bloqueada`. Se o George escolher mais rodadas, o contador é zerado.
