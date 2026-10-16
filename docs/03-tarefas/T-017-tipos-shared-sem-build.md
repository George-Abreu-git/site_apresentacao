---
id: T-017
titulo: Pacote shared resolvido sem build (tipos apontando para o código-fonte)
status: backlog
modo: agente-faz
tags: [front-end, back-end]
rodadas: 0
criada: 2026-10-16
---

# T-017 — Pacote shared resolvido sem build (tipos apontando para o código-fonte)

## Descrição

O `packages/shared/package.json` só exporta `./dist/index.d.ts` e `./dist/index.js`, e `dist/` é ignorada pelo git. Num clone novo (ou sem a `dist`), tudo que checa tipos falha com `Cannot find module '@site-apresentacao/shared'`: VS Code, `npm run dev` (o `nest start` compila antes de subir) e o `tsc` de cada app. Só o `npm run build` da raiz escapa, porque compila o shared primeiro. Como o pacote só exporta tipos e todos os imports são `import type`, os tipos passam a apontar direto para o código-fonte (`./src/index.ts`).

## Critérios de aceite

- [ ] `packages/shared/package.json` resolve os tipos pelo código-fonte (`src/index.ts`), sem depender de `dist/`
- [ ] Sem `packages/shared/dist/`: `tsc --noEmit` da API, `tsc -b` do front, `npm run dev` (API sobe) e `npm test` funcionam
- [ ] O build da raiz (`npm run build`) continua verde e a API compilada (`node apps/api/dist/main.js`) sobe
- [ ] Teste que protege a regra: o pacote shared só exporta tipos (nenhum `export` de valor em `src/`), condição para os tipos apontarem para o fonte
- [ ] 5 cenários de teste para a mudança (padrão do George), cobrindo resolução com e sem `dist`, import de tipo na API e no front e a regra acima
- [ ] Comentários do CI (`.github/workflows/`) e da documentação que citam a `dist` do shared continuam corretos (ajuste é do devops, se necessário)

## Contexto relevante

- Achado em 2026-10-16 ao investigar "não está compilando, não tem o module"
- [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]] (monorepo com `packages/shared`)
- [[docs/03-tarefas/T-005-monorepo-base|T-005]]

## Decisões

- 2026-10-16 — George: Q1 (como corrigir o "Cannot find module" do shared) → **A**: os tipos do pacote apontam para o código-fonte (`./src/index.ts`), sem depender de build. Modo `agente-faz`.

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
