---
id: T-016
titulo: Pente-fino de testes unitários, de regressão e de ponta a ponta
status: em-qa
modo: agente-faz
tags: [qa, front-end, back-end, api]
rodadas: 0
criada: 2026-10-15
---

# T-016 — Pente-fino de testes unitários, de regressão e de ponta a ponta

## Descrição

Pente-fino de testes sobre tudo o que já foi entregue (T-007 a T-012), com **5 cenários por funcionalidade** em cada nível: unitário (dev, junto do código), rota da API (qa, `apps/api/test/`) e ponta a ponta/regressão (qa, `e2e/`). O objetivo é achar bugs e erros; **esta tarefa não corrige código de produção**: cada bug ou erro encontrado vira uma tarefa nova no backlog (criada pelo orquestrador a partir dos handoffs).

Funcionalidades (requisitos já implementados):

| # | Funcionalidade | Requisitos |
|---|---|---|
| 1 | Navegação por seções e menu (celular e desktop) | RF-01 |
| 2 | Início | RF-02 |
| 3 | Sobre | RF-03 |
| 4 | Stacks | RF-04 |
| 5 | Cards de projetos no front (sucesso, carregamento, falha) | RF-05, RNF-03 |
| 6 | API `GET /api/projetos` e arquivo curado | RF-06 parte 1 |
| 7 | Dados vivos do GitHub, cache e fallback | RF-06 parte 2, RNF-05 |
| 8 | Serviços | RF-07 |
| 9 | Contato | RF-08 |
| 10 | Textos no arquivo de conteúdo | RF-09 |
| 11 | Responsividade | RNF-01 |
| 12 | Acessibilidade | RNF-02 |
| 13 | Tema | RNF-04 |
| 14 | API de saúde (`GET /api/health`) e configuração por ambiente | — |

## Critérios de aceite

- [ ] Unitários (dev): para cada funcionalidade com código testável em unidade, pelo menos 5 cenários (caminho feliz, bordas e erros), novos ou já existentes, listados por funcionalidade no handoff
- [ ] Rota da API (qa): pelo menos 5 cenários para cada funcionalidade de API (6, 7 e 14)
- [ ] Ponta a ponta e regressão (qa): pelo menos 5 cenários por funcionalidade de interface (1 a 5 e 8 a 13), incluindo regressão do que as tarefas anteriores entregaram
- [ ] Nenhum código de produção alterado; teste que expõe um bug fica marcado como bug conhecido (`it.fails`/`it.todo` no Vitest, `test.fixme`/`test.fail` no Playwright), com comentário descrevendo o bug, para a suíte continuar verde
- [ ] Cada bug ou erro encontrado listado no handoff com funcionalidade, passos para reproduzir, esperado × obtido e severidade; o orquestrador cria uma tarefa por bug
- [ ] Suíte inteira verde (`npm test`, `npm run test:e2e`) e validador verde

## Contexto relevante

- Pedido do George em 2026-10-15
- [[docs/01-requisitos/requisitos|Requisitos]]
- Tarefas cobertas: T-007, T-008, T-009, T-010, T-011, T-012

## Decisões

- 2026-10-15 — George: pente-fino de testes ponta a ponta, regressão e unitários com 5 cenários por funcionalidade; bugs e erros encontrados viram tarefas. Modo `agente-faz` (todas as tarefas restantes seguem nesse modo).

## Dev

### Rodada 1

Resultado: CONCLUIDO
Resumo: Pente-fino dos testes unitários do front e da API, com pelo menos 5 cenários por funcionalidade (1 a 14), entre novos e existentes. Nenhum código de produção alterado. Quatro bugs encontrados e marcados com `it.fails` comentado (cada um conferido: falha pelo motivo descrito). `npm test` verde (API 191 + 2 falhas esperadas; web 145 + 3; hooks 412); lint, tipos e validador verdes.
Bugs encontrados:
- **BUG-1 (média)** — func. 5, RF-05: projeto fora do formato na resposta da API (ex.: sem `stacks`) apaga a página inteira (sem `<h1>`): `CartaoDeProjeto` lança erro e não há error boundary; `apps/web/src/api/projetos.ts` só confere que a resposta é lista. Teste: `App.test.tsx`.
- **BUG-2 (baixa)** — func. 5 e 7: `pushed_at` que não é data passa pela API e, no front, `Intl.DateTimeFormat.format` lança `RangeError` (página em branco). Testes: `CartaoDeProjeto.test.tsx`, `github-cliente.spec.ts`.
- **BUG-3 (baixa)** — func. 5 e 6: projetos com o mesmo título geram chave duplicada no React (`key={projeto.titulo}`; a validação não recusa títulos repetidos). Teste: `Projetos.test.tsx`.
- **BUG-4 (baixa)** — func. 6: `projetos.json` salvo em UTF-8 com BOM impede a API de subir ("não é um JSON válido"). Teste: `ler-projetos-curados.spec.ts`.
Cenários por funcionalidade (resumo): Navegação/menu (Menu 12, Cabecalho 5, secoes 3, App); Início (Inicio 6, Atalho 4); Sobre 6; Stacks 8; Cards (CartaoDeProjeto 14, Projetos 12, api/projetos 10, endereco-da-api 6, App +2); API projetos (validar 21, ler 9, service 8, controller 3, app.module); GitHub (repositorio +9, cliente +9, configuracao +4, service +4, cache 5, módulo 2); Serviços 8; Contato 6; RF-09 7; Responsividade 7 (novo `responsividade.test.ts`); Acessibilidade 8 (novo `acessibilidade.test.tsx`); Tema 12; Saúde/ambiente (health 4, `criar-app.spec.ts` 5 novo, variáveis 5).
Arquivos alterados:
- novos: `apps/web/src/apoio-de-testes/capturar-erros-de-renderizacao.ts`, `apps/web/src/acessibilidade.test.tsx`, `apps/web/src/responsividade.test.ts`, `apps/web/src/componentes/Atalho/Atalho.test.tsx`, `apps/api/src/criar-app.spec.ts`
- alterados: testes em `apps/web/src/**` e `apps/api/src/**` (só `*.test.ts(x)`/`*.spec.ts`)
Pendências:
1. Uma tarefa por bug (BUG-1 a BUG-4). BUG-1 e BUG-2 podem ser corrigidos juntos; no BUG-3, onde corrigir (chave no front ou recusar títulos repetidos) é escolha do George.
2. Para o George decidir (sem teste de bug, comportamento não definido): (a) validador aceita `"stacks": []` e o card mostra lista vazia; (b) cache vazio + requisições simultâneas consultam o GitHub duas vezes.
3. Já no backlog: CORS (T-013) e "PREENCHER" (T-015).
4. e2e não rodado (parte do qa).
Decisão pendente: nenhuma
Conceitos para estudo: `it.fails`; error boundary; erros não tratados no Vitest/jsdom; `key` e chaves duplicadas; `?raw` e `import.meta.glob` do Vite; contraste WCAG; mobile-first com `min-width` em rem; BOM em UTF-8; `encodeURIComponent`; `NestFactory` com `abortOnError`.
Commit: `test: pente-fino dos testes unitários do front e da API`

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: O diff do dev só altera testes unitários e um helper de testes (`apps/web/src/apoio-de-testes/`, fora do bundle). Nenhum código de produção alterado; tudo na área do dev. Os 5 `it.fails` correspondem aos BUG-1 a BUG-4 (BUG-2 com um teste na API e um no front), todos comentados e conferidos no código de produção. Sem `.only`/`.skip` esquecidos, sem segredos. `npm test` verde (API 191 + 2 esperadas; web 145 + 3; hooks 412), lint, tsc e validador verdes. Cobertura de 5 cenários conferida por amostragem.
Arquivos alterados: nenhum
Pendências:
1. *opcional* — comentário de `css.include` em `apps/web/vite.config.ts` desatualizado (o `?raw` agora é usado em mais testes).
2. *opcional* — `arquivosCss` e `semComentarios` duplicados em `tema.test.ts`, `responsividade.test.ts`, `acessibilidade.test.tsx`.
3. *opcional* — `capturarErrosDeRenderizacao` devolve `erros` sem uso; usá-lo deixaria os `it.fails` mais precisos (risco de falso positivo).
4. *opcional* — `acessibilidade.test.tsx:153` junta tabindex e `alt` (sem `<img>`, a parte do `alt` não confere nada).
5. *opcional* — `criar-app.spec.ts`, "cada chamada cria uma aplicação nova": verificação fraca (`not.toBe`).
6. (orquestrador) Pendências 2 do dev (`"stacks": []` aceito; consulta dupla ao GitHub com cache vazio) devem ir ao George.
Decisão pendente: nenhuma
Conceitos para estudo: `it.fails` e falso positivo; error boundary; erros não tratados no jsdom; `?raw` e `import.meta.glob`; testes que leem CSS × layout no e2e; contraste WCAG; BOM.

## QA

## Estudo

## DevOps

## Log

- 2026-10-15 — tarefa criada
- 2026-10-15 — orquestrador: em-andamento — início no modo agente-faz; dev chamado para os unitários
- 2026-10-15 — dev: CONCLUIDO — unitários com 5+ cenários nas 14 funcionalidades; 4 bugs marcados com it.fails
- 2026-10-15 — code-reviewer: APROVADO — só testes alterados; it.fails conferidos com os 4 bugs
