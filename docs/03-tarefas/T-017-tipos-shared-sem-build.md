---
id: T-017
titulo: Pacote shared resolvido sem build (tipos apontando para o código-fonte)
status: concluida
modo: agente-faz
tags: [front-end, back-end]
rodadas: 0
criada: 2026-10-16
---

# T-017 — Pacote shared resolvido sem build (tipos apontando para o código-fonte)

## Descrição

O `packages/shared/package.json` só exporta `./dist/index.d.ts` e `./dist/index.js`, e `dist/` é ignorada pelo git. Num clone novo (ou sem a `dist`), tudo que checa tipos falha com `Cannot find module '@site-apresentacao/shared'`: VS Code, `npm run dev` (o `nest start` compila antes de subir) e o `tsc` de cada app. Só o `npm run build` da raiz escapa, porque compila o shared primeiro. Como o pacote só exporta tipos e todos os imports são `import type`, os tipos passam a apontar direto para o código-fonte (`./src/index.ts`).

## Critérios de aceite

- [x] `packages/shared/package.json` resolve os tipos pelo código-fonte (`src/index.ts`), sem depender de `dist/`
- [x] Sem `packages/shared/dist/`: `tsc --noEmit` da API, `tsc -b` do front, `npm run dev` (API sobe) e `npm test` funcionam
- [x] O build da raiz (`npm run build`) continua verde e a API compilada (`node apps/api/dist/main.js`) sobe
- [x] Teste que protege a regra: o pacote shared só exporta tipos (nenhum `export` de valor em `src/`), condição para os tipos apontarem para o fonte
- [x] 5 cenários de teste para a mudança (padrão do George), cobrindo resolução com e sem `dist`, import de tipo na API e no front e a regra acima
- [x] Comentários do CI (`.github/workflows/`) e da documentação que citam a `dist` do shared continuam corretos (ajuste é do devops, se necessário)

## Contexto relevante

- Achado em 2026-10-16 ao investigar "não está compilando, não tem o module"
- [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]] (monorepo com `packages/shared`)
- [[docs/03-tarefas/T-005-monorepo-base|T-005]]

## Decisões

- 2026-10-16 — George: Q1 (como corrigir o "Cannot find module" do shared) → **A**: os tipos do pacote apontam para o código-fonte (`./src/index.ts`), sem depender de build. Modo `agente-faz`.

## Dev

### Rodada 1

Resultado: CONCLUIDO
Resumo: O `types` do `packages/shared/package.json` aponta para `./src/index.ts` (o `default` segue em `./dist/index.js` e nunca é carregado, pois todos os imports são `import type`), então API e front resolvem e checam os tipos do shared sem a `dist/`. Novo `packages/shared/test/pacote.test.ts` com 5 cenários (usa a API do compilador e esconde/simula a `dist` na leitura do disco, sem apagar nada): com a `dist` presente os tipos vêm do fonte; sem a `dist` API e front resolvem o fonte; import de tipo compila com as opções reais da API; idem do front; regra "o shared só exporta tipos" (reconhece export de valor num exemplo). Com o `types` antigo, 4 dos 5 falham. Checagem de tipos do teste em `tsconfig.test.json`, chamada pelo `build` do shared (`@types/node` como devDependency; lock +1 linha); `--passWithNoTests` removido. Build da raiz, lint, `node apps/api/dist/main.js` e `nest start` verdes; rastreio de imports confirma o shared resolvido em `src/index.ts`. Testes: shared 5/5, API 142/142, hooks 412/412, web 72/74 (pendência 1). Comentários do CI e da documentação continuam corretos.
Arquivos alterados:
- `packages/shared/package.json`, `packages/shared/tsconfig.json`
- `packages/shared/tsconfig.test.json`, `packages/shared/test/pacote.test.ts` (novos)
- `package-lock.json` (gerado: `@types/node` no shared)
Pendências:
1. `apps/web/src/conteudo/pt-BR.ts` alterado fora do fluxo (nome "George Abreu de Siqueira") quebra `Cabecalho.test.tsx` e `Rodape.test.tsx` (procuram "George Siqueira"); não entrou no commit da T-017.
2. A prova sem `dist` vem do teste com a `dist` escondida e do rastreio de imports (a remoção da pasta é negada por permissão).
Decisão pendente: nenhuma
Conceitos para estudo: resolução de módulos do TypeScript (`exports`, condição `types`, `nodenext` × `bundler`); `import type`; links simbólicos dos npm workspaces; API do compilador (`resolveModuleName`, `createProgram`, compiler host); `@ts-expect-error`; tsconfig separado para testes.
Commit: `fix(shared): resolve os tipos do pacote pelo código-fonte, sem depender da dist`

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: Diff do dev correto e dentro da área: o `types` do shared aponta para `src/index.ts`, e o `--traceResolution` mostra API e front resolvendo o shared no fonte; o build da API mantém o layout da `dist` (`node dist/main.js` e Render inalterados). Todos os imports do shared são `import type`. Cinco cenários de comportamento passando. Build, lint, shared 5/5, API 142/142 e hooks 412/412 verdes; web 72/74 só por causa do `pt-BR.ts` alterado fora do fluxo. Lock com 1 linha nova (`@types/node`), coerente.
Arquivos alterados: nenhum
Pendências:
1. (devops, obrigatória para o critério 6) `README.md:30` e `README.md:40-42` ainda dizem que front e API dependem de `packages/shared/dist` e que é preciso fazer o build do shared; reescrever: os tipos vêm de `packages/shared/src` (T-017), sem build, e o `npm run build` só checa tipos e gera a versão de produção.
2. *opcional* — `pacote.test.ts:185` confere a string literal do `package.json` (aceitável: o teste também confere a resolução real).
3. (fora do fluxo) `apps/web/src/conteudo/pt-BR.ts` sem commit quebra `Cabecalho.test.tsx` e `Rodape.test.tsx`.
Decisão pendente: nenhuma
Conceitos para estudo: condição `types` em `exports`; apagamento de tipos; arquivos de node_modules fora do `rootDir`; `--traceResolution`; compiler host.

## QA

### Rodada 1

Resultado: PASSOU
Resumo: Os 6 critérios foram verificados numa cópia limpa dos arquivos rastreados (HEAD, sem `packages/shared/dist`, feita com `git ls-files` + `git show` no scratchpad) com `npm ci`. Sem a `dist`, `tsc --noEmit` da API, `tsc -b` do front e `npm test` (shared 5, API 142, web 74) verdes; `npm run dev` sobe a API (200 em `/api/health` e `/api/projetos`). `npm run build` verde e `node apps/api/dist/main.js` responde; o JS compilado não referencia o shared. Controles negativos: `types` antigo → 4 de 5 falham; export de valor → o teste 5 falha. Mudança no `src` vale mesmo com `dist` velha. e2e completo na cópia: 161 passaram, 7 pulados. Checkout: web 72/74 só por causa do `pt-BR.ts` fora do fluxo.
Arquivos alterados: nenhum (só arquivos temporários no scratchpad)
Pendências:
1. (fora do fluxo) `apps/web/src/conteudo/pt-BR.ts` sem commit quebra `Cabecalho.test.tsx` e `Rodape.test.tsx` — o George decide entre commitar o nome novo com os testes ajustados ou descartar.
2. *opcional* (devops) No CI o build roda antes dos testes, então a `dist` sempre existe; um `tsc --noEmit` antes do build provaria o "clone sem dist" no próprio CI.
Decisão pendente: nenhuma
Conceitos para estudo: controle negativo em testes; checar tipos × transpilar; apagamento de `import type`; prefixo global de rotas; provar um clone limpo sem mexer no checkout.

## Estudo

### Diário de estudo (documentador)

Resultado: CONCLUIDO
Resumo: Diário `docs/04-estudos/tarefas/T-017.md` (`consolidado: false`, 8 conceitos com o porquê, caminhos reais e 2 exercícios) explicando o "Cannot find module" (`types` apontando para a `dist` gerada e fora do git) e a correção (`types` em `src/index.ts`, possível porque o shared só exporta tipos). Correções pontuais em notas desatualizadas: `monorepo-com-npm-workspaces.md` (subitem "Mudou na T-017") e `mapa-do-monorepo.md` (tabela, comentário do `npm test`, diagrama do `Projeto` e pergunta de "Para aprofundar").
Arquivos alterados:
- `docs/04-estudos/tarefas/T-017.md` (novo)
- `docs/04-estudos/monorepo-com-npm-workspaces.md`
- `docs/04-estudos/mapa-do-monorepo.md`
Pendências:
1. Em `mapa-do-monorepo.md` consta que `npm run build -w apps/api` funciona num clone novo — deduzido dos critérios provados pelo qa, não rodado literalmente.
Decisão pendente: nenhuma

## DevOps

### Rodada 1

Resultado: CONCLUIDO
Resumo: README reescrito (critério 6, pendência 1 da Revisão): saiu o passo de build obrigatório do "Como rodar"; parágrafo novo explica que os tipos do shared vêm de `packages/shared/src` pelo campo `types` (T-017), funcionam sem build e valem na hora, e que isso depende de o pacote só exportar tipos (protegido por teste); a linha do `npm run build` na tabela agora diz que ele só checa os tipos e gera a versão de produção. CI (`ci.yml`, passos 6 e 7), `AGENTS.md`, `CLAUDE.md`, `docs/02-arquitetura/**`, `.claude/**` e `scripts/**` conferidos: nenhuma outra menção incorreta. Validador verde.
Arquivos alterados:
- `README.md`
Pendências: nenhuma (o `pt-BR.ts` alterado fora do fluxo segue sem commit)
Decisão pendente: nenhuma
Commit: `docs(readme): explica que os tipos do shared vêm do código-fonte, sem build`

## Log

- 2026-10-16 — tarefa criada
- 2026-10-16 — orquestrador: em-andamento — início no modo agente-faz; dev chamado
- 2026-10-16 — dev: CONCLUIDO — tipos do shared pelo código-fonte; 5 cenários; alteração de nome no pt-BR.ts fora do fluxo deixada sem commit
- 2026-10-16 — code-reviewer: APROVADO — tipos do shared pelo fonte; README desatualizado → devops (critério 6)
- 2026-10-16 — devops: CONCLUIDO — README atualizado; segue para o qa
- 2026-10-16 — qa: PASSOU — critérios provados numa cópia limpa sem a dist
- 2026-10-16 — orquestrador: concluida — verificação verde no estado commitado (shared 5, API 142, web 74, hooks 412, e2e 161 + 7 pulados, validador); o `pt-BR.ts` alterado pelo George fora do fluxo ficou num stash durante a verificação e foi devolvido; diário de estudo disparado após a integração
- 2026-10-16 — documentador: CONCLUIDO — diário integrado
