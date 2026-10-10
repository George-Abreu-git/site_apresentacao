# AGENTS.md — Site_Apresentação_George

Regras do projeto para qualquer agente de código (Claude Code, Copilot, etc.).

## Sobre o projeto

Site pessoal de apresentação do George: portfólio, stacks, projetos e contato, navegável e responsivo.
Além do produto, o projeto é uma **trilha de aprendizado** de front-end, back-end, API e integração entre front e back.
Por isso, clareza e explicação importam tanto quanto o código. A visão completa ainda não existe: ela será escrita no **levantamento de requisitos** (skill `levantar-requisitos`). Por enquanto `docs/00-visao/` e `docs/01-requisitos/` têm só o esqueleto.

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

### Sequência inicial (ordem obrigatória)

1. **Levantamento de requisitos** (`levantar-requisitos`) — preenche `docs/00-visao/` e `docs/01-requisitos/`.
2. **ADR de stack** — decide a tecnologia a partir dos requisitos.
3. **T-001** (hooks de restrição de escrita) — depende da ADR, porque precisa das pastas de código, teste e infra.
4. Demais tarefas de produto.

Nenhum passo começa antes do anterior estar concluído.

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

Usadas pelo orquestrador para conferir os arquivos alterados por cada agente. **Provisórias** — serão ajustadas na ADR de stack.

| Agente | Caminhos permitidos |
|---|---|
| dev | `src/**` (exceto arquivos de infra), incluindo os **testes unitários**, que ficam junto do código |
| qa | **Testes de aceitação/e2e**: `tests/**` e `e2e/**` na raiz. Na revisão documental (tag `revisao`), nenhum arquivo |
| instrutor | `docs/04-estudos/**` |
| devops | `.github/**`, `infra/**`, `Dockerfile*`, `docker-compose*`, `.claude/**` (agentes, skills, comandos, `settings.json`, hooks), `AGENTS.md`, `CLAUDE.md`, `scripts/**`, configs da raiz (`.gitignore`, `.gitattributes`, `.obsidian/**`, `package.json`, `.env.example` etc.), `docs/**` exceto `docs/03-tarefas/**` e `docs/04-estudos/**` |
| orquestrador | `docs/03-tarefas/**` (notas e backlog) os commits, e os arquivos que as skills `registrar-decisao` (ADRs) e `levantar-requisitos` (visão e requisitos) mandam a sessão principal criar |
| todos os subagentes | nunca `docs/03-tarefas/**` (só o orquestrador) |

Uma alteração em `.claude/agents/**` (a definição de um agente) exige **aprovação do George**, mesmo dentro da área do devops: nenhum agente altera a própria definição por conta própria. Na tarefa que pedir essa mudança, a aprovação é a decisão do George registrada em `## Decisões`.

Quando a ADR de stack definir as pastas de teste, esta tabela é ajustada (as áreas de dev e qa acima são provisórias).

## Regras de escrita

- **Agentes nunca editam a nota da tarefa.** Terminam com um bloco `## Handoff` (formato em `atualizar-tarefa`); o orquestrador transcreve.
- Cada agente altera apenas a sua área (tabela acima). O orquestrador confere após cada agente (`git status`); o code-reviewer confere no diff do implementador.
- Limite de retrabalho: 3 voltas ao implementador por tarefa (code-reviewer + qa somados); na 4ª a tarefa fica `bloqueada`. Se o George escolher mais rodadas, o contador é zerado.
