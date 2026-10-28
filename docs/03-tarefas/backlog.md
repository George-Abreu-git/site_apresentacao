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
| [[docs/03-tarefas/T-016-pente-fino-de-testes|T-016]] | Pente-fino de testes unitários, de regressão e de ponta a ponta | concluida | agente-faz | qa, front-end, back-end, api |
| [[docs/03-tarefas/T-017-tipos-shared-sem-build|T-017]] | Pacote shared resolvido sem build (tipos apontando para o código-fonte) | concluida | agente-faz | front-end, back-end |
| [[docs/03-tarefas/T-018-projetos-fora-do-formato-derrubam-pagina|T-018]] | Projeto fora do formato na resposta da API não derruba a página | concluida | agente-faz | front-end, api |
| [[docs/03-tarefas/T-019-data-invalida-do-github|T-019]] | Data inválida do GitHub não derruba o card de projeto | concluida | agente-faz | front-end, back-end, api |
| [[docs/03-tarefas/T-020-chave-duplicada-em-projetos|T-020]] | Projetos com o mesmo título não geram chave duplicada no React | concluida | agente-faz | front-end, back-end |
| [[docs/03-tarefas/T-021-projetos-json-com-bom|T-021]] | Arquivo curado salvo em UTF-8 com BOM é lido normalmente | concluida | agente-faz | back-end, api |
| [[docs/03-tarefas/T-022-marca-fecha-menu-celular|T-022]] | Tocar na marca no celular fecha a lista do menu | concluida | agente-faz | front-end |
| [[docs/03-tarefas/T-023-ancora-na-primeira-visita|T-023]] | Abrir o site direto numa âncora rola até a seção | concluida | agente-faz | front-end |
| [[docs/03-tarefas/T-024-menu-celular-deitado|T-024]] | Lista do menu cabe ou rola no celular deitado com pouca altura | concluida | agente-faz | front-end |
| [[docs/03-tarefas/T-025-texto-longo-nos-cards|T-025]] | Texto longo nos cards de projeto não causa rolagem lateral | concluida | agente-faz | front-end |
| [[docs/03-tarefas/T-026-cabecalhos-de-seguranca-api|T-026]] | Cabeçalhos de segurança nas respostas da API | concluida | agente-faz | back-end, api |
| [[docs/03-tarefas/T-027-checagem-de-tipos-do-e2e|T-027]] | Checagem de tipos dos testes de ponta a ponta (pasta e2e/) | backlog | agente-faz | infra |
| [[docs/03-tarefas/T-028-etiquetas-com-nome-longo|T-028]] | Etiquetas de tecnologia com nome longo não causam rolagem lateral | concluida | agente-faz | front-end |
| [[docs/03-tarefas/T-029-cabecalho-texto-ampliado|T-029]] | Cabeçalho e menu não passam da tela com texto ampliado a 200% em 360px | concluida | agente-faz | front-end |
| [[docs/03-tarefas/T-030-scroll-padding-com-cabecalho-alto|T-030]] | Âncora não esconde o título atrás do cabeçalho alto | concluida | agente-faz | front-end |
| [[docs/03-tarefas/T-031-rolagem-suave-em-testes-instaveis|T-031]] | Testes de navegação estáveis com a rolagem suave | backlog | agente-faz | qa |
| [[docs/03-tarefas/T-032-e2e-no-build-de-producao|T-032]] | e2e também contra o build de produção (vite preview) | backlog | agente-faz | infra |
| [[docs/03-tarefas/T-033-foco-apos-ancora-inicial|T-033]] | Tab começa na seção ao abrir o site direto numa âncora | backlog | agente-faz | front-end |
| [[docs/03-tarefas/T-034-nome-completo-no-titulo-e-testes|T-034]] | Nome completo do George no título da aba e nos testes do cabeçalho e do rodapé | concluida | agente-faz | front-end |
| [[docs/03-tarefas/T-035-devs-em-paralelo|T-035]] | Mais dois subagentes dev (dev-2 e dev-3) para codar em paralelo | concluida | agente-faz | orquestracao |
| [[docs/03-tarefas/T-036-anel-de-foco-na-lista-que-rola|T-036]] | Anel de foco do último link não fica cortado na lista do menu que rola | backlog | agente-faz | front-end |
| [[docs/03-tarefas/T-037-ajustes-tarefas-em-paralelo|T-037]] | Ajustes no fluxo de tarefas em paralelo (backlog, remoção do worktree no Windows e textos da ADR-0004) | backlog | agente-faz | orquestracao |
| [[docs/03-tarefas/T-038-rolagem-suave-para-no-meio|T-038]] | Link do menu leva até a seção mesmo quando a rolagem suave é interrompida | backlog | agente-faz | front-end |

> Ordem: T-004 → T-005 → **T-014** → T-006 → T-001 → T-007 → T-008 → T-009 → T-010 → T-011 → T-012 → **T-017** → **T-016** → bugs do pente-fino (média primeiro: T-025 ✔, T-029 ✔, T-018 ✔, T-023 ✔, T-028 ✔, T-030 ✔; depois T-019 ✔, T-020 ✔, T-021 ✔, T-024 ✔, T-022 ✔, T-026 ✔, T-033, T-027, T-031, T-032, T-036, T-038; **T-035** ✔ e T-037 na orquestração) → **T-015** → T-013. Requisitos e ADR de stack já concluídos ([[docs/02-arquitetura/ADR-0001-stack|ADR-0001]]); a T-001 agora depende só da T-005 (pastas criadas).
