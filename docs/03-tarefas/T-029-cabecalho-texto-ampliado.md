---
id: T-029
titulo: Cabeçalho e menu não passam da tela com texto ampliado a 200% em 360px
status: em-qa
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-16
---

# T-029 — Cabeçalho e menu não passam da tela com texto ampliado a 200% em 360px

## Descrição

O CI da `main` está vermelho desde a T-025: o e2e `e2e/testes/acessibilidade.spec.ts:136` ("360px com o texto ampliado a 200% e textos longos: nada passa da largura da tela") falha no celular e no desktop, inclusive nas 2 novas tentativas. Os elementos que passam da largura são do cabeçalho: `nav`, `button` (Menu) e os `li`/`a` do menu (RNF-01, RNF-02; WCAG 1.4.4 e 1.4.10).

Só falha com fontes mais largas: o runner do GitHub usa **DejaVu Sans** como `sans-serif` padrão. Nos containers sem ela o cabeçalho cabia por pouco. Receita para reproduzir (orquestrador, 2026-10-16): container `ubuntu:24.04` com Node 24, `npm ci`, `npx playwright install --with-deps chromium`, **`apt-get install -y fonts-dejavu-core`** e `CI=true npx playwright test --workers=2` (script de referência em `C:/Users/GEORGE~1.SIQ/AppData/Local/Temp/claude/c--Users-george-siqueira-Documents-Site-Apresenta--o-George/97669f1a-3c8b-4262-b95e-b2e93096f078/scratchpad/ci-linux-2/rodar-dejavu.sh`, fora do repositório). Com a DejaVu, os 2 testes falham como no CI.

Severidade: média (CI vermelho na `main`).

## Critérios de aceite

- [ ] Em 360px com o texto a 200%, nada do cabeçalho (marca, botão Menu, lista do menu aberta ou fechada) passa da largura da tela, com qualquer fonte `sans-serif` do sistema (comprovado com a DejaVu Sans)
- [ ] O menu continua acessível e funcional (abrir/fechar, foco, teclado) no celular e no desktop
- [ ] Nada é cortado ou escondido para caber (sem `overflow: hidden`, reticências ou `nowrap` no texto)
- [ ] O e2e `acessibilidade.spec.ts:136` passa no container Linux com a DejaVu Sans (receita acima) e o CI da `main` volta ao verde após o push
- [ ] 5 cenários de teste para a mudança (unitário e e2e), seguindo o padrão do George
- [ ] Suíte inteira e validador verdes

## Contexto relevante

- Origem: CI de `604ef8c` (fim da T-025), log colado pelo George em 2026-10-16
- [[docs/03-tarefas/T-025-texto-longo-nos-cards|T-025]]
- [[docs/03-tarefas/T-007-layout-base|T-007]] (cabeçalho e menu)

## Decisões

- 2026-10-16 — George: bugs viram tarefas em `agente-faz` (pedido de 2026-10-15); CI vermelho na `main` → corrigir a causa com prioridade, sem enfraquecer testes (decisão A da T-025, aplicada ao mesmo caso).

## Dev

### Rodada 1

Resultado: CONCLUIDO
Resumo: Duas causas (a nota acertou só a primeira). (1) Cabeçalho: a 200% em 360px, marca (150px, em 2 linhas) + espaço (32px) + botão Menu (154px) + padding (80px) = 416px → `.conteudo` de `Cabecalho.module.css` com `flex-wrap: wrap` (o menu desce para a linha de baixo) e `padding: 0.5rem var(--espaco-lateral)` (altura normal continua 64px). (2) Os `li`/`a` do log do CI eram os botões "Repositório" dos cards, não o menu (fechado, sem ocupar espaço): a palavra em DejaVu negrito a 32px era mais larga que o miolo do card (182px), e `break-word` não reduz a largura mínima → `overflow-wrap: anywhere` em `.link` (card), `.canal` (Contato) e `.atalho` (Atalho), os links com cara de botão. Medido a 360px/200%: largura do conteúdo 360px, nada passando da borda, menu aberto ou fechado. 5 cenários unitários em `responsividade.test.ts` (3 falhavam antes; 2 protegem contra regressão). Container ubuntu:24.04 + Node 24 + DejaVu Sans, `CI=true`, `--workers=2`: `acessibilidade.spec.ts:136` passa nos dois projetos; suíte e2e inteira 268 passaram, 12 pulados, sem instáveis; nenhum `test.fail` passou a passar. Unitários no container (pt-BR.ts do HEAD): web 156 + 3 esperadas, API 227 + 4, shared 5, hooks 412; lint e build verdes. Com o nome novo do George, os testes de 200% e de "nada passa da largura" também passam.
Arquivos alterados:
- `apps/web/src/componentes/Cabecalho/Cabecalho.module.css`, `CartaoDeProjeto/CartaoDeProjeto.module.css`, `Contato/Contato.module.css`, `Atalho/Atalho.module.css`
- `apps/web/src/responsividade.test.ts`
Pendências:
1. qa: e2e da mudança (sugestões: 360px a 200% com o menu aberto; "Repositório" quebrado e inteiro dentro do card; cabeçalho em 2 linhas a 200% e em 1 linha com 64px no tamanho normal).
2. Os 3 unitários locais que falham vêm do `pt-BR.ts` do George (T-015).
3. Possível bug novo: em 360px a 200% o cabeçalho tem 249px e o `scroll-padding-top` (4rem = 128px) não acompanha; ao seguir uma âncora, o título pode ficar atrás do cabeçalho.
4. Confirmar o CI verde na `main` após o push.
Reprodução (fora do repositório): scripts em `scratchpad/t029/` (`rodar.sh`, `rodar-unit.sh`) e container `t029-linux` ligado com Node 24, dependências, Chromium e DejaVu.
Decisão pendente: nenhuma
Conceitos para estudo: `flex-wrap`; min-content e `min-width: auto`; `overflow-wrap: break-word` × `anywhere`; WCAG 1.4.4 e 1.4.10; media queries em rem; fallback de `sans-serif` (DejaVu Sans no Linux); reproduzir o CI num container.
Commit: `fix(web): cabeçalho e links-botão cabem em 360px com o texto a 200%`

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: O diff resolve as duas causas sem cortar ou esconder conteúdo: `flex-wrap: wrap` e padding vertical de 0,5rem no cabeçalho (cabe nos 4rem por causa do border-box) e `overflow-wrap: anywhere` nos links-botão (card, Contato, Atalho). Confirmado que os `li`/`a` do log eram os botões "Repositório" (menu fechado tem `display: none`). Menu inalterado (JSX não tocado; lista `absolute` acompanha o cabeçalho). 5 cenários unitários passam (17/17 no arquivo) e lint passa; as 3 falhas do web vêm do `pt-BR.ts` do George (T-015). Dev só em `apps/web/**`. e2e com a DejaVu não rodado pelo revisor.
Arquivos alterados: nenhum
Pendências:
1. qa: e2e da mudança (5 cenários) e confirmação do `acessibilidade.spec.ts:136` no container Linux com a DejaVu Sans.
2. orquestrador: confirmar o CI verde na `main` após o push.
3. orquestrador: tarefa de bug para o `scroll-padding-top` fixo (`apps/web/src/index.css:12`): com o cabeçalho em 2 linhas a 200%, a âncora pode deixar o título atrás do cabeçalho.
4. *opcional* — o 2º cenário unitário confere o valor exato do padding (frágil).
Decisão pendente: nenhuma
Conceitos para estudo: `flex-wrap`; min-content e `break-word` × `anywhere`; `border-box` com `min-height`; `absolute` dentro de `sticky`; `scroll-padding-top`; WCAG 1.4.4 e 1.4.10.

## QA

### Rodada 1

Resultado: PASSOU
Resumo: Critérios atendidos. Container `t029-linux` (ubuntu:24.04, Node 24, Chromium, `sans-serif` e `system-ui` = DejaVu Sans), `CI=true`, `--workers=2`, `pt-BR.ts` do HEAD: e2e 284 passaram, 12 pulados, sem instáveis, inclusive `acessibilidade.spec.ts:136` nos dois projetos; unitários shared 5, API 227 + 4 esperadas, web 156 + 3. Windows (Segoe UI): e2e 284 + 12 pulados. Validador e lint verdes. 5 cenários novos em `e2e/testes/texto-ampliado.spec.ts` (celular e desktop): cabeçalho em 1 linha com 65px no tamanho normal; a 200% em 360px marca em cima e Menu embaixo, inteiros e com ≥44px; menu aberto a 200% com teclado (Tab, Enter, Esc devolve o foco) e clique; "Repositório" medido com `<canvas>` (exige quebra só se não cabe — independe da fonte); atalhos, "Fale comigo" e canais de Contato a 200%, também com palavra longa.
Arquivos alterados:
- `e2e/testes/texto-ampliado.spec.ts` (novo)
Bugs encontrados (registrados com `test.fail`, fora do escopo):
1. **`scroll-padding-top` fixo (média)**: em 360x800 a 200%, seguir um link do menu deixa o título da seção 24px atrás do cabeçalho (título em y=225, cabeçalho até y=249; `scroll-padding-top` 128px, cabeçalho 249px). Causa: `apps/web/src/index.css:12`. → vira tarefa.
2. **Lista do menu aberta sai da janela a 200% (média)**: em 360x800, "Contato" vai de y=744 a y=840 e não dá para rolar (lista `absolute` dentro do cabeçalho `sticky`). Mesma causa da T-024, agora também com o celular em pé. → ampliar a T-024.
Pendências:
3. *baixa* — `esperarSecaoNaTela` (`e2e/apoio/pagina.ts`) pode passar por engano durante a rolagem suave (o título passa pela posição certa no meio da animação). → vira tarefa.
4. Confirmar o CI verde na `main` após o push.
5. Os 3 unitários que falham no Windows vêm do `pt-BR.ts` do George (T-015).
Decisão pendente: nenhuma
Conceitos para estudo: `measureText` no `<canvas>`; `Range.getClientRects()`; `test.fail`; rolagem suave × movimento reduzido nos testes; `scroll-padding-top` com cabeçalho de altura variável; `absolute` dentro de `sticky`; WCAG 1.4.4 e 1.4.10.

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-16 — orquestrador: em-andamento — prioridade (CI vermelho); dev chamado
- 2026-10-16 — dev: CONCLUIDO — cabeçalho com flex-wrap e links-botão com overflow-wrap: anywhere; :136 verde com a DejaVu
- 2026-10-16 — code-reviewer: APROVADO — duas causas corrigidas em CSS; e2e Linux com o qa
- 2026-10-16 — qa: PASSOU — e2e verde no Linux com a DejaVu Sans; 2 bugs novos com test.fail
