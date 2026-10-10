---
id: T-007
titulo: Layout base: menu com âncoras, tema escuro e responsividade
status: concluida
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-10
---

# T-007 — Layout base: menu com âncoras, tema escuro e responsividade

## Descrição

Estrutura visual da página única: as seis seções vazias, o menu de navegação e o tema escuro em variáveis de CSS. Modo `agente-faz` para servir de exemplo de referência.

## Critérios de aceite

- [x] RF-01: seções Início, Sobre, Stacks, Projetos, Serviços e Contato com `id`; menu leva a cada uma; menu acessível ao rolar; no celular, menu compacto que abre a lista
- [x] RNF-04: todas as cores em variáveis de CSS do tema escuro; nenhuma cor fixa nos componentes
- [x] RNF-01: sem rolagem horizontal de 360px a 1280px+
- [x] RNF-02: menu navegável por teclado com foco visível; HTML semântico (`header`, `nav`, `main`, `section`, `footer`)
- [x] Testes unitários dos componentes (dev) e e2e de navegação por menu e teclado em celular e desktop (qa)

## Contexto relevante

- Depende de: T-005
- [[docs/01-requisitos/requisitos|Requisitos]]
- [[docs/03-tarefas/T-005-monorepo-base|T-005]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).
- 2026-10-10 — George delegou ao orquestrador as decisões das tarefas T-005, T-006, T-001 e T-007 (ver T-005). Decisões abaixo marcadas "decidido pelo orquestrador (delegação)", com as opções documentadas, para revisão do George.
- 2026-10-10 — **D1 — Opcionais da revisão (decidido pelo orquestrador, delegação).** O code-reviewer aprovou e listou: (1) `Menu.tsx:37` usa `estilos.menu`, classe que não existe no CSS Module (atributo `undefined`); (2) comentários dizem "cabeçalho fixo", mas o CSS usa `sticky` (confunde com `position: fixed`); (3) a regex de cor fixa do `tema.test.ts` cobre poucos nomes de cor e não olha `style={{...}}` em `.tsx` (sem caso hoje).
  - **A) Aplicar 1 e 2 agora, antes do QA; registrar 3 como observação**
    - ✅ Remove código morto (1) e um comentário enganoso num projeto didático (2). ✅ Mudanças de uma linha, sem risco. ✅ O 3 não tem caso real hoje; fica anotado para quando o tema crescer.
    - ❌ Mais uma ida ao dev. ❌ Mudança depois da aprovação não volta ao code-reviewer (o QA roda tudo). ❌ O 3 fica pendente.
  - **B) Não aplicar nada**
    - ✅ Zero atraso. ✅ Revisão aprovada como está. ✅ Nada novo para conferir.
    - ❌ Código morto no `Menu.tsx`. ❌ Comentário "fixo" ensina errado quem estuda o projeto. ❌ Pendências pequenas acumuladas.
  - **C) Aplicar os 3**
    - ✅ Nada pendente. ✅ Teste do tema mais robusto. ✅ Cobre `style` inline.
    - ❌ O 3 exige regex/varredura nova sem caso real (risco de falso positivo). ❌ Escopo maior. ❌ Mais tempo.
  - **Escolha: A.** Corrige o que é trivial e didaticamente relevante; o 3 fica como observação para a tarefa em que o tema crescer.

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

### Ajuste pela decisão D1 (não conta rodada)

**Resultado:** CONCLUIDO — removido do `<nav>` do `Menu.tsx` o `className={estilos.menu}` (classe inexistente; o `<nav>` não precisa de estilo próprio); "fixo" trocado por "preso ao topo (sticky)" nos comentários de `Cabecalho.tsx:5` e `index.css:11`. `npm test` (hooks 412, api 8, web 26), `npm run build` e `npm run lint` verdes. Arquivos: `apps/web/src/componentes/Menu/Menu.tsx`, `apps/web/src/componentes/Cabecalho/Cabecalho.tsx`, `apps/web/src/index.css`.

## Revisão

### Rodada 1

**Resultado:** APROVADO — o diff atende aos critérios do dev para RF-01, RNF-01, RNF-02 e RNF-04.

**Verificações:** `npm test` verde (front 26/26 em 9 arquivos, api 8/8, hooks 412/412); `npm run build` verde; `npm run lint` verde; `npm run test:e2e` 8/8 sem mudança no e2e; validador OK.

**Critérios do dev:** RF-01 — seis seções com `id` (`inicio`, `sobre`, `stacks`, `projetos`, `servicos`, `contato`) de uma única lista (`secoes.ts`); cabeçalho `sticky` com `scroll-padding-top`; menu compacto no celular (botão "Menu", lista em posição absoluta), em linha a partir de 48rem. RNF-04 — cores só em `tema.css` (`index.css` sem `#1a1a1a`/`#ffffff`); `tema.test.ts` barra cor fixa em qualquer outro `.css`, inclusive `*.module.css`, ignora comentários e confere que há arquivo para inspecionar. RNF-02 — `header`, `nav` com nome, `main`, `section` com `aria-labelledby`, `footer`; um `h1`, demais `h2`; elementos nativos; `:focus-visible` (contorno de 3px em `--cor-foco`). RNF-01 — mobile-first, `box-sizing: border-box`, `overflow-wrap: break-word`; cobertura de 360–1280px com o qa. Testes por papel (`banner`, `navigation`, `main`, `contentinfo`, `region`, `heading`, `button`, `link`).

**Acessibilidade do menu:** `aria-expanded` acompanha o estado; `aria-controls` aponta para o id da lista (`useId`, confirmado em teste); Esc fecha e devolve o foco (`toHaveFocus`); escolher um link fecha; com a lista fechada, `display: none` tira os links da ordem do Tab.

**`vite.config.ts`:** `css: { include: [/\.css\?raw$/] }` libera só os `?raw`; imports normais seguem vazios (o jsdom não esconde elementos); mudança mínima e correta.

**ADR, área e segurança:** nenhuma dependência nova (`package.json`/lock inalterados); 24 arquivos, todos em `apps/web/**`; sem segredos, sem entrada externa, sem `dangerouslySetInnerHTML`; `App.module.css` virou `Inicio.module.css` sem código morto.

**Opcionais:** (1) `Menu.tsx:37` com `estilos.menu` inexistente; (2) comentários "fixo" em `Cabecalho.tsx:5` e `index.css:11` (o CSS usa `sticky`); (3) regex `COR_FIXA` de `tema.test.ts:15` cobre poucos nomes e não olha `style={{...}}`. Ver D1.

## QA

### Rodada 1

**Resultado:** PASSOU — os cinco critérios atendidos no estado final; o qa escreveu o e2e de navegação, só em `e2e/**`.

**Verificações:** `npm test` (web 26/26, api 8/8, hooks 412/412); `npm run test:e2e` 49 passaram e 7 pulados de propósito (testes só de celular ou só de desktop); suíte de navegação com `--repeat-each 3` duas vezes: 123/123, sem instabilidade; build, lint e validador OK.

**Critérios:**
- **RF-01:** seis seções com `id`, dentro do `main`, na ordem do menu; cada link leva à seção certa nos dois projetos (começando do fim da página; confere a âncora e espera o título abaixo do cabeçalho, aceitando rolagem suave); abrir em `/#servicos` também posiciona certo; cabeçalho em y = 0 depois de rolar, menu utilizável. Celular: botão "Menu" com `aria-expanded=false`, lista por `aria-controls`, 6 links ocultos; abre/fecha, escolher seção fecha, Esc fecha e devolve o foco. Desktop: botão oculto, links em linha.
- **RNF-04:** cores só em `tema.css` (`tema.test.ts` + busca sem cor fixa nem `style={{` fora do tema).
- **RNF-01:** sem rolagem horizontal em 360, 390, 412, 600, 767, 768, 1024, 1280, 1440 e 1920px, nos dois projetos (largura total + elemento passando da borda; abaixo de 768px também com o menu aberto; 767/768 nos dois lados do ponto de troca de 48rem).
- **RNF-02:** `header` com `nav` "Navegação principal", `main`, `footer`; cada `section` é região com nome (Início = nome do `h1`); Tab percorre marca e links (no celular, marca, botão e links depois de abrir) com contorno de foco ≥ 2px; com a lista fechada, Tab não entra nos links ocultos; Enter leva à seção (no celular, fecha a lista).
- **Contraste extra:** botão e links ≥ 4,5:1 sobre o cabeçalho/lista; contorno de foco ≥ 3:1.
- **Testes:** unitários do dev passam; e2e de menu e teclado em celular e desktop escrito e passando.

**Arquivos:** `e2e/testes/navegacao.spec.ts` (novo), `e2e/apoio/cores.ts` (novo — funções de contraste usadas pelos dois specs, fora de `e2e/testes/` porque o Playwright só roda `*.spec.ts`), `e2e/testes/pagina-inicial.spec.ts` (describe "página provisória" → "página inicial").

**Pendências:** (1) diferença cosmética de 1px — o cabeçalho mede `--altura-cabecalho` + 1px de borda e o `scroll-padding-top` usa só a variável; ao seguir "Início", a página para em `scrollY = 1` (nada coberto; o teste aceita 1px e explica) — dono: dev, tarefa futura; (2) seguem abertas a regex `COR_FIXA` (D1, item 3) e o link "Pular para o conteúdo" (decisão do George).

## Estudo

### Diário de estudo (documentador, em paralelo)

**Resultado:** CONCLUIDO — diário [[docs/04-estudos/tarefas/T-007|T-007]] escrito em segundo plano, no worktree isolado, com 11 conceitos (o porquê de cada um), caminhos reais, a D1 e as pendências do qa, e 2 exercícios ("quebrar de propósito" o tema e o `scroll-padding`; acrescentar uma seção no papel). Conceitos novos: `fonte-unica-de-dados-no-front`, `navegacao-por-ancoras`, `cabecalho-sticky-e-scroll-padding`, `menu-compacto-acessivel`, `html-semantico-e-regioes-com-nome`, `foco-visivel-com-focus-visible`, `tema-com-variaveis-de-css`, `teste-que-protege-convencao`, `mobile-first-e-media-queries`; reaproveitados: `vite-react-e-css-modules`, `tipos-de-teste-unitario-rota-e2e`.

Nota por conceito atualizada: [[docs/04-estudos/vite-react-e-css-modules|Vite, React e CSS Modules]] — o item "Tema e layout completos chegam na T-007" virou uma atualização (`App.module.css` removido; estilos em `componentes/Inicio/`), com link para o diário.

## DevOps

## Log

- 2026-10-10 — tarefa criada
- 2026-10-10 — orquestrador: início — implementador dev (tag `front-end`); e2e com o qa
- 2026-10-10 — dev: CONCLUIDO — seis seções, menu por âncoras (compacto no celular), tema escuro em variáveis, HTML semântico; 26 testes do front; build/lint/validador OK; e2e atual 8/8
- 2026-10-10 — code-reviewer: APROVADO — critérios do dev atendidos; 3 opcionais
- 2026-10-10 — orquestrador: D1 (delegação) — aplicar opcionais 1 e 2 antes do QA; 3 como observação
- 2026-10-10 — dev: CONCLUIDO — classe inexistente removida e comentários do cabeçalho sticky corrigidos; test/build/lint OK
- 2026-10-10 — qa: PASSOU — e2e de navegação por menu e teclado (celular/desktop), sem rolagem horizontal de 360 a 1920px; 49 e2e passando, estáveis em repetição
- 2026-10-10 — orquestrador: concluida — verificação verde (`npm test`, `npm run test:e2e` 49 + 7 pulados por projeto, validador); diário de estudo disparado após a integração
- 2026-10-10 — documentador: CONCLUIDO — diário integrado (branch `estudos/T-007`; 1 nota por conceito atualizada)
