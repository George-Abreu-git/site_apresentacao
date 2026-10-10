---
id: T-007
titulo: Layout base: menu com âncoras, tema escuro e responsividade
status: em-revisao
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-10
---

# T-007 — Layout base: menu com âncoras, tema escuro e responsividade

## Descrição

Estrutura visual da página única: as seis seções vazias, o menu de navegação e o tema escuro em variáveis de CSS. Modo `agente-faz` para servir de exemplo de referência.

## Critérios de aceite

- [ ] RF-01: seções Início, Sobre, Stacks, Projetos, Serviços e Contato com `id`; menu leva a cada uma; menu acessível ao rolar; no celular, menu compacto que abre a lista
- [ ] RNF-04: todas as cores em variáveis de CSS do tema escuro; nenhuma cor fixa nos componentes
- [ ] RNF-01: sem rolagem horizontal de 360px a 1280px+
- [ ] RNF-02: menu navegável por teclado com foco visível; HTML semântico (`header`, `nav`, `main`, `section`, `footer`)
- [ ] Testes unitários dos componentes (dev) e e2e de navegação por menu e teclado em celular e desktop (qa)

## Contexto relevante

- Depende de: T-005
- [[docs/01-requisitos/requisitos|Requisitos]]
- [[docs/03-tarefas/T-005-monorepo-base|T-005]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).
- 2026-10-10 — George delegou ao orquestrador as decisões das tarefas T-005, T-006, T-001 e T-007 (ver T-005). Decisões abaixo marcadas "decidido pelo orquestrador (delegação)", com as opções documentadas, para revisão do George.

## Dev

### Rodada 1

**Resultado:** CONCLUIDO — layout base da página única em `apps/web`; `npm test` (26 testes do front, +18), `npm run build`, `npm run lint` e validador sem erro; o e2e atual do qa continua 8/8 sem ajuste. Nenhuma biblioteca nova.

- **Página:** cabeçalho com menu, `<main>` com as seis seções e rodapé; a lista de seções fica num único arquivo (`secoes.ts`), lido pelo menu e pela página.
- **Início:** mantém `<h1>George Siqueira</h1>` e "Site em construção." na seção `#inicio`; um único `<main>` e um único `<h1>`. Demais seções (Sobre, Stacks, Projetos, Serviços, Contato) com `h2`, vazias.
- **Menu:** `<button>` e links `<a href="#id">` nativos (Tab funciona); no celular, o botão "Menu" (`aria-expanded`/`aria-controls`) abre e fecha a lista, que fecha ao escolher uma seção ou com Esc (foco volta ao botão); a partir de 48rem (768px) o botão some e a lista fica em linha. Navegação com nome "Navegação principal"; cada seção é uma região com nome.
- **Ao rolar:** cabeçalho `position: sticky`; a seção escolhida para logo abaixo dele (`scroll-padding`).
- **Tema:** todas as cores só em `tema.css`; `tema.test.ts` falha se aparecer cor fixa em outro CSS. Foco visível em `:focus-visible`.
- **Conferência visual** (build num navegador, script temporário fora do repositório): sem rolagem horizontal em 360, 768 e 1280px; foco aparece no teclado; clique e Enter levam à seção certa.
- **Mudanças a notar:** `vite.config.ts` — o Vitest entrega o texto do CSS só quando o import usa `?raw` (necessário ao teste do tema); `App.module.css` removido (sem uso).

**Arquivos:** `apps/web/vite.config.ts`, `src/main.tsx`, `src/index.css`, `src/App.tsx`, `src/App.test.tsx`, `src/App.module.css` (removido), `src/tema.css`, `src/tema.test.ts`, `src/secoes.ts`, `src/secoes.test.ts`, `src/componentes/{Cabecalho,Menu,Secao,Inicio,Rodape}/*` (componente, CSS Module e teste).

**Pendências:**
1. E2e de navegação por menu e teclado em celular e desktop (critério 5) com o qa — sugestões: no celular, `getByRole('button', { name: 'Menu' })` abre a lista e os links ficam ocultos com ela fechada; no desktop, o botão fica oculto; navegação "Navegação principal"; região Início = "George Siqueira".
2. O e2e atual passa sem mudança; só o nome do describe ("página provisória") ficou desatualizado (a critério do qa).
3. Sugestão fora do escopo (não implementada): link "Pular para o conteúdo" — decisão do George, em tarefa própria.

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-10 — tarefa criada
- 2026-10-10 — orquestrador: início — implementador dev (tag `front-end`); e2e com o qa
- 2026-10-10 — dev: CONCLUIDO — seis seções, menu por âncoras (compacto no celular), tema escuro em variáveis, HTML semântico; 26 testes do front; build/lint/validador OK; e2e atual 8/8
