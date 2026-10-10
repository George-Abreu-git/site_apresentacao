---
id: T-006
titulo: CI no GitHub Actions (validador e testes a cada push)
status: em-andamento
modo: agente-faz
tags: [infra]
rodadas: 0
criada: 2026-10-10
---

# T-006 — CI no GitHub Actions (validador e testes a cada push)

## Descrição

Pipeline de integração contínua que roda em cada push e pull request para `main`.

## Critérios de aceite

- [ ] Workflow em `.github/workflows/ci.yml` com etapas: instalar dependências, `python3 scripts/validar_estrutura.py`, `npm run lint`, `npm test`, `npm run test:e2e`
- [ ] Cache de dependências npm
- [ ] Cada etapa comentada explicando o que faz (didático)
- [ ] Pipeline verde no GitHub após o push

## Contexto relevante

- Depende de: T-005
- [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]]
- [[docs/03-tarefas/T-005-monorepo-base|T-005]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).
- 2026-10-10 — George delegou ao orquestrador as decisões das tarefas T-005, T-006, T-001 e T-007 (ver T-005). Decisões abaixo marcadas "decidido pelo orquestrador (delegação)", para revisão do George.
- 2026-10-10 — **D1 — Como verificar o critério "pipeline verde no GitHub" (decidido pelo orquestrador, delegação).** O repositório é privado (a API pública devolve 404) e o `gh` não está instalado, então o orquestrador não consegue ler o status do Actions.
  - **A) Simular o CI localmente (instalação limpa com `npm ci` + os mesmos comandos do workflow + checagem da sintaxe do YAML), integrar em `main` e deixar a confirmação "verde no GitHub" para o George**
    - ✅ A sequência T-006 → T-001 → T-007 continua sem esperar. ✅ Os mesmos comandos já passam localmente, o que reduz muito o risco de vermelho. ✅ O próprio push em `main` dispara o CI, que o George vê ao acordar.
    - ❌ O critério 4 fica pendente de confirmação humana. ❌ Diferenças de ambiente (Ubuntu × Windows) só aparecem no GitHub. ❌ Se ficar vermelho, a correção vem depois do merge.
  - **B) Enviar a branch ao GitHub e esperar o George confirmar antes do merge**
    - ✅ Nada vai para `main` sem o CI confirmado. ✅ Segue a letra do critério. ✅ Diferenças de ambiente aparecem antes do merge.
    - ❌ Trava a sequência até o George acordar. ❌ A T-001 e a T-007 dependem de `main` atualizada. ❌ Perde a noite de trabalho delegada.
  - **C) Usar a credencial salva do git para consultar a API do GitHub**
    - ✅ Verificação automática, sem esperar ninguém. ✅ Critério fechado pelo próprio fluxo. ✅ Detecta vermelho na hora.
    - ❌ Manusear um segredo do George sem autorização explícita. ❌ Risco de vazar o token em logs. ❌ Contraria o RNF de segredos e a regra de não decidir sobre credenciais.
  - **Escolha: A.** Mantém o ritmo pedido sem tocar em credenciais. O critério 4 fica **sem marcar** até o George confirmar no GitHub; o resto da tarefa segue o fluxo normal. Se o CI ficar vermelho, a correção vira prioridade antes de qualquer outra tarefa.

## Dev

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-10 — tarefa criada
- 2026-10-10 — orquestrador: início — implementador devops (tag `infra`); D1 (delegação): simular CI localmente e deixar a confirmação no GitHub para o George
