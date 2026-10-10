---
name: registrar-decisao
description: Use quando o George tomar uma decisão técnica ou de arquitetura que precisa ficar registrada (ex.: stack, padrão de API, hospedagem) — cria uma ADR.
---

# Registrar decisão (ADR)

1. Descubra o próximo número: maior `ADR-XXXX` em `docs/02-arquitetura/` + 1 (a primeira é `ADR-0001`).
2. Crie `docs/02-arquitetura/ADR-XXXX-<slug-kebab>.md` a partir de `docs/_templates/adr.md`.
3. Preencha:
   - **Contexto**: o problema e as restrições.
   - **Opções**: as 3 opções apresentadas ao George, com 3 prós e 3 contras cada (as mesmas da rodada de `apresentar-decisao`).
   - **Decisão**: a opção escolhida **pelo George**, com a justificativa dele.
   - **Consequências**: o que muda no projeto, o que fica mais fácil/difícil.
4. `status: aceita` (ou `proposta` se o George ainda não decidiu).
5. Linke a ADR na tarefa de origem (`## Decisões`) e em `docs/02-arquitetura/README.md`.
6. Uma ADR que muda outra: marque a antiga como `substituida` e linke a nova.

Subagentes que precisam de uma ADR não a criam sozinhos: devolvem `AGUARDANDO-DECISAO`; o orquestrador cria após a escolha.
