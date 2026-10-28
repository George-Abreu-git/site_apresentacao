---
id: T-039
titulo: CI verde de novo — título de Início abaixo do cabeçalho com o nome completo e a DejaVu Sans
status: em-qa
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-28
---

# T-039 — CI verde de novo — título de Início abaixo do cabeçalho com o nome completo e a DejaVu Sans

## Descrição

O CI da `main` está vermelho desde o commit `8f638a2` (`feat(conteudo): usa o nome completo do George`), no passo "Testes de aceitação (e2e)". O último CI verde foi o `5bd5333`. A T-034 corrigiu os testes unitários quebrados por esse commit, mas a falha do e2e só aparece no Linux, com a DejaVu Sans do runner, e passou despercebida na verificação feita no Windows.

Achado do qa na T-033 (container Linux, receita da T-029): `e2e/testes/texto-ampliado.spec.ts:375` ("… com um nome longo e a rolagem suave: cada link do menu para a seção logo abaixo do cabeçalho", T-030) falha nos projetos celular e desktop. Depois do link "Início" do menu, a base do título de `#inicio` fica em 825px; o esperado é até 801px (altura da janela + 1). Falha igual com o código da `main` (não vem da T-033). No Windows (Segoe UI) o mesmo teste é instável: falhou 1 vez na suíte inteira e passou 16/16 sozinho.

Hipótese a confirmar: com a DejaVu Sans, o título de Início ficou mais alto depois do nome completo, e a seção não cabe mais na janela no cenário do teste. Pode ser defeito do layout (o título não deveria ficar fora da tela) ou do teste (expectativa que depende da fonte) — a investigação decide, sem enfraquecer o teste.

Severidade: média (deixa o CI da `main` vermelho).

## Critérios de aceite

- [ ] Causa confirmada e registrada (layout ou teste), com medidas no Linux/DejaVu e no Windows.
- [ ] `texto-ampliado.spec.ts:375` passa no container Linux com a DejaVu Sans (`--repeat-each=3`, `--retries=0`) e no Windows (`--repeat-each=5`), nos projetos celular e desktop, sem enfraquecer o que o teste protege (título da seção logo abaixo do cabeçalho).
- [ ] Suíte e2e inteira verde no container Linux com a DejaVu Sans.
- [ ] CI da `main` verde depois do push.
- [ ] 5 cenários de teste para a mudança, seguindo o padrão do George.
- [ ] Suíte inteira e validador verdes.

## Contexto relevante

- Origem: [[docs/03-tarefas/T-033-foco-apos-ancora-inicial|T-033]] (QA, prova no Linux) e [[docs/03-tarefas/T-034-nome-completo-no-titulo-e-testes|T-034]]
- [[docs/03-tarefas/T-030-scroll-padding-com-cabecalho-alto|T-030]] (teste afetado), [[docs/03-tarefas/T-031-rolagem-suave-em-testes-instaveis|T-031]] e [[docs/03-tarefas/T-038-rolagem-suave-para-no-meio|T-038]] (rolagem suave)
- Receita do container Linux: [[docs/03-tarefas/T-029-cabecalho-texto-ampliado|T-029]]

## Decisões

- 2026-10-17 — George: bugs e erros encontrados viram tarefas, em modo `agente-faz`.
- 2026-10-28 — George (Q7, como fazer o nome completo caber abaixo do cabeçalho alto): opção A — entrelinha 1,2 só no `<h1>` de Início (`.titulo` em `Inicio.module.css`); no pior caso medido (Linux/DejaVu, 360px a 200%) a base do título vai para 748px, com 52px de folga.

## Dev

### Rodada 1

Resultado: AGUARDANDO-DECISAO
Resumo: Causa confirmada: defeito de layout. Com o nome completo no `<h1>` de Início, a 200% e em 360px, o título quebra em 4 linhas de 96px com a DejaVu Sans (3 com a Segoe UI; entrelinha 1,5 herdada do `body`). A seção começa em 441px (cabeçalho de 345 mais `padding-top` de 96), então a base do título fica em 825px, além do limite de 801. A página já está no topo, sem rolagem que resolva. Reproduzido no container Linux (celular e desktop falham só em 360px; 768px passa). No Windows o teste passou 20/20 (`--repeat-each=5`), base em 729px. Medidas: "George Siqueira" no Linux dava 2 linhas (base 633). Nada foi implementado.
Arquivos alterados: nenhum
Pendências:
1. Depois da decisão: 5 cenários unitários (TDD), CSS em `Inicio.module.css` (ou `index.css`), suíte inteira e validador, `texto-ampliado.spec.ts:375` no Linux (`--repeat-each=3 --retries=0`) e no Windows (`--repeat-each=5`), suíte e2e inteira no Linux.
2. Fora do escopo: o `min-height` de `.inicio` desconta `--altura-cabecalho` em vez de `--altura-real-do-cabecalho` (não causa esta falha).
3. A instabilidade antiga do teste no Windows não vem da altura do título; deve ser a rolagem suave interrompida (T-038).
Decisão pendente: Q7 — como fazer o nome completo caber abaixo do cabeçalho alto (A: entrelinha 1,2 só no `<h1>` de Início, base 748; B: entrelinha 1,2 em todos os títulos; C: `padding-top` do Início de 3rem para 1,5rem, base 777). Recomendação do dev: A.
Conceitos para estudo: line-height (entrelinha) em títulos e em texto corrido; métricas de fonte (DejaVu Sans × Segoe UI) e quebra de linha; position: sticky e cabeçalho que cobre conteúdo; scroll-padding-top; reprodução de bug dependente de fonte num container Linux (Docker)

### Rodada 1 (retomada após a decisão Q7)

Resultado: CONCLUIDO
Resumo: Opção A da Q7 aplicada: `line-height: 1.2` só no `.titulo` de Início, sem unidade, com comentário do porquê. 5 cenários unitários lendo o CSS com `?raw` (título com 1.2; valor sem unidade; demais classes do Início sem entrelinha própria; `body` continua 1.5; font-size do título inalterado); os 1 e 2 falharam antes do CSS (TDD) e os 3 a 5 protegem o que não pode mudar. Suíte unitária (web 204 + 1 falha esperada, API 291, shared 5, hooks 465), lint, build e validador verdes. `texto-ampliado.spec.ts:375` passou 20/20 no Windows (`--repeat-each=5`) e 12/12 no container Linux com a DejaVu (`--repeat-each=3 --retries=0`; antes falhava em 360px). Suíte e2e inteira no Linux: 361 passaram, 21 pulados, nenhum instável. Container `t029-linux` parado.
Arquivos alterados: apps/web/src/componentes/Inicio/Inicio.module.css; apps/web/src/componentes/Inicio/Inicio.test.tsx
Pendências:
1. (encerramento) CI da `main` verde depois do push.
2. Fora do escopo: o `min-height` de `.inicio` desconta `--altura-cabecalho` em vez de `--altura-real-do-cabecalho`.
Decisão pendente: nenhuma
Conceitos para estudo: line-height sem unidade × com unidade (herança do valor calculado); entrelinha de títulos × texto corrido; testar regras de CSS como texto (`?raw` do Vite) quando o jsdom não calcula layout; testes de guarda (regressão) dentro do TDD; reprodução de bug dependente de fonte num container Linux (Docker)

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: O diff aplica a opção A da Q7 (`line-height: 1.2` sem unidade, só no `.titulo` de Início), com um comentário claro e 5 cenários unitários que conferem as regras do CSS via `?raw`. Só mexe em arquivos da área do dev. Suíte web verde (204 passaram; a falha esperada é o `it.fails` antigo de `Projetos.test.tsx`), lint e validador OK. Não reexecutou o e2e; as medidas no Linux e no Windows são do relato do dev (prova com o qa).
Arquivos alterados: nenhum
Pendências:
1. *opcional* — O cenário 2 (valor sem unidade) é redundante enquanto o cenário 1 exige exatamente `1.2`.
2. *opcional* — O helper `regra()` só encontra regras de nível superior (não veria `.titulo` dentro de `@media`).
3. Fora do escopo: o `min-height` de `.inicio` usa `--altura-cabecalho` em vez de `--altura-real-do-cabecalho`.
Decisão pendente: nenhuma
Conceitos para estudo: line-height sem unidade × com unidade; testar regras de CSS como texto (`?raw` do Vite) quando o jsdom não calcula layout; testes de guarda contra regressão

## QA

## Estudo

## DevOps

## Log

- 2026-10-28 — tarefa criada
- 2026-10-28 — orquestrador: em-andamento — branch feat/T-039-ci-vermelho-titulo-inicio-dejavu (checkout principal); dev chamado
- 2026-10-28 — dev: AGUARDANDO-DECISAO — causa é layout (título de Início com 4 linhas de 96px na DejaVu); correção visual é decisão do George
- 2026-10-28 — orquestrador: aguardando-decisao — Q7 apresentada ao George
- 2026-10-28 — George: Q7 — A (entrelinha 1,2 no título de Início); orquestrador: em-andamento — dev retoma (rodada 1, após decisão)
- 2026-10-28 — dev: CONCLUIDO — entrelinha 1,2 no título de Início; teste da T-030 verde no Linux (12/12) e no Windows (20/20); e2e inteiro no Linux verde
- 2026-10-28 — orquestrador: em-revisao — code-reviewer chamado
- 2026-10-28 — code-reviewer: APROVADO — opção A aplicada só no título; dentro da área
- 2026-10-28 — orquestrador: em-qa — qa chamado
