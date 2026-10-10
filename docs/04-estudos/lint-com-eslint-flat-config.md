---
tipo: estudo
tarefa: T-005
tags: [devops, front-end, back-end]
data: 2026-10-10
---

# Lint com ESLint (flat config) e peer dependencies

## Conceito

**Lint** é uma análise do código **sem executá-lo**, procurando erros e más práticas que o compilador deixa passar. O TypeScript confere **tipos**; o ESLint confere **padrões** (ex.: variável declarada e nunca usada, `any` explícito, hook do React dentro de um `if`).

### Flat config: uma lista de blocos

Desde a versão 9, o ESLint usa o formato **flat**: um arquivo `eslint.config.*` que exporta uma **lista** de blocos. Cada bloco pode dizer a quais arquivos se aplica (`files`) e quais regras e globais valem ali. Os blocos são aplicados **em ordem**; se dois definem a mesma regra, vale o último.

O projeto tem **uma única** configuração, na raiz (ADR-0002). Os workspaces não têm config própria: o script `lint` de cada um é só `eslint .`, e o ESLint acha o `eslint.config.mjs` subindo as pastas.

```
eslint.config.mjs
1. globalIgnores   node_modules/, dist/, coverage/, playwright-report/, test-results/
2. recomendados    JS (@eslint/js) + TypeScript (typescript-eslint "recommended") — em tudo
3. apps/web/**     + regras de hooks do React + globais do navegador (window, document)
4. Node            apps/api, packages, e2e, scripts, configs → globais do Node (process)
```

O bloco 3 e o 4 separam os mundos do [[mapa-do-monorepo]]: `document` só existe para o front, `process` só para o que roda no Node. Um `process.env` esquecido num componente vira erro de lint.

A extensão `.mjs` faz o Node tratar o arquivo como ESM (`import`/`export`) sem precisar de `"type": "module"` no `package.json` da raiz.

### Peer dependencies: por que o TypeScript está travado em `~6.0`

Um `package.json` pode declarar três tipos de dependência:

| Campo | Significado | Exemplo no projeto |
|---|---|---|
| `dependencies` | Preciso disto **para rodar** | `react`, `@nestjs/core` |
| `devDependencies` | Preciso disto só **para desenvolver** (build, teste, lint) | `vitest`, `eslint`, `typescript` |
| `peerDependencies` | Funciono **junto com** este pacote, que **você** instala, nesta faixa de versões | o `typescript-eslint` pede `typescript` `>=4.8.4 <6.1.0` |

*Peer* é um "plugin" dizendo: "eu não trago o TypeScript; uso o seu, desde que seja de uma versão que eu conheço". Se a sua versão está fora da faixa, o `npm install` acusa conflito (`ERESOLVE`).

Na T-005, a versão mais nova do TypeScript no npm era a 7, mas o `typescript-eslint` 8.71 só aceita até a 6.0.x. Por isso o devops fixou `"typescript": "~6.0.3"` na raiz e nos workspaces. Não é escolha de tecnologia nova (a ADR-0001 já define TypeScript); é uma **restrição de compatibilidade**.

`~` × `^` nas versões:

- `~6.0.3` aceita `6.0.4`, `6.0.9`... mas **não** `6.1.0` (só correções).
- `^8.71.1` aceita `8.72.0`, `8.99.0`... mas **não** `9.0.0` (correções e novidades compatíveis).

Quando o `typescript-eslint` passar a aceitar o TypeScript 7, dá para subir a versão (seria uma tarefa, e a versão nova pode exigir ajustes).

## Por que importa

- Uma config só significa **as mesmas regras** em front, API, testes e scripts, e um lugar só para mudar.
- As regras de hooks do React pegam bugs que nem o TypeScript nem os testes costumam pegar (efeito com dependência faltando, hook condicional).
- Entender peer dependencies explica a maior parte dos erros "estranhos" do `npm install`, e por que "atualizar tudo para a última versão" nem sempre é possível.

## Como aparece no projeto

- `eslint.config.mjs` (raiz), comentado bloco a bloco.
- Script `lint` da raiz: `npm run lint --workspaces --if-present && eslint --no-error-on-unmatched-pattern e2e scripts eslint.config.mjs`. A segunda parte foi acrescentada depois da revisão (decisão D1), porque `e2e/` e `scripts/` não são workspaces e ficariam sem lint.
- `package.json` da raiz: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `globals` e `typescript ~6.0.3` nas `devDependencies`.
- Os modelos do Vite e do Nest vinham com outra ferramenta (oxlint) e com Prettier; o dev removeu, porque a ADR-0002 escolheu ESLint.
- O devops testou a config numa cópia: um hook dentro de `if` em `apps/web` e um `any` em `apps/api` foram barrados.

## Exemplo

```js
// eslint.config.mjs (trecho)
export default defineConfig([
  js.configs.recommended,          // vale para todos os arquivos
  tseslint.configs.recommended,    // ensina o ESLint a ler TypeScript

  {
    files: ['apps/web/**/*.{ts,tsx}'],               // só o front
    extends: [reactHooks.configs.flat.recommended],  // regras de hooks
    languageOptions: { globals: globals.browser },   // window, document, fetch
  },
]);
```

## Para aprofundar

- **Exercício**: em `apps/web/src/App.tsx`, escreva `const x: any = 1;` e rode `npm run lint -w apps/web`. Leia o nome da regra na mensagem. Depois rode `npx eslint . --fix` e veja o que ele consegue (e o que não consegue) corrigir sozinho. Desfaça.
- **Exercício**: abra `node_modules/typescript-eslint/package.json` e encontre o campo `peerDependencies`. Qual faixa de TypeScript ele aceita?
- **Pergunta**: o projeto usa o conjunto `recommended` do typescript-eslint, que não lê o `tsconfig`; o devops anotou que o `recommendedTypeChecked` pode entrar depois. Que tipo de erro a versão com tipos pegaria a mais (ex.: uma `Promise` sem `await`), e qual o custo?

## Links

- Tarefa: [[docs/03-tarefas/T-005-monorepo-base]]
- ADR: [[docs/02-arquitetura/ADR-0002-lint]]
- Relacionadas: [[mapa-do-monorepo]], [[monorepo-com-npm-workspaces]]
