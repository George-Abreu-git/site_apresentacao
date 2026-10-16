---
id: T-011
titulo: API: módulo github com cache e fallback
status: em-revisao
modo: agente-faz
tags: [back-end, api]
rodadas: 0
criada: 2026-10-10
---

# T-011 — API: módulo github com cache e fallback

## Descrição

Integra a API do GitHub para completar os projetos com dados vivos. Modo `agente-faz` (decisão do George em 2026-10-15; originalmente `eu-faco`, pois integração com API externa é foco de aprendizado — o aprendizado fica no diário de estudo).

## Critérios de aceite

- [ ] RF-06 (parte 2): projetos com repositório recebem linguagem principal, estrelas e última atualização do GitHub
- [ ] Cache dos dados do GitHub por tempo configurável (variável de ambiente)
- [ ] GitHub indisponível ou limite atingido → resposta com dados curados e indicação de que os dados vivos estão ausentes (sem erro)
- [ ] RNF-05: token só via variável de ambiente; nunca logado nem retornado
- [ ] Testes com o GitHub simulado (mock): sucesso, falha e cache

## Contexto relevante

- Depende de: T-010
- [[docs/01-requisitos/requisitos|Requisitos]]
- [[docs/03-tarefas/T-010-api-modulo-projetos|T-010]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).
- 2026-10-15 — George: todas as tarefas restantes do backlog seguem em modo `agente-faz` (o dev implementa).

## Dev

### Rodada 1

Resultado: CONCLUIDO
Resumo: Módulo `github` em `apps/api/src/github/`. O `GithubCliente` usa o `fetch` nativo, com tempo limite de 5 s, token no cabeçalho `Authorization` quando houver e validação da resposta. O `GithubService` guarda os dados em cache na memória pelo tempo de `GITHUB_CACHE_TTL_SEGUNDOS` (padrão 3600 s) e, quando o GitHub falha, devolve `{ disponivel: false }` sem erro e registra um aviso no log, sem o token. Falhas não ficam no cache. A configuração é lida na inicialização; valor inválido impede a API de subir. O `ProjetosService` junta os dados curados com os dados vivos em paralelo (`Promise.all`), mantendo a ordem do arquivo. Tipos separados: `ProjetoCurado` (arquivo, sem `github`, que é recusado) e `Projeto` (resposta, com `github` opcional). 56 testes unitários novos ou alterados: API 106 passam e 2 falham (rota, do qa), web 47, hooks 412, build e lint verdes. Teste manual com o build: dados reais do GitHub e cache (~0,1 s na segunda chamada); TTL inválido impede a subida.
Arquivos alterados:
- `apps/api/src/github/` (novos): `configuracao-do-github.ts`, `repositorio-do-github.ts`, `cache-com-validade.ts`, `github-cliente.ts`, `github.service.ts`, `github.module.ts` e os `*.spec.ts` correspondentes
- `apps/api/src/projetos/projeto-curado.ts` (novo); alterados `projetos.service.ts`, `projetos.controller.ts`, `projetos.module.ts`, `validar-projetos-curados.ts`, `ler-projetos-curados.ts`, `projetos-curados.token.ts` e specs
- `apps/api/src/app.module.ts` (comentário); `apps/api/conteudo/README.md` (formato da resposta e variáveis de ambiente)
- `packages/shared/src/projeto.ts` e `index.ts` (`DadosDoGithub`, `DadosVivosDoGithub`, campo opcional `github` em `Projeto`)
Pendências:
1. (qa) 2 testes de `apps/api/test/projetos.e2e-spec.ts` falham por causa do campo `github` (comparação com o JSON cru e `validarProjetosCurados` na resposta); os testes que usam `criarApp()` chamam o GitHub real. Sugestão: `overrideProvider(GithubCliente).useValue(...)` e testes de rota para sucesso, GitHub indisponível, cache e token ausente da resposta.
2. (devops) Acrescentar `GITHUB_CACHE_TTL_SEGUNDOS` ao `.env.example` (padrão 3600; inteiro > 0) e, na T-013, cadastrar no Render.
3. (code-reviewer) Conferir se o formato da resposta (`github: { disponivel: true, linguagem, estrelas, ultimaAtualizacao } | { disponivel: false }`, resposta continua lista; afeta a T-012) e os valores fixos (nome/padrão do TTL, tempo limite de 5 s) são detalhe de implementação ou decisão do George.
4. (fora do escopo) Falhas não ficam no cache: com o limite do GitHub atingido, cada requisição tenta de novo (até 5 s). Alternativa: servir o último dado conhecido vencido.
5. *opcional* — `apps/api/src/compartilhamento.spec.ts` pode ser removido.
Decisão pendente: nenhuma
Conceitos para estudo: `fetch` nativo, cabeçalhos, `Response.ok`; `AbortSignal.timeout`; cache com TTL (`Map` e relógio injetável); fallback e degradação graciosa; limite de requisições do GitHub; segredo em variável de ambiente e logs (RNF-05); união discriminada; `Omit<T, K>`; `exports`/`imports` entre módulos NestJS; `Promise.all` preservando a ordem; `vi.spyOn(globalThis, 'fetch')`, `vi.useFakeTimers({ toFake: ['Date'] })`, `vi.stubEnv`, `overrideProvider().useValue()`; `URL.canParse`.
Commit: `feat(api): adiciona módulo github com dados vivos, cache e fallback em GET /api/projetos`

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-10 — tarefa criada
- 2026-10-15 — orquestrador: em-andamento — início no modo agente-faz por decisão do George; dev chamado
- 2026-10-15 — dev: CONCLUIDO — módulo github com cache e fallback; 2 testes de rota do qa a ajustar (campo github)
