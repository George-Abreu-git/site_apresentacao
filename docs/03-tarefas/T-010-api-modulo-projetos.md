---
id: T-010
titulo: API: módulo projetos lendo o arquivo curado
status: em-qa
modo: agente-faz
tags: [back-end, api]
rodadas: 0
criada: 2026-10-10
---

# T-010 — API: módulo projetos lendo o arquivo curado

## Descrição

Primeiro módulo NestJS de domínio: lê o arquivo curado de projetos e expõe `GET /api/projetos`. Modo `agente-faz` para servir de exemplo de módulo, controller e service.

## Critérios de aceite

- [ ] RF-06 (parte 1): `GET /api/projetos` responde JSON com todos os projetos do arquivo curado, na ordem definida, no formato do tipo `Projeto` de `packages/shared`
- [ ] Arquivo curado com o formato documentado (título, descrição, stacks, links, imagem, repositório opcional) e ao menos 2 projetos de exemplo
- [ ] Arquivo curado inválido gera erro claro na inicialização (não em tempo de requisição)
- [ ] Testes unitários do service (dev) e de rota com Supertest (qa)

## Contexto relevante

- Depende de: T-005
- [[docs/01-requisitos/requisitos|Requisitos]]
- [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]]
- [[docs/03-tarefas/T-005-monorepo-base|T-005]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).

## Dev

### Rodada 1

Resultado: CONCLUIDO
Resumo: Módulo `projetos` na API com `GET /api/projetos`, que devolve o arquivo curado `apps/api/conteudo/projetos.json` (2 projetos de exemplo) na ordem do arquivo e no formato `Projeto`. O arquivo é lido e validado uma vez, por um provider de fábrica (`useFactory`, token `PROJETOS_CURADOS`), quando a aplicação é montada. Arquivo ausente, JSON inválido ou fora do formato impedem a API de subir, com uma mensagem que traz o caminho e todos os problemas (validação à mão, sem biblioteca nova; campos desconhecidos recusados; `repositorio` e `demo` só http(s)). Formato documentado em `apps/api/conteudo/README.md`. 29 testes unitários novos; suíte inteira (web, api, hooks), build e lint verdes; conferido de ponta a ponta com o build real (`node dist/main.js`: 200 com JSON; arquivo estragado impede a subida).
Arquivos alterados:
- `apps/api/src/projetos/` (novos): `validar-projetos-curados.ts`, `ler-projetos-curados.ts`, `projetos-curados.token.ts`, `projetos.service.ts`, `projetos.controller.ts`, `projetos.module.ts` e os `*.spec.ts` correspondentes
- `apps/api/src/app.module.ts` e `app.module.spec.ts` (novo)
- `apps/api/conteudo/projetos.json` e `README.md` (novos)
- `packages/shared/src/projeto.ts` (só o comentário)
Pendências:
1. Teste de rota com Supertest para `GET /api/projetos` em `apps/api/test/` é do qa. Dica: testar arquivo inválido com `overrideProvider(PROJETOS_CURADOS).useFactory(...)`.
2. Formato JSON e pasta `apps/api/conteudo/` escolhidos pelo dev (sem ADR; caminho mais simples, sem dependência nova) — para o code-reviewer conferir.
3. Os 2 projetos de exemplo não usam `imagem` nem `demo` (documentados e testados); o George deve trocá-los pelos projetos reais.
4. `apps/api/src/compartilhamento.spec.ts` pode ser apagado (o próprio comentário diz isso); a remoção foi negada por permissão, fica opcional.
Decisão pendente: nenhuma
Conceitos para estudo: módulo, controller e service no NestJS; injeção de dependência (por tipo e por token com `@Inject`/`Symbol`); provider de fábrica (`useFactory`) e ciclo de inicialização; validação em tempo de execução (`unknown` e type guards); `import.meta.url` e `fileURLToPath`; `structuredClone`; `Test.createTestingModule` e `overrideProvider`; fail fast.
Commit: `feat(api): adiciona módulo projetos com GET /api/projetos lendo o arquivo curado`

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: O módulo `projetos` (controller, service, provider de fábrica com token e validação manual) atende ao RF-06 parte 1 e aos critérios de aceite da parte do dev. Testes, lint e build da API verdes (api 32, web 47, hooks 412); o caminho `../../conteudo/projetos.json` funciona também no `dist/`. Todos os arquivos na área do dev, sem segredos, entrada validada. O formato JSON em `apps/api/conteudo/` é detalhe de implementação (RF-06 só pede "um arquivo curado no repositório"), não decisão do George. Falta só o teste de rota com Supertest, do qa.
Arquivos alterados: nenhum
Pendências:
1. (qa) Teste de rota com Supertest para `GET /api/projetos` em `apps/api/test/`, inclusive a falha na inicialização com arquivo inválido via `overrideProvider(PROJETOS_CURADOS)`.
2. *opcional* — testes do `ProjetosModule` estão em `projetos.controller.spec.ts:21-45`; um `projetos.module.spec.ts` próprio seria mais claro.
3. *opcional* — `validar-projetos-curados.ts:80`: `imagem` aceita qualquer texto não vazio; restringir a caminho relativo ou `http(s)`.
4. *opcional* — `apps/api/src/compartilhamento.spec.ts` (anterior à tarefa) pode ser removido.
Decisão pendente: nenhuma
Conceitos para estudo: módulo/controller/service no NestJS; injeção por token (`Symbol` + `@Inject`); `useFactory` e fail fast; validação de `unknown` com type guards; `import.meta.url` + `fileURLToPath`; `overrideProvider`.

## QA

## Estudo

## DevOps

## Log

- 2026-10-10 — tarefa criada
- 2026-10-15 — orquestrador: em-andamento — início no modo agente-faz; dev chamado
- 2026-10-15 — dev: CONCLUIDO — módulo projetos com GET /api/projetos e validação na inicialização; 29 testes novos
- 2026-10-15 — code-reviewer: APROVADO — RF-06 parte 1 atendido; testes, lint e build verdes; falta teste de rota (qa)
