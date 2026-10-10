---
name: orquestrar-tarefa
description: Use na sessão principal para executar uma tarefa do backlog do início ao fim, coordenando os subagentes dev, code-reviewer, qa, instrutor, devops e documentador. Acionada por /executar-tarefa.
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

**Fim do fluxo**: em todos os modos, a tarefa **termina quando o qa passa** — verificação → `concluida` → merge → push (Encerramento). Aí o `documentador` é disparado **em paralelo** para documentar a tarefa recém-encerrada e a próxima tarefa começa **sem esperar por ele** (ex.: o qa passa a T-006 → o documentador documenta a T-006 enquanto a T-007 já começa). A integração do diário acontece depois, entre etapas da tarefa seguinte (seção "Diário de estudo em paralelo").

## Modo `agente-faz`
1. Status `em-andamento` → **implementador** → confira a área (abaixo) → transcreva o handoff em `## Dev` (ou `## DevOps`); commits (abaixo).
2. Status `em-revisao` → **code-reviewer** → transcreva em `## Revisão`.
   - `AJUSTES` → `rodadas += 1`. Se `rodadas` > 3 → **limite** (abaixo). Senão volte ao passo 1 com a lista (o mesmo implementador).
3. Status `em-qa` → **qa** → confira a área → transcreva em `## QA`; commits.
   - `FALHOU` → `rodadas += 1`. Se `rodadas` > 3 → **limite**. Senão volte ao passo 1 com os bugs.
4. **Encerramento** (abaixo) — logo após o `PASSOU` do qa; é o fim do fluxo da tarefa. O último passo dele dispara o **documentador** em paralelo, sem esperar.

## Modo `eu-faco`
1. Status `em-andamento` → **instrutor** (modo mentor) → transcreva o guia em `## Estudo` (`### Rodada N`) e mostre ao George. Ele codifica.
2. Quando o George disser que terminou: commit do trabalho dele (mensagem convencional).
3. Status `em-revisao` → **code-reviewer** → `AJUSTES`: `rodadas += 1`; se `rodadas` > 3 → **limite**; senão peça ao **instrutor** para traduzir em orientações (transcreva em `## Estudo`), status `em-andamento`, George corrige; repita.
4. Status `em-qa` → **qa** → `FALHOU`: idem passo 3.
5. **Encerramento** (abaixo); o último passo dele dispara o **documentador** em segundo plano, que lê os guias do instrutor em `## Estudo`. O instrutor não escreve nota no fechamento.

## Modo `revisao` (tag `revisao`)
Para tarefas que só **revisam** arquivos existentes e listam achados. Não há implementador nem code-reviewer.
1. Status `em-qa` → **qa** (passo "revisão documental") → confira a área: o qa **não pode alterar nenhum arquivo** (`git status --porcelain` deve ficar limpo; qualquer alteração vale como fora da área) → transcreva em `## QA` (achados com arquivo e severidade); atualize o backlog.
   - `PASSOU` = a revisão foi feita e os achados estão listados (achado não é falha da tarefa).
   - `FALHOU` = o qa não conseguiu cumprir os critérios de aceite da revisão. Sem implementador para devolver, **não** conte rodada: status `aguardando-decisao` e apresente ao George.
2. **Encerramento** (abaixo), que dispara o **documentador** em segundo plano. Os achados viram, se o George quiser, novas tarefas (`/nova-tarefa`).

## Regras em qualquer etapa
- **Limite**: se `rodadas` passar de 3 → status `bloqueada`; apresente ao George as opções (ex.: mais rodadas, mudar o escopo da tarefa, assumir no modo `eu-faco`) no formato `apresentar-decisao`. Se ele escolher **mais rodadas**: `rodadas` volta a `0`, registre em `## Decisões` e no `## Log` ("contador zerado por decisão do George") e volte ao implementador.
- **`AGUARDANDO-DECISAO`** → status `aguardando-decisao`; apresente a rodada ao George; registre a escolha (`## Decisões` ou ADR via `registrar-decisao`); volte ao status da etapa interrompida e retome-a.
- **Conferência de área** (após cada subagente, antes de transcrever): rode `git status --porcelain` e compare cada arquivo alterado com a área do papel (tabela "Áreas por caminho" do `AGENTS.md`). Alteração em `.claude/agents/**` só é aceita se o George a aprovou (decisão registrada em `## Decisões`). Arquivo fora da área → **não commite**; status `aguardando-decisao` e apresente ao George (ex.: aceitar a mudança, desfazer o arquivo, devolver ao agente). O documentador é conferido no worktree dele (seção "Diário de estudo em paralelo"): ali vale qualquer arquivo em `docs/04-estudos/**`, e arquivo fora da área só descarta o resultado.
- **Commits separados**: primeiro os arquivos do agente (mensagem sugerida no handoff), depois a atualização da nota/backlog (`docs(tarefas): atualiza T-XXX — <etapa>`).

## Encerramento
É o fim do fluxo da tarefa: começa logo após o `PASSOU` do qa e termina com o push do passo 4 e o disparo do passo 5. A ordem importa: **verifique antes de marcar `concluida`**, assim nada fica "concluído" e depois desfeito.
1. Rode `definition-of-done` com base nos handoffs; pendências → apresente ao George. O item "diário de estudo disparado" se cumpre no passo 5.
2. **Verificação** (regra do George):
   - rode a suíte de testes completa **e** `python3 scripts/validar_estrutura.py`;
   - enquanto não houver `apps/` nem suíte de testes, rode **só o validador**; quando a suíte existir, ela passa a ser obrigatória (`npm test` e `npm run test:e2e` na raiz).
   - Algo falhou → **não** marque `concluida` e **não** faça merge; status `aguardando-decisao` e apresente ao George (`apresentar-decisao`).
3. Tudo verde → status `concluida`; Log (`orquestrador: concluida — verificação verde; diário de estudo disparado após a integração`); backlog; commit.
4. **Integração**: merge local da branch em `main` (`git switch main && git merge --ff-only feat/T-XXX-<slug>`; se não for fast-forward, `git merge --no-ff`), apague a branch local e faça `git push origin main`. Conflito → **não** faça merge; status `aguardando-decisao` e apresente ao George.
5. **Diário de estudo**: dispare o `documentador` (seção abaixo) e **não espere por ele** — a tarefa já está encerrada; a próxima pode começar em seguida.

## Diário de estudo em paralelo (documentador)

O `documentador` escreve `docs/04-estudos/tarefas/T-XXX.md` fora do caminho crítico; ele pode ler e gravar em `docs/04-estudos/**` (mesma área do instrutor), então às vezes também atualiza outras notas de estudo. O frontmatter dele já define `background: true` (roda em segundo plano mesmo que você peça o resultado) e `isolation: worktree` (o Claude Code cria um worktree temporário em `.claude/worktrees/<nome>/`, numa branch `worktree-<nome>`). Ele não commita: você integra o resultado como a branch `estudos/T-XXX`.

### Disparo (passo 5 do encerramento)
1. **Pré-condição: o push do passo 4 deu certo.** O worktree do subagente nasce da branch padrão **do remoto** (`origin/main`, padrão `worktree.baseRef: "fresh"` do Claude Code), não do seu `HEAD`; sem o push, ele não veria a tarefa integrada. Sem push (ex.: Cowork, sem credenciais) → não dispare; avise o George e dispare depois que ele fizer o push.
2. Chame o subagente `documentador` com: id e caminho da nota da tarefa e o modo. Nada além disso. Não passe `isolation` nem `run_in_background`: o frontmatter já cuida disso.
3. Siga o trabalho (ex.: `/executar-tarefa` da próxima). O documentador não toca no checkout principal.
4. Subagentes em segundo plano mostram pedidos de permissão na sessão principal: aprove só escritas em `docs/04-estudos/**` dentro de `.claude/worktrees/` (nunca no checkout principal).

### Integração (quando chegar a notificação de conclusão do documentador)
Trate a notificação entre duas etapas da tarefa em andamento. **Não interrompa a tarefa**: não troque a branch do checkout principal nem mexa nos arquivos dele — todos os comandos abaixo usam `git -C "$WT"`, exceto o `git push` e a limpeza, que não alteram o checkout principal.

1. **Localize o worktree** (`WT`): o caminho vem na notificação; senão, `git worktree list` e escolha o de `.claude/worktrees/` que contém o diário. Sem worktree (o subagente terminou sem alterações e o Claude Code o removeu) → **Falha**.
2. **Conferência de área**: `git -C "$WT" status --porcelain --untracked-files=all` pode listar **qualquer arquivo em `docs/04-estudos/**`** (o diário e, se o documentador precisou, outras notas de estudo), e o diário `docs/04-estudos/tarefas/T-XXX.md` tem de estar entre eles. Vale como fora da área (→ **Falha**): arquivo fora de `docs/04-estudos/**`, nota existente apagada ou renomeada (regra da `nota-de-estudo`), diário ausente, ou handoff `FALHOU`.
3. **Branch de estudos**: `git -C "$WT" switch -c estudos/T-XXX` (as alterações, ainda não commitadas, vão junto).
4. **Commits na branch de estudos** (mensagens no formato `commit-convencional`, com `Tarefa: T-XXX`):
   - `git -C "$WT" add docs/04-estudos` e commit `docs(estudos): adiciona diário da T-XXX` (se outras notas mudaram, liste-as no corpo da mensagem);
   - transcreva o handoff do documentador em `## Estudo` da nota **dentro do worktree** (`$WT/docs/03-tarefas/T-XXX-<slug>.md`) e uma linha no `## Log` (`documentador: CONCLUIDO — diário integrado`); commit `docs(tarefas): atualiza T-XXX — diário de estudo`. O backlog **não** muda (a tarefa já está `concluida`), o que evita conflito com a tarefa em andamento.
5. **Validador no worktree**: `python3 "$WT/scripts/validar_estrutura.py"` (no Windows, com `PYTHONUTF8=1`). **Só o validador, sem a suíte de testes** — exceção das branches de estudo registrada no `AGENTS.md` (decisão do George na T-014): a branch só altera Markdown e o worktree não tem `node_modules`. Falhou → **Falha**.
6. **Atualize e integre** (sempre fast-forward):
   - `git -C "$WT" rebase main` — a `main` pode ter avançado (ex.: outro diário, uma consolidação, ou a tarefa seguinte já integrada). Conflito → **Conflito no rebase** (abaixo); não siga para o merge.
   - Checkout principal em outra branch (tarefa em andamento): `git -C "$WT" switch main && git -C "$WT" merge --ff-only estudos/T-XXX`. Checkout principal em `main` (nenhuma tarefa em andamento): `git merge --ff-only estudos/T-XXX` nele.
   - `git push origin main`.
7. **Limpeza**: `git worktree remove "$WT"` (se recusar por lock, `git worktree unlock "$WT"` antes). Apague `estudos/T-XXX` e `worktree-<nome>` só depois de confirmar que já estão na `main` (`git merge-base --is-ancestor <branch> main && git branch -D <branch>`) — `git branch -d` compararia com o `HEAD` do checkout principal, que está na tarefa em andamento.
8. A tarefa em andamento nasceu de uma `main` sem o diário: no encerramento dela o merge será `--no-ff` (já previsto no passo 4 do Encerramento). Normalmente não há conflito, porque a tarefa não mexe em `docs/04-estudos/**`; se houver (ex.: ela também alterou uma nota de estudo), vale a regra do passo 4: não faça merge e leve ao George.

### Conflito no rebase (não force nada)
O documentador roda em paralelo à tarefa seguinte e pode mexer em notas por conceito; outro diário ou uma `/estudar-consolidar` pode ter alterado a mesma nota antes. Se o `git -C "$WT" rebase main` conflitar:
1. Anote os arquivos em conflito (`git -C "$WT" diff --name-only --diff-filter=U`) e rode `git -C "$WT" rebase --abort`. **Nada de forçar**: sem `-X ours`/`-X theirs`, sem `git push --force`, sem resolver o conflito por conta própria.
2. **Não descarte**: mantenha o worktree e a branch `estudos/T-XXX` como estão (os commits continuam lá) e não integre. A tarefa em andamento segue normalmente.
3. Apresente ao George no próximo ponto de contato (`apresentar-decisao`), com os arquivos em conflito. Opções típicas: resolver o conflito no worktree e seguir do passo 5; integrar só o diário (refazer a branch a partir da `main` sem as outras notas); descartar tudo e redisparar o documentador.
4. Registre a escolha: se for integrar, em `## Decisões` e `## Log` da nota da T-XXX **dentro do worktree** (commit na própria `estudos/T-XXX`) e siga do passo 5; se for descartar, siga **Falha** (o motivo vai para o Log por lá).

### Falha (não bloqueia nada)
Documentador com `FALHOU`, sem diário, com arquivo fora da área, algum passo da integração falhou (exceto conflito no rebase, que vai ao George — seção acima), ou o George escolheu descartar:
1. Descarte o resultado: `git worktree remove --force "$WT"` (se existir; `git worktree unlock "$WT"` antes, se travado) e apague as branches dele (`worktree-<nome>` e, se criada, `estudos/T-XXX`) com `git branch -D`.
2. Registre no Log da tarefa **sem sair da tarefa em andamento**: `git worktree add .claude/worktrees/estudos-T-XXX -b estudos/T-XXX main`, acrescente em `## Log` da nota nesse worktree `- AAAA-MM-DD — documentador: FALHOU — <motivo>; diário não integrado (não bloqueia)`, commit `docs(tarefas): atualiza T-XXX — diário de estudo falhou` e siga os passos 6 e 7 da Integração com `WT=.claude/worktrees/estudos-T-XXX`.
3. Avise o George no próximo ponto de contato; ele pode pedir um novo disparo (volte a "Disparo").

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
