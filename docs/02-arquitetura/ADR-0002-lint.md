---
tipo: adr
numero: ADR-0002
status: aceita
data: 2026-10-10
---

# ADR-0002 — Ferramenta de lint

## Contexto

A [[docs/03-tarefas/T-005-monorepo-base|T-005]] pede um script `lint` na raiz do monorepo, mas a [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]] não escolhe linter. Os modelos iniciais do Vite (React) e do NestJS já trazem ESLint, então o dev esbarraria nisso logo ao criar `apps/web` e `apps/api`. A decisão foi levantada pelo devops na etapa 1 da T-005.

Restrições: monorepo com npm workspaces (`apps/web`, `apps/api`, `packages/shared`), TypeScript em tudo, e nenhuma tecnologia nova sem decisão do George.

## Opções

### A) ESLint com configuração única ("flat") na raiz + typescript-eslint + regras de hooks do React
- ✅ Padrão de mercado; já vem nos modelos do Vite e do Nest
- ✅ Pega erros que o TypeScript não vê (regras dos hooks, imports esquecidos)
- ✅ Uma configuração só para o monorepo inteiro
- ❌ Tecnologia nova (pede registro em ADR)
- ❌ Mais dependências e configuração para entender
- ❌ Mais um conceito na trilha agora

### B) Sem linter por enquanto: `lint` = checagem de tipos (`tsc --noEmit`) em cada workspace
- ✅ Nenhuma ferramenta nova
- ✅ Cumpre o script e já pega muitos erros
- ✅ O dev só remove o ESLint dos modelos iniciais
- ❌ Não pega regras de hooks nem de estilo
- ❌ O nome "lint" fica um pouco enganoso
- ❌ Provavelmente será trocado depois (retrabalho)

### C) ESLint + Prettier (formatação automática)
- ✅ Código sempre formatado do mesmo jeito
- ✅ Diffs menores e revisões mais fáceis
- ✅ Combinação muito comum em empresas
- ❌ Duas ferramentas novas
- ❌ Regras das duas podem conflitar (exige mais configuração)
- ❌ Mais coisa para aprender agora

## Decisão

Escolhida pelo George: **A — ESLint com configuração única ("flat") na raiz, typescript-eslint e regras de hooks do React.** É o que os modelos iniciais já trazem e o que o mercado usa, e a configuração única mantém o monorepo coerente. O Prettier pode entrar depois, se fizer falta (exigiria nova ADR).

## Consequências

- **Configuração:** um `eslint.config.*` na raiz (área do devops), com as dependências do ESLint como devDependencies da raiz. Os workspaces não mantêm configuração própria de ESLint; o dev remove a dos modelos iniciais.
- **Scripts:** cada workspace expõe `lint` usando a configuração da raiz; o `npm run lint` da raiz delega a eles.
- **Revisão:** o code-reviewer pode exigir `npm run lint` sem erros.
- **Fora do escopo:** formatação automática (Prettier) não foi adotada.
