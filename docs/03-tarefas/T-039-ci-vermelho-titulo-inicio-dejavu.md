---
id: T-039
titulo: CI verde de novo — título de Início abaixo do cabeçalho com o nome completo e a DejaVu Sans
status: backlog
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

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-28 — tarefa criada
