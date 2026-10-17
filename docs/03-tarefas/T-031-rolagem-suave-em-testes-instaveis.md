---
id: T-031
titulo: Testes de navegação estáveis com a rolagem suave
status: backlog
modo: agente-faz
tags: [qa]
rodadas: 0
criada: 2026-10-16
---

# T-031 — Testes de navegação estáveis com a rolagem suave

## Descrição

Achados do qa na T-029. O apoio `esperarSecaoNaTela` (`e2e/apoio/pagina.ts`) pode passar por engano durante a rolagem suave, porque o título passa pela posição certa no meio da animação. Testes de navegação ficaram instáveis na suíte inteira (falham na 1ª tentativa e passam na 2ª): `navegacao.spec.ts:350` ("o botão Voltar do navegador volta à seção anterior", celular; 4 de 6 rodadas no container) e `navegacao.spec.ts:187` ("pelo teclado: Tab chega ao botão, Enter abre…", celular; visto na verificação do orquestrador). Sozinhos passam 20/20.

Severidade: baixa.

## Critérios de aceite

- [ ] `esperarSecaoNaTela` só considera a seção na tela quando a rolagem terminou (ou os testes usam movimento reduzido), sem passar por engano no meio da animação
- [ ] Os testes de navegação não aparecem como instáveis em 5 rodadas da suíte inteira (`--repeat-each=5`) no Windows e no container Linux com a DejaVu Sans
- [ ] Nenhum teste existente é enfraquecido
- [ ] 5 cenários de teste para a mudança, seguindo o padrão do George
- [ ] Suíte inteira e validador verdes

## Contexto relevante

- Origem: [[docs/03-tarefas/T-029-cabecalho-texto-ampliado|T-029]]
- [[docs/01-requisitos/requisitos|Requisitos]]

## Decisões

- 2026-10-16 — George: bugs e erros encontrados viram tarefas, em modo `agente-faz` (pedido de 2026-10-15).

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
