# Backlog

Atualizado pelo orquestrador (skill `atualizar-tarefa`). Novas tarefas: `/nova-tarefa <título>`.

| ID | Título | Status | Modo | Tags |
|---|---|---|---|---|
| [[docs/03-tarefas/T-001-hooks-restricao-escrita|T-001]] | Hooks PreToolUse de restrição de escrita por agente | concluida | agente-faz | infra, orquestracao |
| [[docs/03-tarefas/T-002-qa-revisa-arquivos-antes-adr|T-002]] | QA revisa todos os arquivos atuais antes da ADR de stack | concluida | agente-faz | qa |
| [[docs/03-tarefas/T-003-corrige-achados-t002|T-003]] | Corrigir achados médios da T-002, formalizar o modo revisão e normalizar fim de linha | concluida | agente-faz | orquestracao, docs |
| [[docs/03-tarefas/T-004-atualiza-agents-stack|T-004]] | Atualizar AGENTS.md com a stack e as áreas por caminho da ADR-0001 | concluida | agente-faz | orquestracao |
| [[docs/03-tarefas/T-005-monorepo-base|T-005]] | Montar o monorepo base (workspaces, web, api, shared e ferramentas de teste) | concluida | agente-faz | infra |
| [[docs/03-tarefas/T-006-ci-github-actions|T-006]] | CI no GitHub Actions (validador e testes a cada push) | concluida | agente-faz | infra |
| [[docs/03-tarefas/T-007-layout-base|T-007]] | Layout base: menu com âncoras, tema escuro e responsividade | concluida | agente-faz | front-end |
| [[docs/03-tarefas/T-008-conteudo-secoes-estaticas|T-008]] | Textos em arquivo de conteúdo e seções Início, Sobre, Serviços e Contato | concluida | agente-faz | front-end |
| [[docs/03-tarefas/T-009-secao-stacks|T-009]] | Seção Stacks a partir de arquivo de conteúdo | concluida | agente-faz | front-end |
| [[docs/03-tarefas/T-010-api-modulo-projetos|T-010]] | API: módulo projetos lendo o arquivo curado | concluida | agente-faz | back-end, api |
| [[docs/03-tarefas/T-011-api-modulo-github|T-011]] | API: módulo github com cache e fallback | concluida | agente-faz | back-end, api |
| [[docs/03-tarefas/T-012-front-cards-projetos|T-012]] | Front: cards de projetos consumindo a API | concluida | agente-faz | front-end, api |
| [[docs/03-tarefas/T-013-deploy-v1|T-013]] | Deploy da v1: Cloudflare Pages, Render, CORS e SEO básico | backlog | agente-faz | release |
| [[docs/03-tarefas/T-014-documentador-paralelo|T-014]] | Documentação de estudo em paralelo (diário por tarefa em worktree) e consolidação sob demanda | concluida | agente-faz | orquestracao |
| [[docs/03-tarefas/T-015-conteudo-real-do-site|T-015]] | Conteúdo real do site — LinkedIn, e-mail e textos revisados | backlog | eu-faco | front-end, docs |
| [[docs/03-tarefas/T-016-pente-fino-de-testes|T-016]] | Pente-fino de testes unitários, de regressão e de ponta a ponta | em-andamento | agente-faz | qa, front-end, back-end, api |

> Ordem: T-004 → T-005 → **T-014** → T-006 → T-001 → T-007 → T-008 → T-009 → T-010 → T-011 → T-012 → **T-016** → **T-015** → T-013. Requisitos e ADR de stack já concluídos ([[docs/02-arquitetura/ADR-0001-stack|ADR-0001]]); a T-001 agora depende só da T-005 (pastas criadas).
