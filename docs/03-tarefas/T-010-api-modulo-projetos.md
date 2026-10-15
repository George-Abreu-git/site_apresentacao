---
id: T-010
titulo: API: módulo projetos lendo o arquivo curado
status: concluida
modo: agente-faz
tags: [back-end, api]
rodadas: 0
criada: 2026-10-10
---

# T-010 — API: módulo projetos lendo o arquivo curado

## Descrição

Primeiro módulo NestJS de domínio: lê o arquivo curado de projetos e expõe `GET /api/projetos`. Modo `agente-faz` para servir de exemplo de módulo, controller e service.

## Critérios de aceite

- [x] RF-06 (parte 1): `GET /api/projetos` responde JSON com todos os projetos do arquivo curado, na ordem definida, no formato do tipo `Projeto` de `packages/shared`
- [x] Arquivo curado com o formato documentado (título, descrição, stacks, links, imagem, repositório opcional) e ao menos 2 projetos de exemplo
- [x] Arquivo curado inválido gera erro claro na inicialização (não em tempo de requisição)
- [x] Testes unitários do service (dev) e de rota com Supertest (qa)

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

### Rodada 1

Resultado: PASSOU
Resumo: Os quatro critérios de aceite foram atendidos. Criei `apps/api/test/projetos.e2e-spec.ts` (19 testes de rota com Supertest), que cobre: resposta 200 em JSON igual ao arquivo curado e na mesma ordem; formato `Projeto`; projeto sem repositório; lista vazia; query string; prefixo `/api`; métodos não permitidos (404); arquivo lido uma vez só, ao subir; e oito casos de arquivo inválido que impedem a subida, com erro que traz o caminho. Todas as suítes passam: API 74, web 47, hooks 412, Playwright 115 (7 pulados que não vêm desta tarefa). Lint, typecheck e build da API sem erros. Responsividade e acessibilidade não se aplicam (sem interface).
Arquivos alterados:
- `apps/api/test/projetos.e2e-spec.ts` (novo)
Pendências: nenhuma
Decisão pendente: nenhuma
Conceitos para estudo: teste de rota vs. teste unitário; `Test.createTestingModule` + `overrideProvider().useFactory()`; `createNestApplication` + `setGlobalPrefix` em testes; `it.each`; provar "lido na inicialização" alterando o arquivo depois da subida; `mkdtempSync` em testes.

## Estudo

### Diário de estudo (documentador)

Resultado: CONCLUIDO
Resumo: Diário `docs/04-estudos/tarefas/T-010.md` (`consolidado: false`) sobre o módulo `projetos` da API: módulo, controller e service; injeção por tipo e por token; `useFactory` com fail fast; validação de `unknown` com type guards; `import.meta.url`; `structuredClone`; testes com `overrideProvider` e Supertest; 2 exercícios. Mudança pontual em `docs/04-estudos/nestjs-modulos-controllers-e-bootstrap.md` (a linha do `app.module.ts` cita o `ProjetosModule`).
Arquivos alterados:
- `docs/04-estudos/tarefas/T-010.md` (novo)
- `docs/04-estudos/nestjs-modulos-controllers-e-bootstrap.md`
Pendências:
1. Seis conceitos sem nota por conceito, para o `/estudar-consolidar`: injecao-de-dependencia-no-nestjs, provider-de-fabrica-e-fail-fast, validacao-em-tempo-de-execucao-com-type-guards, caminho-relativo-com-import-meta-url, copia-defensiva-com-structuredclone, testes-com-testing-module-e-override-provider.
2. O exercício 2 (remover o `@Inject`) não foi executado; a mensagem exata do erro pode variar entre os testes e o `npm run dev`.
Decisão pendente: nenhuma

## DevOps

## Log

- 2026-10-10 — tarefa criada
- 2026-10-15 — orquestrador: em-andamento — início no modo agente-faz; dev chamado
- 2026-10-15 — dev: CONCLUIDO — módulo projetos com GET /api/projetos e validação na inicialização; 29 testes novos
- 2026-10-15 — code-reviewer: APROVADO — RF-06 parte 1 atendido; testes, lint e build verdes; falta teste de rota (qa)
- 2026-10-15 — qa: PASSOU — 19 testes de rota com Supertest; todas as suítes verdes
- 2026-10-15 — orquestrador: concluida — verificação verde (API 52 testes, dos quais 22 de rota; o total 74 do handoff do qa era contagem dupla); diário de estudo disparado após a integração
- 2026-10-15 — documentador: CONCLUIDO — diário integrado
