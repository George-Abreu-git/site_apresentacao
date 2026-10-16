---
tipo: estudo
tarefa: T-005
tags: [devops, front-end, back-end]
data: 2026-10-10
---

# Mapa do monorepo: o que roda onde

## Conceito

O repositório tem **cinco peças**. Três são *workspaces* (projetos com `package.json` próprio, veja [[monorepo-com-npm-workspaces]]) e duas são pastas da raiz que ajudam as outras:

| Pasta | O que é | Onde roda | Quem transforma o TypeScript | Porta |
|---|---|---|---|---|
| `packages/shared` | Tipos compartilhados (`Projeto`) | Em lugar nenhum: só existe na hora de compilar | ninguém: API e front leem `src/` direto (T-017); o `tsc` só confere e gera `dist/` | — |
| `apps/web` | Front-end (Vite + React) | No **navegador** | Vite (o `tsc` só confere) | 5173 |
| `apps/api` | API (NestJS) | No **Node**, num servidor | `nest build` (usa o `tsc`) → `dist/*.js` | 3000 |
| `e2e/` | Testes no navegador (Playwright) | No Node, controlando um Chromium | Playwright | — |
| `scripts/` | Utilitários (`dev.mjs`) | No Node | nada: já é JavaScript | — |

A raiz amarra tudo: o `package.json` lista os workspaces e tem os 5 comandos (`dev`, `build`, `test`, `test:e2e`, `lint`), o `tsconfig.base.json` guarda as regras comuns do TypeScript e o `eslint.config.mjs` vale para o repositório inteiro.

### Os três momentos

```
npm run dev        scripts/dev.mjs abre 2 processos em paralelo
                   ├─ apps/api → nest start --watch   → http://localhost:3000/api/health
                   └─ apps/web → vite                 → http://localhost:5173

npm run build      um workspace por vez, na ordem do "workspaces" da raiz
                   shared (tsc) → api (tsc --noEmit && nest build) → web (tsc -b && vite build)

npm test           vitest run em cada workspace (o shared tem testes desde a T-017)
npm run test:e2e   Playwright sobe o front sozinho e abre o Chromium em 2 tamanhos de tela
npm run lint       eslint . em cada workspace + e2e/, scripts/ e a própria config
```

Hoje o front **ainda não chama** a API: são dois servidores independentes. A ligação entre eles (CORS, `fetch`) chega nas próximas tarefas (RNF-05, T-013).

### ESM no Node: por que os imports da API terminam em `.js`

JavaScript tem dois sistemas de módulos: o antigo do Node, **CommonJS** (`require`/`module.exports`), e o padrão da linguagem, **ESM** (`import`/`export`). Os três workspaces usam ESM, declarado com `"type": "module"` no `package.json` de cada um.

No Node, o ESM é rígido: o caminho do `import` precisa ser o **nome exato do arquivo que vai existir quando o código rodar**. Quem roda é o `dist/main.js`, e o TypeScript não reescreve caminhos. Por isso, no código-fonte da API, você escreve `.js` mesmo importando um arquivo `.ts`:

```ts
// apps/api/src/main.ts
import { criarApp } from './criar-app.js'; // o arquivo é criar-app.ts; depois do build, criar-app.js
```

Quem liga essa regra é `"module": "nodenext"` no `apps/api/tsconfig.json` (e no `packages/shared`). Outro efeito do ESM: o `main.ts` usa `await` direto no topo do arquivo (*top-level await*), o que o CommonJS não permite.

No front é diferente: `apps/web/tsconfig.json` usa `"moduleResolution": "bundler"`, porque quem resolve os imports é o **Vite**, e ele aceita `import App from './App'` sem extensão.

### Um tsconfig base, um por workspace

Cada workspace tem o seu `tsconfig.json`, que começa com `"extends": "../../tsconfig.base.json"` e só acrescenta o que é dele:

- **base**: `strict`, `target: ES2022`, `skipLibCheck`...
- **web**: `jsx`, `lib: DOM`, `moduleResolution: bundler`, `noEmit` (o Vite gera o JavaScript).
- **api**: `nodenext`, `experimentalDecorators` e `emitDecoratorMetadata` (exigidos pelo NestJS, veja [[nestjs-modulos-controllers-e-bootstrap]]).
- **shared**: `nodenext` e `declaration: true` (gera os `.d.ts`).

## Por que importa

- Saber **onde cada código roda** evita erros clássicos: usar `process.env` no front (não existe no navegador) ou `document` na API (não existe no Node). O ESLint ajuda, dando globais de navegador só para `apps/web` (veja [[lint-com-eslint-flat-config]]).
- Saber **quem transforma o TypeScript** explica por que o erro aparece num comando e não no outro (ex.: um erro de tipo só aparece no `npm run build`, não no `npm test`; veja [[tipos-de-teste-unitario-rota-e2e]]).
- O mapa é o mesmo da hospedagem (ADR-0001): `apps/web/dist` vai para o Cloudflare Pages e `apps/api/dist` para o Render.

## Como aparece no projeto

- Raiz: `package.json`, `tsconfig.base.json`, `eslint.config.mjs`, `.env.example`, `scripts/dev.mjs`, `README.md`.
- Front: `apps/web/index.html` → `src/main.tsx` → `src/App.tsx` (veja [[vite-react-e-css-modules]]).
- API: `apps/api/src/main.ts` → `criar-app.ts` → `app.module.ts` → `health/` (veja [[nestjs-modulos-controllers-e-bootstrap]]).
- Compartilhado: `packages/shared/src/projeto.ts`, exportado por `src/index.ts`.
- Testes: `apps/*/src/**/*.{spec,test}.ts(x)` (unitários), `apps/api/test/` (rota), `e2e/` (navegador).

**Por que existe `scripts/dev.mjs`?** `npm run dev --workspaces` roda um workspace **de cada vez**, e um servidor de desenvolvimento nunca termina: o segundo nunca subiria. O script abre um processo por workspace com `spawn` do Node, sem dependência nova.

## Exemplo

Seguindo o tipo `Projeto` do começo ao fim:

```
packages/shared/src/projeto.ts   export interface Projeto { titulo; descricao; stacks; ... }
        │  reexportado por src/index.ts
        ▼
packages/shared/src/index.ts     o "package.json" do shared aponta "types" para cá (T-017; antes era dist/index.d.ts)
        │  npm install criou o link node_modules/@site-apresentacao/shared → packages/shared
        ▼
apps/api e apps/web              import type { Projeto } from '@site-apresentacao/shared';
```

Se alguém renomear `titulo` em `projeto.ts`, o build da API e o do front quebram **no mesmo commit**. O dev conferiu isso na T-005 trocando o tipo esperado de propósito.

## Para aprofundar

- **Exercício**: rode `npm run dev` e abra `http://localhost:3000/api/health` e `http://localhost:5173`. Depois rode `npm run dev -w apps/api` sozinho e veja a diferença. Por que um `npm run dev --workspaces` não daria certo?
- **Exercício**: num arquivo da API, apague o `.js` de um import e rode `npm run build -w apps/api`. Leia a mensagem de erro e explique com as suas palavras por que o `nodenext` reclama.
- **Pergunta**: por que o `build` da raiz precisa rodar `packages/*` **antes** de `apps/*`? O que acontece num clone novo se você rodar `npm run build -w apps/api` direto? (Até a T-017, falhava com `Cannot find module`; hoje funciona, porque os tipos vêm de `src/`. Veja [[docs/04-estudos/tarefas/T-017]].)
- **Pesquisa**: o que é *top-level await* e por que ele só funciona em ESM?

## Links

- Tarefa: [[docs/03-tarefas/T-005-monorepo-base]]
- ADRs: [[docs/02-arquitetura/ADR-0001-stack]], [[docs/02-arquitetura/ADR-0002-lint]]
- Relacionadas: [[monorepo-com-npm-workspaces]], [[nestjs-modulos-controllers-e-bootstrap]], [[vite-react-e-css-modules]], [[tipos-de-teste-unitario-rota-e2e]], [[lint-com-eslint-flat-config]]
