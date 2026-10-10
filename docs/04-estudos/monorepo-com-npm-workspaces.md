---
tipo: estudo
tarefa: T-004
tags: [devops, front-end, back-end]
data: 2026-10-10
---

# Monorepo com npm workspaces

## Conceito

**Monorepo** é um único repositório Git com **vários projetos** dentro. O contrário é o "multirepo" (um repositório para o front, outro para a API).

**npm workspaces** é o recurso do próprio npm (sem ferramenta extra) para administrar esses projetos juntos. Cada projeto (um *workspace*) tem o **seu** `package.json`, com as **suas** dependências, e o `package.json` da **raiz** só lista onde os workspaces estão:

```json
{
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

Com isso:

- Um único `npm install` na raiz instala as dependências de **todos** os workspaces.
- Existe **um só `package-lock.json`**, na raiz, travando as versões de tudo.
- Um workspace pode **usar outro como se fosse um pacote do npm**. O npm cria um link em `node_modules/` apontando para a pasta local, então a API e o front importam `packages/shared` pelo nome do pacote, sem copiar arquivos.
- Dá para rodar um script em um workspace específico (`npm run dev -w apps/web`) ou em todos (`npm test --workspaces`).

## Por que importa

O site tem três partes que **mudam juntas** mas **são publicadas separadas**:

- o front (`apps/web`) vai para o Cloudflare Pages;
- a API (`apps/api`) vai para o Render;
- os tipos compartilhados (`packages/shared`, ex.: `Projeto`) são usados pelos dois.

Se a API mudar o formato de um `Projeto`, o front precisa saber na hora. Com o tipo num pacote compartilhado, o TypeScript do front acusa o erro **no mesmo commit**: é a "integração entre front e back" (um dos objetivos da trilha) protegida pelo compilador.

A ADR-0001 comparou três opções (decisão 3):

| Opção | Por que (não) |
|---|---|
| **Monorepo com workspaces** ✔ | Dependências separadas por app, deploys separados, tipos compartilhados |
| NestJS servindo o React (um app só) | O site inteiro "dormiria" no plano gratuito do Render, quebrando o RNF-03 |
| Um só `package.json` com `src/web`, `src/api`, `src/shared` | Dependências do React e do NestJS misturadas; builds e deploys separados ficam trabalhosos |

O contra assumido: é um conceito a mais para aprender (workspaces) e há mais pastas.

## Como aparece no projeto

- **Decisão**: [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]], seção "Arquitetura e repositório".
- **Na T-004** ([[docs/03-tarefas/T-004-atualiza-agents-stack|nota]]), o `AGENTS.md` passou a mostrar a estrutura na árvore de pastas: `src/` saiu; entraram `apps/web/`, `apps/api/` (com `apps/api/test/`), `packages/shared/` e `e2e/`, mais a frase "O código é um **monorepo com npm workspaces** (`apps/*` e `packages/*`)".
- **Áreas por caminho**: a estrutura definiu quem mexe em quê. Código e configs de cada app (`apps/**`, `packages/**`) são do dev; o `package.json` da raiz (a lista de workspaces) e o `package-lock.json` são do devops, por serem configs da raiz. Veja [[areas-por-caminho-de-escrita]].
- **`.gitignore`**: um único arquivo na raiz cobre todos os workspaces, porque `node_modules/` e `dist/` sem barra no início valem em qualquer nível. Veja [[gitignore-padroes-e-check-ignore]].

O código ainda **não existe**: a criação do monorepo é uma tarefa futura de setup. Nomes de pacotes (ex.: `@site/shared`) e scripts serão definidos lá.

## Exemplo

Como deve ficar (os nomes são **ilustrativos**, a tarefa de setup é que decide):

```
/                         package.json  -> "workspaces": ["apps/*", "packages/*"]
                          package-lock.json (único, na raiz)
apps/web/package.json     -> depende de "react", "vite" e do pacote compartilhado
apps/api/package.json     -> depende de "@nestjs/core" e do pacote compartilhado
packages/shared/package.json -> "name": "@site/shared" (só tipos)
```

```ts
// packages/shared/src/projeto.ts — o "contrato" entre API e front
export interface Projeto {
  nome: string;
  descricao: string;
  url: string;
}

// apps/api/src/projetos/projetos.service.ts — a API devolve Projeto[]
import type { Projeto } from '@site/shared';

// apps/web/src/sections/Projetos.tsx — o front recebe Projeto[]
import type { Projeto } from '@site/shared';
// Se a API renomear "url" para "link" no tipo, este arquivo deixa de compilar.
```

Comandos típicos (na raiz):

```
npm install                 # instala tudo, cria os links dos workspaces
npm run dev -w apps/web     # roda o script "dev" só do front
npm test --workspaces       # roda "test" em todos os workspaces
```

## Para aprofundar

- Pergunta: o front e a API vivem no mesmo repositório, mas vão para plataformas diferentes. O que, exatamente, cada plataforma (Cloudflare Pages, Render) precisa saber para construir só a sua parte? (Dica: pasta raiz do build e comando de build.)
- Pergunta: por que `packages/shared` deve ter **só tipos** (e não, por exemplo, código que acessa o GitHub)? O que aconteceria com o tamanho do front?
- Exercício (quando o setup existir): rode `npm ls --workspaces` e explique cada linha. Depois abra `node_modules/@site/` e veja que é um link para `packages/shared`.
- Pesquisa: o link do workspace resolve **onde** está o pacote, mas o TypeScript do Vite e do NestJS ainda precisa saber **como** ler os arquivos `.ts` de `packages/shared` (compilar antes ou apontar para o código-fonte). Que opções existem? Isso vai aparecer na tarefa de setup e pode virar decisão do George.
- Pesquisa: o que é *hoisting* no npm e por que, num monorepo, a maioria das dependências fica no `node_modules/` da raiz?

## Links

- Tarefa: [[docs/03-tarefas/T-004-atualiza-agents-stack]]
- ADR: [[docs/02-arquitetura/ADR-0001-stack]]
- Relacionadas: [[areas-por-caminho-de-escrita]], [[gitignore-padroes-e-check-ignore]], [[adr-como-fonte-unica]]
