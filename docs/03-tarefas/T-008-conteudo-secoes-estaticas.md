---
id: T-008
titulo: Textos em arquivo de conteúdo e seções Início, Sobre, Serviços e Contato
status: concluida
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-10
---

# T-008 — Textos em arquivo de conteúdo e seções Início, Sobre, Serviços e Contato

## Descrição

Preenche as seções estáticas com textos vindos de arquivo de conteúdo em português (pronto para outro idioma). Modo `eu-faco`: o George implementa com o instrutor guiando.

## Critérios de aceite

- [x] RF-09: todos os textos visíveis em arquivo(s) de conteúdo; nenhum texto escrito direto nos componentes
- [x] RF-02: Início com nome, título, frase de apresentação e atalhos para Projetos e Contato, visíveis sem rolar
- [x] RF-03: Sobre com resumo e links para LinkedIn e GitHub (nova aba)
- [x] RF-07: Serviços com o que é oferecido, para quem, como funciona e botão para Contato
- [x] RF-08: Contato com LinkedIn, e-mail (`mailto:`) e GitHub
- [x] Testes unitários (dev/George) e e2e dos links e atalhos (qa)

## Contexto relevante

- Depende de: T-007
- [[docs/01-requisitos/requisitos|Requisitos]]
- [[docs/03-tarefas/T-007-layout-base|T-007]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).
- 2026-10-15 — George: modo trocado de `eu-faco` para `agente-faz` no início da execução (o dev implementa).
- 2026-10-15 — George: Q1 (dados de contato e textos reais) → **B**: a T-008 segue com o LinkedIn e o e-mail provisórios (`PREENCHER`) e os textos sugeridos; a substituição e a revisão dos textos viram a tarefa T-015 "Conteúdo real do site", que deve vir antes da T-013 (deploy).

## Dev

### Rodada 1

Resultado: AGUARDANDO-DECISAO
Resumo: Criei o arquivo de conteúdo tipado (`apps/web/src/conteudo/`) e todos os textos visíveis, inclusive menu, `aria-label` e rodapé, passaram a vir dele (RF-09). Há um teste que renderiza a página e falha se aparecer texto fora do conteúdo. Implementei Início com atalhos (RF-02), Sobre (RF-03), Serviços com botão para Contato (RF-07) e Contato com `mailto:` (RF-08), com os componentes `LinkExterno` (nova aba + aviso ao leitor de tela) e `Atalho`. `npm test` verde (42 testes no web), lint e build verdes. O LinkedIn e o e-mail são provisórios (`PREENCHER`) e os textos são sugestões: dependem do George.
Arquivos alterados:
- `apps/web/src/conteudo/` (novos): `tipos.ts`, `pt-BR.ts`, `index.ts`, `conteudo.test.tsx`
- `apps/web/src/componentes/` (novos): `Atalho/`, `LinkExterno/`, `Sobre/`, `Servicos/`, `Contato/` (componente, CSS Module e teste)
- alterados: `Inicio/` (tsx, css, teste), `Cabecalho/Cabecalho.tsx`, `Menu/` (tsx e teste), `Rodape/Rodape.tsx`, `App.tsx`, `App.test.tsx`, `secoes.ts`, `tema.test.ts` (regex de cor fixa não confunde mais `white-space` com `white`)
Pendências:
1. Endereço do LinkedIn e e-mail reais em `apps/web/src/conteudo/pt-BR.ts` (hoje `https://www.linkedin.com/in/PREENCHER` e `PREENCHER@exemplo.com`); revisão dos textos sugeridos (título profissional, frase, resumo, Serviços).
2. qa: `e2e/testes/pagina-inicial.spec.ts` (linhas 22 e 42, celular e desktop) procura "Site em construção.", que o RF-02 substituiu — trocar pela frase de apresentação e escrever os e2e da tarefa (atalhos do Início, botão de Serviços, links em nova aba e `mailto:`).
3. Responsividade feita mobile-first, não conferida no navegador; fica com o e2e do qa (sem rolagem horizontal de 360px a 1280px, Início sem rolar).
4. `Secao.module.css` mantém a altura mínima provisória enquanto Stacks e Projetos estão vazias.
Decisão pendente: Q1 — dados de contato e textos reais (A: George informa agora e o dev faz rodada curta no `pt-BR.ts`; B: segue com provisórios e cria tarefa "Conteúdo real do site"; C: George edita depois do merge, fora do fluxo). Recomendação do dev: A.
Conceitos para estudo: arquivo de conteúdo / i18n sem biblioteca; `Record` e tipos derivados de array `as const`; `target="_blank"` com `rel="noopener noreferrer"`; texto visualmente oculto para leitor de tela; nome acessível; link × botão; `mailto:`; `<ol>`/`<ul>`; CSS Grid com `minmax(0, 1fr)`; TreeWalker do DOM; lookbehind em regex.
Commit: `cd4b210 feat(web): adiciona arquivo de conteúdo e seções Início, Sobre, Serviços e Contato`

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: O diff atende RF-02, RF-03, RF-07, RF-08 e RF-09 sem nada fora do escopo. Os textos estão centralizados e tipados em `apps/web/src/conteudo/`, e um teste confere que nenhum texto da página fica fora do conteúdo. Os links externos são seguros e acessíveis, e o `mailto:` está correto. Testes unitários (42 de 42), lint e build passaram. Todos os arquivos do dev estão na área dele. Os dados provisórios foram aceitos pela decisão Q1 → B.
Arquivos alterados: nenhum
Pendências:
1. qa: `e2e/testes/pagina-inicial.spec.ts` ainda procura "Site em construção." — trocar pela frase de apresentação e escrever os e2e da tarefa (atalhos do Início, botão de Serviços, links em nova aba com `rel`, `mailto:`, Início visível sem rolar, sem rolagem horizontal de 360px a 1280px).
2. *opcional*: `Sobre.test.tsx:55-56` e `Contato.test.tsx:244,253-254` montam `new RegExp(...)` com texto do conteúdo; caracteres especiais de regex num texto futuro podem quebrar os testes.
3. *opcional*: `conteudo.test.tsx` só olha nós de texto e `aria-label`; incluir `alt`, `title` e `placeholder` se surgirem.
Decisão pendente: nenhuma
Conceitos para estudo: `as const` e tipos derivados; ciclo de importação só de tipo (`import type`); demais conceitos já listados em `## Dev`.

## QA

### Rodada 1

Resultado: PASSOU
Resumo: e2e da T-008 em `e2e/testes/secoes-estaticas.spec.ts`: Início sem rolar de 360x640 a 1920x1080, atalhos por clique e teclado, links de Sobre e Contato abrindo em nova aba com `rel` seguro e aviso ao leitor de tela, `mailto:` com o endereço, botão de Serviços até o Contato, contraste, foco visível, hierarquia de títulos e todos os textos do arquivo de conteúdo presentes na página. Os testes leem textos e endereços de `pt-BR.ts`, então valem também depois da T-015. Em `pagina-inicial.spec.ts`, "Site em construção." virou a frase de apresentação. As funções de medir a página foram para `e2e/apoio/pagina.ts`. Resultados: e2e com 91 passando e 7 pulados; `npm test` com 8 da API, 42 do web e 412 dos hooks; lint, verificação de tipos e validador verdes.
Arquivos alterados:
- `e2e/testes/secoes-estaticas.spec.ts` (novo)
- `e2e/apoio/pagina.ts` (novo)
- `e2e/testes/pagina-inicial.spec.ts`
- `e2e/testes/navegacao.spec.ts`
Pendências:
1. Observação, não é falha: com o celular deitado (740x360), os atalhos do Início ficam cerca de 7px abaixo da borda da tela (RF-02 e RNF-01 não citam essa orientação).
2. Os e2e passam com o LinkedIn e o e-mail provisórios (Q1 → B); a troca é da T-015 e os testes não precisarão mudar.
Decisão pendente: nenhuma
Conceitos para estudo: `context.route` para simular sites externos; `context.waitForEvent('page')`; `toBeInViewport({ ratio: 1 })`; `toHaveAccessibleName`; importar o arquivo de conteúdo nos e2e; hierarquia h1/h2/h3.

## Estudo

### Diário de estudo (documentador)

Resultado: CONCLUIDO
Resumo: Diário da T-008 escrito em `docs/04-estudos/tarefas/T-008.md` a partir da nota da tarefa e dos trechos de código citados, no template `diario-estudo.md`, com `consolidado: false`. Cobre os 13 conceitos do campo `conceitos` (arquivo de conteúdo como i18n sem biblioteca, tipos derivados com `as const` e `Record`, `import type` no ciclo `secoes.ts`/`tipos.ts`, links externos com `target="_blank"` e `rel`, texto visualmente oculto e nome acessível, link × botão, `mailto:`, grid com `minmax(0, 1fr)`, teste com TreeWalker, e2e com sites externos simulados) e traz 2 exercícios. Reaproveitou nomes de conceitos da T-007 (`fonte-unica-de-dados-no-front`, `html-semantico-e-regioes-com-nome`, `teste-que-protege-convencao`, `tipos-de-teste-unitario-rota-e2e`). Nenhuma outra nota de estudo alterada.
Arquivos alterados:
- `docs/04-estudos/tarefas/T-008.md` (novo)
Pendências: nenhuma
Decisão pendente: nenhuma

## DevOps

## Log

- 2026-10-10 — tarefa criada
- 2026-10-15 — orquestrador: em-andamento — início; modo trocado para agente-faz por decisão do George; dev chamado
- 2026-10-15 — dev: AGUARDANDO-DECISAO — conteúdo e seções implementados; LinkedIn e e-mail provisórios e textos sugeridos dependem do George
- 2026-10-15 — orquestrador: em-revisao — George escolheu B na Q1 (provisórios + nova tarefa T-015); segue para o code-reviewer
- 2026-10-15 — code-reviewer: APROVADO — RF-02/03/07/08/09 atendidos; 42 testes, lint e build verdes; e2e pendente com o qa
- 2026-10-15 — qa: PASSOU — e2e das seções estáticas (91 passando, 7 pulados); suíte, lint e validador verdes
- 2026-10-15 — orquestrador: concluida — verificação verde; diário de estudo disparado após a integração
- 2026-10-15 — documentador: CONCLUIDO — diário integrado
