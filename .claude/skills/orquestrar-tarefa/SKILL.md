---
name: orquestrar-tarefa
description: Use na sessão principal para executar uma tarefa do backlog do início ao fim, coordenando os subagentes dev, code-reviewer, qa, instrutor e devops. Acionada por /executar-tarefa.
---

# Orquestrar tarefa

Você é o orquestrador: delega, transcreve handoffs (contrato em `atualizar-tarefa`; regras de escrita abaixo), commita (`commit-convencional`) e leva decisões ao George (`apresentar-decisao`). Você não implementa.

## Preparação
1. Leia a nota `docs/03-tarefas/T-XXX-*.md`. Se não existir ou não tiver critérios de aceite, pare e peça ao George.
2. Crie/troque para a branch `feat/T-XXX-<slug>` a partir de `main`.
3. Status `em-andamento`; linha no Log; commit.

**Modo de fluxo**: se a tarefa tem a tag `revisao`, siga o **modo `revisao`** (abaixo), seja qual for o `modo` da nota. Senão, siga `agente-faz` ou `eu-faco`, conforme a nota.

**Implementador**: `devops` se a tarefa tem tag `infra`, `release` ou `orquestracao` (o devops é o dono da plataforma: orquestração, `scripts/**`, configs da raiz e `docs/**` exceto `03-tarefas` e `04-estudos`); senão `dev`. Nos passos abaixo, "implementador" é um deles.

Ao chamar cada subagente, envie: id e caminho da tarefa, modo, e (em rodadas de ajuste) a lista de ajustes. Nada além disso — ele carrega o resto com `carregar-contexto`.

## Modo `agente-faz`
1. Status `em-andamento` → **implementador** → confira a área (abaixo) → transcreva o handoff em `## Dev` (ou `## DevOps`); commits (abaixo).
2. Status `em-revisao` → **code-reviewer** → transcreva em `## Revisão`.
   - `AJUSTES` → `rodadas += 1`. Se `rodadas` > 3 → **limite** (abaixo). Senão volte ao passo 1 com a lista (o mesmo implementador).
3. Status `em-qa` → **qa** → confira a área → transcreva em `## QA`; commits.
   - `FALHOU` → `rodadas += 1`. Se `rodadas` > 3 → **limite**. Senão volte ao passo 1 com os bugs.
4. **instrutor** (modo explicador) → confira a área → transcreva em `## Estudo`; commits.
5. Encerramento (abaixo).

## Modo `eu-faco`
1. Status `em-andamento` → **instrutor** (modo mentor) → transcreva o guia em `## Estudo` (`### Rodada N`) e mostre ao George. Ele codifica.
2. Quando o George disser que terminou: commit do trabalho dele (mensagem convencional).
3. Status `em-revisao` → **code-reviewer** → `AJUSTES`: `rodadas += 1`; se `rodadas` > 3 → **limite**; senão peça ao **instrutor** para traduzir em orientações (transcreva em `## Estudo`), status `em-andamento`, George corrige; repita.
4. Status `em-qa` → **qa** → `FALHOU`: idem passo 3.
5. **instrutor** fecha com a nota de estudo; encerramento.

## Modo `revisao` (tag `revisao`)
Para tarefas que só **revisam** arquivos existentes e listam achados. Não há implementador nem code-reviewer.
1. Status `em-qa` → **qa** (passo "revisão documental") → confira a área: o qa **não pode alterar nenhum arquivo** (`git status --porcelain` deve ficar limpo; qualquer alteração vale como fora da área) → transcreva em `## QA` (achados com arquivo e severidade); atualize o backlog.
   - `PASSOU` = a revisão foi feita e os achados estão listados (achado não é falha da tarefa).
   - `FALHOU` = o qa não conseguiu cumprir os critérios de aceite da revisão. Sem implementador para devolver, **não** conte rodada: status `aguardando-decisao` e apresente ao George.
2. **instrutor** (modo explicador) → confira a área → transcreva em `## Estudo`; commits.
3. Encerramento (abaixo). Os achados viram, se o George quiser, novas tarefas (`/nova-tarefa`).

## Regras em qualquer etapa
- **Limite**: se `rodadas` passar de 3 → status `bloqueada`; apresente ao George as opções (ex.: mais rodadas, mudar o escopo da tarefa, assumir no modo `eu-faco`) no formato `apresentar-decisao`. Se ele escolher **mais rodadas**: `rodadas` volta a `0`, registre em `## Decisões` e no `## Log` ("contador zerado por decisão do George") e volte ao implementador.
- **`AGUARDANDO-DECISAO`** → status `aguardando-decisao`; apresente a rodada ao George; registre a escolha (`## Decisões` ou ADR via `registrar-decisao`); volte ao status da etapa interrompida e retome-a.
- **Conferência de área** (após cada subagente, antes de transcrever): rode `git status --porcelain` e compare cada arquivo alterado com a área do papel (tabela "Áreas por caminho" do `AGENTS.md`). Alteração em `.claude/agents/**` só é aceita se o George a aprovou (decisão registrada em `## Decisões`). Arquivo fora da área → **não commite**; status `aguardando-decisao` e apresente ao George (ex.: aceitar a mudança, desfazer o arquivo, devolver ao agente).
- **Commits separados**: primeiro os arquivos do agente (mensagem sugerida no handoff), depois a atualização da nota/backlog (`docs(tarefas): atualiza T-XXX — <etapa>`).

## Encerramento
A ordem importa: **verifique antes de marcar `concluida`**, assim nada fica "concluído" e depois desfeito.
1. Rode `definition-of-done` com base nos handoffs; pendências → apresente ao George.
2. **Verificação** (regra do George):
   - rode a suíte de testes completa **e** `python3 scripts/validar_estrutura.py`;
   - enquanto não houver `src/` nem suíte de testes (fase atual do projeto), rode **só o validador**; quando a suíte existir, ela passa a ser obrigatória.
   - Algo falhou → **não** marque `concluida` e **não** faça merge; status `aguardando-decisao` e apresente ao George (`apresentar-decisao`).
3. Tudo verde → status `concluida`; Log; backlog; commit.
4. **Integração**: merge local da branch em `main` (`git switch main && git merge --ff-only feat/T-XXX-<slug>`; se não for fast-forward, `git merge --no-ff`), apague a branch local e faça `git push origin main`. Conflito → **não** faça merge; status `aguardando-decisao` e apresente ao George.

## Regras de escrita na nota da tarefa

1. Copie o conteúdo do handoff para a seção do papel (`## Dev`, `## Revisão`, `## QA`, `## Estudo`, `## DevOps`), mantendo o histórico (`### Rodada N`, onde N = `rodadas` + 1 no momento da etapa; a primeira passada é a Rodada 1).
2. Atualize `status` no frontmatter:

| Momento | status |
|---|---|
| Início do fluxo / dev trabalhando | `em-andamento` |
| Antes do code-reviewer | `em-revisao` |
| Antes do qa | `em-qa` |
| Handoff com `AGUARDANDO-DECISAO` | `aguardando-decisao` |
| Limite de rodadas estourado | `bloqueada` |
| Fluxo encerrado | `concluida` |

3. Em `AJUSTES` ou `FALHOU`, incremente `rodadas`. Se `rodadas` passar de 3, status `bloqueada` e apresente a decisão ao George (`apresentar-decisao`).
4. Decisões tomadas pelo George vão para `## Decisões` (ou viram ADR com `registrar-decisao`, com link).
5. Adicione uma linha em `## Log`: `- AAAA-MM-DD — <agente>: <resultado> — <resumo de 1 linha>`.
6. Atualize a linha da tarefa em `docs/03-tarefas/backlog.md` (status).
7. Commite (skill `commit-convencional`) usando a mensagem sugerida, quando houver.
