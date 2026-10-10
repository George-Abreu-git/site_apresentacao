---
id: T-005
titulo: Montar o monorepo base (workspaces, web, api, shared e ferramentas de teste)
status: em-qa
modo: agente-faz
tags: [infra]
rodadas: 0
criada: 2026-10-10
---

# T-005 — Montar o monorepo base (workspaces, web, api, shared e ferramentas de teste)

## Descrição

Cria a estrutura de código da ADR-0001, sem funcionalidades: apenas o esqueleto que roda, compila e testa.

## Critérios de aceite

- [ ] `package.json` na raiz com npm workspaces (`apps/*`, `packages/*`) e scripts `dev`, `build`, `test`, `test:e2e`, `lint`
- [ ] `apps/web`: Vite + React + TypeScript com CSS Modules; página placeholder; um teste Vitest + Testing Library passando
- [ ] `apps/api`: NestJS com um endpoint `GET /api/health` → `{ status: "ok" }`; um teste unitário (Vitest ou Jest do Nest — decisão do George se houver dúvida) e um teste de rota com Supertest passando
- [ ] `packages/shared`: tipo `Projeto` exportado e importado por `apps/web` e `apps/api` (prova que o compartilhamento funciona)
- [ ] `e2e/`: Playwright configurado com um teste que abre a página placeholder em viewport de celular e de desktop
- [ ] `.env.example` documenta as variáveis da API (ex.: `GITHUB_TOKEN`, `CORS_ORIGIN`)
- [ ] `npm test` e `npm run test:e2e` passam na raiz; `README` curto de como rodar

## Contexto relevante

- Depende de: T-004
- [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]]
- [[docs/03-tarefas/T-004-atualiza-agents-stack|T-004]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).
- 2026-10-10 — orquestrador: o teste unitário da API usa **Vitest**, conforme a ADR-0001 (decisão 6); a dúvida do critério da `apps/api` está coberta pela ADR.
- 2026-10-10 — George (Q1-B): implementação **dividida por área**, sem exceção: (1) **devops** cria a raiz (`package.json` com workspaces e scripts, `tsconfig` base, `.env.example`, README); (2) **dev** cria `apps/web`, `apps/api` e `packages/shared` com os testes unitários; (3) **code-reviewer** revisa o diff dos dois; (4) **qa** escreve o Playwright (com `playwright.config.ts` dentro de `e2e/`) e o teste de rota com Supertest em `apps/api/test/`, e roda tudo. Ajustes voltam ao agente dono do arquivo.
- 2026-10-10 — George (Q2-A): aprova que o **devops alinhe `.claude/agents/dev.md`, `qa.md` e `devops.md`** às áreas do `AGENTS.md` (sem `src/**`/`tests/**`) e o gatilho da suíte na `orquestrar-tarefa` ("sem `src/`" → "sem `apps/`"), como primeiro passo desta tarefa.
- 2026-10-10 — George (Q3-A): **ESLint** com configuração única na raiz + typescript-eslint + regras de hooks do React — registrado em [[docs/02-arquitetura/ADR-0002-lint|ADR-0002]]. O devops volta para criar a configuração na raiz antes do dev.
- 2026-10-10 — George (Q4-A): o **`package-lock.json` é arquivo gerado** — o implementador (dev ou devops) pode alterá-lo ao instalar dependências; o code-reviewer confere o diff do lock. O devops registra a regra na tabela de áreas do `AGENTS.md`.
- 2026-10-10 — **George delegou ao orquestrador as decisões das tarefas T-005, T-006, T-001 e T-007** (execução em sequência: T-005 → T-006 → T-001 → T-007). Cada decisão tomada pelo orquestrador fica registrada aqui com as 3 opções, prós e contras e a justificativa, marcada como "decidido pelo orquestrador (delegação)", para o George revisar e pedir alterações.
- 2026-10-10 — **D1 — Opcionais da revisão (decidido pelo orquestrador, delegação):** o code-reviewer aprovou e listou 5 opcionais.
  - **A) Aplicar 1–4 agora, antes do QA** (dev: comentário; devops: lint da raiz, README, `engines`), sem contar rodada porque não é `AJUSTES`; o QA valida o resultado final.
    - ✅ Corrige o comentário errado num projeto didático. ✅ O lint passa a cobrir `e2e/`, que o qa cria logo em seguida. ✅ Mudanças pequenas, em arquivos separados (dev e devops em paralelo).
    - ❌ Mudanças depois da revisão não passam de novo pelo code-reviewer. ❌ Mais uma ida aos agentes. ❌ Aumenta um pouco o escopo.
  - **B) Aplicar só o item 1 (comentário)**
    - ✅ Resolve o único ponto marcado como recomendado. ✅ Mínimo de retrabalho. ✅ Escopo intacto.
    - ❌ O `e2e/` do qa ficaria fora do lint. ❌ README e `engines` continuam incompletos. ❌ Viram pendência para outra tarefa.
  - **C) Não aplicar nada; registrar para uma tarefa futura**
    - ✅ Zero atraso. ✅ Escopo intacto. ✅ Revisão aprovada como está.
    - ❌ Comentário errado vai para `main`. ❌ Lint não cobre `e2e/`. ❌ Acumula pendências.
  - **Escolha: A.** São correções baratas e o item 2 evita que o código de teste do qa fique sem lint desde o primeiro dia. O item 5 fica de fora (manter `vitest` no shared é coerente com os outros workspaces). O QA roda test, build, lint e e2e sobre o resultado final, o que cobre a falta de nova revisão.

## Dev

### Rodada 1 — etapa 2 (apps e shared)

**Resultado:** CONCLUIDO — três workspaces criados com TDD; na raiz passam `npm test` (api 6 testes, web 3; `shared` sem testes), `npm run build`, `npm run lint` e o validador.

- **`packages/shared`:** tipo `Projeto` (campos da parte curada do RF-06: `titulo`, `descricao`, `stacks`, `repositorio?`, `demo?`, `imagem?`; a T-010 confirma e a T-011 acrescenta os dados do GitHub), compilado para `dist/` com os tipos.
- **`apps/web`:** Vite 8 + React 19 + TS ~6.0, CSS Modules, página provisória com `<main>`, `<h1>George Siqueira</h1>`, "Site em construção." e `lang="pt-BR"`; testes com Vitest + Testing Library + jsdom.
- **`apps/api`:** NestJS 12 em ESM, `HealthModule` com `GET /api/health` → `{ status: "ok" }`; `criarApp()` (`apps/api/src/criar-app.ts`) monta a mesma API do `main.ts`, com prefixo `/api`, sem abrir porta; lê `apps/api/.env` com `process.loadEnvFile` (nativo do Node, sem `@nestjs/config`; arquivo ausente não dá erro; variável do ambiente não é sobrescrita); testes unitários com Vitest `^5.0.3`.
- **Workspaces:** `build`/`test`/`lint` (`eslint .`) e `dev` em web e api; `tsconfig.json` estendendo `../../tsconfig.base.json`.

**Conferências extras:** a API compilada (`node dist/main.js`, `.env` temporário com `PORT=3999`, apagado depois) respondeu `{"status":"ok"}` em `/api/health` e 404 em `/health`; trocar o tipo esperado nos testes de compartilhamento quebrou o build da api e da web (revertido); injeção de dependência do Nest funciona no Vitest 5 sem SWC (importa para a T-010); o ESLint analisou de fato os arquivos. `npm run dev` não foi rodado (não termina sozinho).

**Escolhas para o code-reviewer olhar:**
1. Os modelos do Nest 12 (ESM + Vitest) e do Vite trazem **oxlint**, não ESLint. Removidos: oxlint, Prettier (fora da ADR-0002), `vite-tsconfig-paths`, `@nestjs/mau`, `@vitest/coverage-v8`, `source-map-support`, `public/` e arquivos-modelo. Vitest `^5.0.3` (o modelo do Nest vinha com 4).
2. `.env` lido com `process.loadEnvFile` (sem biblioteca nova).
3. `supertest` e `@types/supertest` nas devDependencies da api (o qa não edita `package.json`); o Vitest da api já roda `test/**/*.spec.ts` e `test/**/*.e2e-spec.ts`.
4. Prova do compartilhamento com `expectTypeOf` em cada app, conferida no build; por isso web e api precisam do `shared` compilado antes (o `npm run build` da raiz já segue a ordem).
5. `package-lock.json` mudou só pelo `npm install` (Q4-A); diff grande (~5,5 mil linhas).

**Pendências:**
1. qa: teste de rota em `apps/api/test/` com `const app = await criarApp({ logger: false }); await app.init();`, `request(app.getHttpServer()).get('/api/health')` e `app.close()`.
2. qa: Playwright em `e2e/` (página provisória descrita acima).
3. devops (sugestão para o README): num clone novo, rodar `npm run build` uma vez para compilar o `packages/shared`; antes disso o editor marca erro no import `@site-apresentacao/shared` (os testes rodam mesmo assim).
4. Tema e layout responsivo completos ficam para a T-007; CORS (RNF-05) para a T-013.

### Ajuste pós-revisão (decisão D1, não conta rodada)

**Resultado:** CONCLUIDO — o comentário de `apps/api/src/health/health.controller.ts:10` agora cita `criarApp` e a constante `PREFIXO_DAS_ROTAS` (em `criar-app.ts`), no lugar do inexistente `configurarApp`. `npm run lint -w apps/api` e `npm test -w apps/api` (6/6) passam. Commit `8688db5`.

## Revisão

### Rodada 1

**Resultado:** APROVADO — o diff do devops (raiz, ESLint, agentes, regra do lockfile) e do dev (web, api, shared) cumpre os critérios que cabem a cada um, segue as ADR-0001 e ADR-0002 e respeita as áreas.

**Verificações:** `npm test` verde (shared sem testes, api 6, web 3); `npm run build` verde (shared → api → web); `npm run lint` verde nos 3 workspaces; validador OK; `npm ls --all` sem pacotes sobrando, inválidos ou faltando; API compilada respondeu `{"status":"ok"}` em `/api/health` e 404 em `/health`; `dist/` da api sem `*.spec.ts`; `git status` limpo.

**Áreas:** devops só na sua área (agentes aprovados em Q2-A); dev só em `apps/**` e `packages/**`, nada em `apps/api/test/**`; ADR-0002 criada pelo orquestrador. **Lockfile:** entradas idênticas aos 4 `package.json`; nada de oxlint, prettier, `eslint-plugin-react-refresh`, `vite-tsconfig-paths`, `@nestjs/mau`, `@vitest/coverage-v8`, `source-map-support`, `dotenv` ou `@nestjs/config`; um único `typescript@6.0.3`; os 3 pacotes `@site-apresentacao/*` como links de workspace.

**Pontos pedidos:** `scripts/dev.mjs` justificado (só Node; `shell: true` com comando fixo, sem injeção); TypeScript `~6.0` é restrição de compatibilidade, não tecnologia nova; `process.loadEnvFile` boa escolha (3 testes cobrem os casos); `supertest` no lugar certo; remoção de oxlint/Prettier de acordo com a ADR-0002; ordem do build garantida pelo `workspaces`. **Segurança:** nenhum segredo; `.env*` ignorado exceto `.env.example`; `GITHUB_TOKEN` vazio com aviso.

**Opcionais:**
1. (dev, recomendado antes do merge) `apps/api/src/health/health.controller.ts:10`: o comentário cita `configurarApp`, que não existe; o nome certo é `criarApp`.
2. (devops) `package.json:15`: `npm run lint` da raiz só roda os workspaces; `scripts/`, `eslint.config.mjs` e o futuro `e2e/` nunca são analisados. Sugestão: `&& eslint e2e scripts eslint.config.mjs`.
3. (devops) README: num clone novo, rodar `npm run build` uma vez para compilar o `packages/shared`.
4. (devops) `package.json`: declarar `"engines": { "node": ">=24" }` (a API usa `process.loadEnvFile`).
5. (dev) `packages/shared/package.json`: `vitest` só para `--passWithNoTests`; manter ou remover.

## QA

## Estudo

## DevOps

### Rodada 1 — etapa 1 (agentes + raiz)

**Resultado:** AGUARDANDO-DECISAO — etapa 1 concluída na área do devops; validador OK; duas decisões (Q3 lint, Q4 lockfile) antes da etapa do dev. Não rodou `npm install` (sem `package-lock.json` nem `node_modules`).

- **Q2-A:** `dev.md`, `qa.md` e `devops.md` citam as áreas do `AGENTS.md` (`apps/**`, `packages/**`, `e2e/**`, `apps/api/test/**`), sem `src/**`/`tests/**`. Na `orquestrar-tarefa`, o gatilho virou "enquanto não houver `apps/` nem suíte de testes", e a suíte obrigatória ficou definida como `npm test` + `npm run test:e2e`.
- **Raiz (Q1-B):** `package.json` com workspaces (`packages/*` antes de `apps/*`, para o `build` rodar shared → api → web) e os 5 scripts; `tsconfig.base.json`; `.env.example` (`PORT`, `CORS_ORIGIN`, `GITHUB_TOKEN` vazio); `README.md`; `scripts/dev.mjs`.
- **Testado** numa cópia temporária com workspaces falsos: ordem do `build` e `scripts/dev.mjs` subindo dois servidores em paralelo (devolve erro se um falha). No repositório real, `lint` e `dev` falham com "No workspaces found" até existirem os workspaces; `test:e2e` falha até o qa criar `e2e/playwright.config.ts`.

**Pontos para o code-reviewer olhar:**
- `scripts/dev.mjs` (não pedido): `npm run --workspaces` roda um workspace por vez e servidor de dev nunca termina; o script usa só Node, sem dependência nova (a alternativa `concurrently` seria tecnologia fora da ADR-0001).
- `.env` em `apps/api/.env` (a API roda com `apps/api` como diretório atual); o dev precisa fazer a API ler esse arquivo.
- `@playwright/test` (^1.64.0) como devDependency da raiz, porque `e2e/` não é workspace e o qa não edita o `package.json` da raiz.

**Pendências para as próximas etapas:** cada workspace precisa dos scripts `build`, `test`, `lint` (e `dev` em web e api) e de um `tsconfig.json` com `"extends": "../../tsconfig.base.json"`; a API deve ler `apps/api/.env`; o qa cria `e2e/playwright.config.ts` (navegadores via `npx playwright install`, já no README).

Commits do orquestrador: agentes/skill e raiz (ver Log).

### Rodada 1 — etapa 1b (ESLint + lockfile)

**Resultado:** CONCLUIDO — configuração única do ESLint na raiz e regra do lockfile; validador OK.

- **ESLint (Q3-A / ADR-0002):** `eslint.config.mjs` na raiz, comentado em português; ignora `node_modules/`, `dist/`, `coverage/`, `playwright-report/`, `test-results/`. Em tudo: regras recomendadas de JS + `recommended` do typescript-eslint (sem leitura de tipos; `recommendedTypeChecked` pode entrar depois). Só em `apps/web/**/*.{ts,tsx}`: regras de hooks do React (`flat.recommended` v7) e globais do navegador. Globais do Node para `apps/api`, `packages`, `e2e`, `scripts`, configs de `apps/web` e `.js`/`.mjs` da raiz.
- **devDependencies da raiz:** `eslint` ^10.12.0, `@eslint/js` ^10.0.1, `typescript-eslint` ^8.71.1, `eslint-plugin-react-hooks` ^7.1.1, `globals` ^17.13.0 e **`typescript` ~6.0.3** (não pedido: o typescript-eslint 8.71.1 só aceita TypeScript < 6.1, e a versão atual do npm é a 7.0.2).
- **Testado** numa cópia com workspaces falsos: barrou hook dentro de `if` em `apps/web` e `any` explícito em `apps/api`; ignorou `dist/`; a regra de hooks não valeu fora de `apps/web`; arquivos corretos passaram. No repositório real, `npx eslint eslint.config.mjs scripts` sai sem erros.
- **Lockfile (Q4-A):** `AGENTS.md`, abaixo da tabela de áreas, registra que `package-lock.json` é gerado: dev ou devops podem alterá-lo ao instalar dependências, ninguém o edita à mão e o code-reviewer confere se o diff bate com os `package.json`. Linha curta sobre o lint no mesmo lugar.
- **README:** seção "Lint" (config única, `eslint .` por workspace, `npx eslint . --fix`, motivo do TypeScript `~6.0`).
- **`npm install`:** gerou `package-lock.json` (v3, 142 pacotes) e `node_modules/` (ignorado); nenhuma vulnerabilidade.

**Para o dev:** em cada workspace, `"lint": "eslint ."`, sem `eslint.config.*` próprio; remover a config e as dependências de ESLint dos modelos do Vite e do Nest (inclusive `eslint-plugin-react-refresh`, fora da ADR-0002); TypeScript `~6.0` (não 7).

**Para o code-reviewer:** conferir o diff do `package-lock.json` e se fixar TypeScript `~6.0` na raiz está de acordo com a ADR-0002. `npm run lint` na raiz falha com "No workspaces found" até o dev criar os workspaces.

### Ajuste pós-revisão (decisão D1, não conta rodada)

**Resultado:** CONCLUIDO — opcionais 2–4 aplicados; `npm run lint`, `npm test` e o validador passam.
- **Lint da raiz:** `npm run lint --workspaces --if-present && eslint --no-error-on-unmatched-pattern e2e scripts eslint.config.mjs`. Conferido em modo de depuração que `scripts/dev.mjs` e `eslint.config.mjs` são analisados; sem `e2e/` o comando não falha; um `e2e/tmp-lint-check.ts` temporário com `any` proposital fez o lint acusar `no-explicit-any` (código 1) e foi apagado. O `eslint.config.mjs` já cobria esses caminhos.
- **README:** passo 3 do "Como rodar" (`npm run build` para gerar `packages/shared/dist/`), com nota sobre o erro de import no editor e a falha de `npm run build -w apps/api` num clone novo; "Comandos" e "Lint" descrevem o lint da raiz.
- **`engines`:** `"node": ">=24"` e pré-requisitos do README atualizados; `npm install --package-lock-only --ignore-scripts` acrescentou ao lock só as 3 linhas do `engines` (Q4-A).

## Log

- 2026-10-10 — tarefa criada
- 2026-10-10 — orquestrador: início — decisões Q1-B (fluxo devops → dev → code-reviewer → qa) e Q2-A (alinhar agentes)
- 2026-10-10 — devops: AGUARDANDO-DECISAO — etapa 1 (agentes alinhados + raiz do monorepo) concluída; validador OK; Q3 (lint) e Q4 (lockfile) para o George
- 2026-10-10 — orquestrador: decisões Q3-A (ESLint, ADR-0002) e Q4-A (lock gerado); devops volta para a etapa 1b
- 2026-10-10 — devops: CONCLUIDO — etapa 1b: ESLint único na raiz, TypeScript ~6.0, regra do lockfile no `AGENTS.md`; validador OK
- 2026-10-10 — dev: CONCLUIDO — etapa 2: web, api e shared com testes unitários; test/build/lint e validador OK
- 2026-10-10 — code-reviewer: APROVADO — critérios de devops e dev atendidos; lockfile confere; 5 opcionais
- 2026-10-10 — orquestrador: D1 (delegação) — aplicar opcionais 1–4 antes do QA
- 2026-10-10 — dev e devops: CONCLUIDO — opcionais 1 (comentário) e 2–4 (lint da raiz, README, `engines`) aplicados; lint/test/validador OK
