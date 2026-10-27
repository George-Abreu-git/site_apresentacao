---
id: T-024
titulo: Lista do menu cabe ou rola no celular deitado com pouca altura
status: em-andamento
modo: agente-faz
tags: [front-end]
rodadas: 0
criada: 2026-10-16
---

# T-024 — Lista do menu cabe ou rola no celular deitado com pouca altura

## Descrição

BUG-Q3 da T-016, funcionalidades 1 e 11 (RNF-01). Em 568x320, a lista aberta do menu passa da tela (o link "Contato" fica ~17% visível) e não dá para rolar, porque a lista é `absolute` dentro do cabeçalho `sticky`.

Severidade: média (ampliada na T-029: também afeta o celular em pé com o texto a 200%).

## Critérios de aceite

- [ ] Em 568x320 todos os links da lista aberta ficam visíveis ou a lista rola por dentro
- [ ] Nada muda em 640x360 e nas larguras já testadas
- [ ] Também com o celular em pé e o texto a 200% (achado da T-029): em 360x800 a lista aberta vai até y=840 e "Contato" fica fora da janela; o `test.fail` "360x800 a 200%, com um nome longo na marca: a lista aberta cabe na tela ou rola por dentro" (`e2e/testes/texto-ampliado.spec.ts`) vira teste normal e passa
- [ ] O `test.fail` do BUG-Q3 em `e2e/testes/navegacao.spec.ts` vira teste normal e passa
- [ ] 5 cenários de teste para a mudança (unitário, rota e/ou e2e, conforme a área), seguindo o padrão do George
- [ ] Suíte inteira e validador verdes

## Contexto relevante

- Origem: [[docs/03-tarefas/T-016-pente-fino-de-testes|T-016]] (pente-fino de testes)
- [[docs/01-requisitos/requisitos|Requisitos]]

## Decisões

- 2026-10-16 — George: bugs e erros do pente-fino viram tarefas, em modo `agente-faz` (pedido de 2026-10-15).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-27 — orquestrador: em-andamento — branch feat/T-024-menu-celular-deitado; dev chamado
