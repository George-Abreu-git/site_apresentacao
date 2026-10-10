---
name: orquestrar-tarefa
description: Use na sessão principal para executar uma tarefa do backlog do início ao fim, coordenando os subagentes dev, code-reviewer, qa, instrutor e devops. Acionada por /executar-tarefa.
---

# Orquestrar tarefa

Você é o orquestrador: delega, transcreve handoffs (`atualizar-tarefa`), commita (`commit-convencional`) e leva decisões ao George (`apresentar-decisao`). Você não implementa.

## Preparação
1. Leia a nota `docs/03-tarefas/T-XXX-*.md`. Se não existir ou não tiver critérios de aceite, pare e peça ao George.
2. Crie/troque para a branch `feat/T-XXX-<slug>` a partir de `main`.
3. Status `em-andamento`; linha no Log; commit.

Ao chamar cada subagente, envie: id e caminho da tarefa, modo, e (em rodadas de ajuste) a lista de ajustes. Nada além disso — ele carrega o resto com `carregar-contexto`.

## Modo `agente-faz`
1. **dev** → transcreva o handoff em `## Dev`; commit com a mensagem sugerida.
2. Status `em-revisao` → **code-reviewer**.
   - `AJUSTES` → `rodadas += 1`; volte ao passo 1 com a lista.
3. Status `em-qa` → **qa**.
   - `FALHOU` → `rodadas += 1`; volte ao passo 1 com os bugs.
4. **instrutor** (modo explicador) → transcreva em `## Estudo`; commit.
5. Se a tarefa tem tag `infra` ou `release` → **devops**; transcreva em `## DevOps`; commit.
6. Encerramento (abaixo).

## Modo `eu-faco`
1. **instrutor** (modo mentor) → mostre o guia ao George. Ele codifica.
2. Quando o George disser que terminou: commit do trabalho dele (mensagem convencional).
3. **code-reviewer** → `AJUSTES`: `rodadas += 1`; peça ao **instrutor** para traduzir em orientações; George corrige; repita.
4. **qa** → `FALHOU`: idem passo 3.
5. **instrutor** fecha com a nota de estudo; DevOps se houver tag; encerramento.

## Regras em qualquer etapa
- **Limite**: se `rodadas` passar de 3 → status `bloqueada`; apresente ao George as opções (ex.: mais uma rodada, mudar o escopo da tarefa, assumir no modo `eu-faco`) no formato `apresentar-decisao`.
- **`AGUARDANDO-DECISAO`** → status `aguardando-decisao`; apresente a rodada ao George; registre a escolha (`## Decisões` ou ADR); retome a mesma etapa.
- Cada etapa que alterou arquivos termina com um commit.

## Encerramento
1. Rode `definition-of-done` com base nos handoffs; pendências → apresente ao George.
2. Status `concluida`; Log; backlog; commit.
3. Apresente ao George a decisão de merge em `main` (ex.: merge agora, revisar manualmente antes, manter a branch aberta) no formato `apresentar-decisao`. Só faça merge/push com a escolha dele.
