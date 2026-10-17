---
id: T-033
titulo: Tab começa na seção ao abrir o site direto numa âncora
status: backlog
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-17
---

# T-033 — Tab começa na seção ao abrir o site direto numa âncora

## Descrição

Achado do qa na T-023 (acessibilidade). Numa visita nova a `/#contato`, o primeiro Tab vai para a marca do cabeçalho, e não para o primeiro link de Contato como acontece quando o navegador segue a âncora com a página já aberta. O `scrollIntoView` do `useAncoraInicial` rola a página, mas não move o ponto de partida da navegação sequencial por teclado. A pessoa que usa teclado precisa passar pelo menu antes de chegar ao conteúdo da seção.

Severidade: baixa.

## Critérios de aceite

- [ ] Numa visita nova a `/#<secao>`, o primeiro Tab vai para o primeiro elemento focável da seção (ou depois dela), como na navegação para âncora com a página aberta
- [ ] Sem âncora, o Tab continua começando no topo da página (marca)
- [ ] Nenhum foco visível indesejado aparece na carga (o título não ganha contorno de foco sem interação), e a navegação com o menu não muda
- [ ] 5 cenários de teste para a mudança, seguindo o padrão do George, estáveis e independentes de fonte (prova no container Linux com a DejaVu Sans)
- [ ] Suíte inteira e validador verdes

## Contexto relevante

- Origem: [[docs/03-tarefas/T-023-ancora-na-primeira-visita|T-023]] (achado do qa)
- [[docs/01-requisitos/requisitos|Requisitos]]

## Decisões

- 2026-10-17 — George: bugs e erros encontrados viram tarefas, em modo `agente-faz` (pedido de 2026-10-15).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-17 — tarefa criada
