---
id: T-034
titulo: Nome completo do George no título da aba e nos testes do cabeçalho e do rodapé
status: em-andamento
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-27
---

# T-034 — Nome completo do George no título da aba e nos testes do cabeçalho e do rodapé

## Descrição

O commit `8f638a2` (`feat(conteudo): usa o nome completo do George`) trocou `pessoa.nome` em `apps/web/src/conteudo/pt-BR.ts` de "George Siqueira" para "George Abreu de Siqueira", mas deixou pendentes o `<title>` de `apps/web/index.html` e os testes do Cabecalho e do Rodape, que ainda esperam "George Siqueira". Resultado: 3 testes unitários vermelhos no `apps/web` (`npm test`):

- `src/conteudo/conteudo.test.tsx` — o título da aba (index.html) é o nome do arquivo de conteúdo;
- `src/componentes/Cabecalho/Cabecalho.test.tsx` — tem o nome do George como link de volta ao início;
- `src/componentes/Rodape/Rodape.test.tsx` — é o rodapé da página (contentinfo) com o nome do George e o ano atual.

O e2e (`npm run test:e2e`) já passa: o `texto-ampliado.spec.ts` usa nomes de teste fixos (`NOME_CURTO`, `NOME_LONGO`), independentes do nome real.

## Critérios de aceite

- [ ] O `<title>` de `apps/web/index.html` é igual a `ptBR.pessoa.nome` ("George Abreu de Siqueira").
- [ ] Os testes do Cabecalho e do Rodape leem o nome de `ptBR.pessoa.nome` em vez de texto fixo, para não quebrarem na próxima troca de nome.
- [ ] `npm test` e `npm run test:e2e` verdes na raiz.
- [ ] `npm run lint` e `python3 scripts/validar_estrutura.py` verdes.

## Contexto relevante

- Commit `8f638a2` (mensagem lista as pendências).
- RF-09 (textos separados do código) — `apps/web/src/conteudo/`.

## Decisões

- 2026-10-27 — George: critérios de aceite como propostos (testes leem `ptBR.pessoa.nome`), modo `agente-faz`, tag `front-end`.

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-27 — tarefa criada
- 2026-10-27 — orquestrador: em-andamento — branch feat/T-034-nome-completo-no-titulo-e-testes; dev chamado
