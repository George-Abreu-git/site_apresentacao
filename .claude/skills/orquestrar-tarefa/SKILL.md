---
name: orquestrar-tarefa
description: Use na sessão principal para executar uma tarefa do backlog do início ao fim, coordenando os subagentes dev (e as réplicas dev-2 e dev-3), code-reviewer, qa, instrutor, devops e documentador. Acionada por /executar-tarefa.
---

# Orquestrar tarefa

Você é o orquestrador: delega, transcreve handoffs (contrato em `atualizar-tarefa`; regras de escrita abaixo), commita (`commit-convencional`) e leva decisões ao George (`apresentar-decisao`). Você não implementa.

## Preparação
1. Leia a nota `docs/03-tarefas/T-XXX-*.md`. Se não existir ou não tiver critérios de aceite, pare e peça ao George.
2. Crie/troque para a branch `feat/T-XXX-<slug>` a partir de `main`. Se outra tarefa já estiver em andamento no checkout principal, a nova roda num worktree (seção "Tarefas em paralelo").
3. Status `em-andamento`; linha no Log; commit.

**Modo de fluxo**: se a tarefa tem a tag `revisao`, siga o **modo `revisao`** (abaixo), seja qual for o `modo` da nota. Senão, siga `agente-faz` ou `eu-faco`, conforme a nota.

**Implementador**: `devops` se a tarefa tem tag `infra`, `release` ou `orquestracao` (o devops é o dono da plataforma: orquestração, `scripts/**`, configs da raiz e `docs/**` exceto `03-tarefas` e `04-estudos`); senão `dev` — ou `dev-2`/`dev-3` numa tarefa em paralelo (seção "Tarefas em paralelo"). Nos passos abaixo, "implementador" é um deles.

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
5. **Encerramento** (abaixo) — logo após o `PASSOU` do qa, igual ao `agente-faz`: é o fim do fluxo da tarefa e o último passo dele dispara o **documentador** em paralelo, sem esperar (ele escreve o diário a partir dos guias do instrutor em `## Estudo`). O instrutor **não** fecha o `eu-faco`: não é chamado depois do qa nem escreve nota de estudo no fechamento.

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

O `documentador` escreve `docs/04-estudos/tarefas/T-XXX.md` fora do caminho crítico; ele pode ler e gravar em `docs/04-estudos/**` (mesma área do instrutor), então às vezes também atualiza outras notas de estudo. O frontmatter dele já define `background: true` (roda em segundo plano mesmo que você peça o resultado) e `isolation: worktree` (o Claude Code cria um worktree temporário em `.claude/worktrees/<nome>/`, numa branch `worktree-<nome>`). Ele não commita: você integra o resultado como a branch `estudos/T-XXX`. O outro uso dele, a consolidação (`/estudar-consolidar`), roda do mesmo jeito e é integrado pelos mesmos passos (seção "Consolidação", abaixo).

### Disparo (passo 5 do encerramento)
1. **Pré-condição: o push do passo 4 deu certo.** O worktree do subagente nasce da branch padrão **do remoto** (`origin/main`, padrão `worktree.baseRef: "fresh"` do Claude Code), não do seu `HEAD`; sem o push, ele não veria a tarefa integrada. Sem push (ex.: Cowork, sem credenciais) → não dispare; avise o George e dispare depois que ele fizer o push.
2. Chame o subagente `documentador` com: id e caminho da nota da tarefa e o modo (é isso que indica o uso "Diário da tarefa"). Nada além disso. Não passe `isolation` nem `run_in_background`: o frontmatter já cuida disso.
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
   - `git -C "$WT" rebase main` — a `main` pode ter avançado (ex.: outro diário, uma consolidação, ou a tarefa seguinte já integrada). Nos comandos deste passo e do 7, a consolidação usa `estudos/consolidacao-AAAA-MM-DD` no lugar de `estudos/T-XXX`. Conflito → **Conflito no rebase** (abaixo); não siga para o merge.
   - Checkout principal em outra branch (tarefa em andamento): `git -C "$WT" switch main && git -C "$WT" merge --ff-only estudos/T-XXX`. Checkout principal em `main` (nenhuma tarefa em andamento): `git merge --ff-only estudos/T-XXX` nele.
   - `git push origin main`. Se o push falhar, a `main` local **já** tem o diário (o fast-forward foi feito): não é **Falha** — siga **Push falhou** (abaixo).
7. **Limpeza**: `git worktree remove "$WT"` (se recusar por lock, `git worktree unlock "$WT"` antes). Apague `estudos/T-XXX` e `worktree-<nome>` só depois de confirmar que já estão na `main` (`git merge-base --is-ancestor <branch> main && git branch -D <branch>`) — `git branch -d` compararia com o `HEAD` do checkout principal, que está na tarefa em andamento.
8. A tarefa em andamento nasceu de uma `main` sem o diário: no encerramento dela o merge será `--no-ff` (já previsto no passo 4 do Encerramento). Normalmente não há conflito, porque a tarefa não mexe em `docs/04-estudos/**`; se houver (ex.: ela também alterou uma nota de estudo), vale a regra do passo 4: não faça merge e leve ao George.

### Conflito no rebase (não force nada)
O documentador roda em paralelo à tarefa seguinte e pode mexer em notas por conceito; outro diário ou uma consolidação pode ter alterado a mesma nota antes. Vale para as duas branches de estudo (`estudos/T-XXX` e `estudos/consolidacao-AAAA-MM-DD`). Se o `git -C "$WT" rebase main` conflitar:
1. Anote os arquivos em conflito (`git -C "$WT" diff --name-only --diff-filter=U`) e rode `git -C "$WT" rebase --abort`. **Nada de forçar**: sem `-X ours`/`-X theirs`, sem `git push --force`, sem resolver o conflito por conta própria.
2. **Não descarte**: mantenha o worktree e a branch de estudos como estão (os commits continuam lá) e não integre. A tarefa em andamento segue normalmente.
3. Apresente ao George no próximo ponto de contato (`apresentar-decisao`), com os arquivos em conflito. Opções típicas: resolver o conflito no worktree e seguir do passo 5; integrar só o diário (refazer a branch a partir da `main` sem as outras notas); descartar tudo e redisparar o documentador.
4. Registre a escolha: se for integrar, em `## Decisões` e `## Log` da nota da T-XXX **dentro do worktree** (commit na própria `estudos/T-XXX`; na consolidação não há nota de tarefa, a escolha vai só no corpo do commit) e siga do passo 5; se for descartar, siga **Falha** (o motivo vai para o Log por lá).

### Push falhou (a `main` local já tem o diário)
Vale só para o `git push origin main` do passo 6, depois do fast-forward:
1. Tente o push de novo. Se continuar falhando (ex.: sem credenciais, como no Cowork), avise o George para rodar `git push` no VS Code — igual ao encerramento sem credenciais.
2. Siga a limpeza do passo 7 normalmente: a branch de estudos já está na `main` local, então o `merge-base --is-ancestor` confirma e as branches podem ser apagadas.
3. **Não** registre "diário não integrado" nem siga **Falha**: o diário foi integrado; só falta publicar a `main`.

### Falha (não bloqueia nada)
Documentador com `FALHOU`, sem diário, com arquivo fora da área, algum passo da integração antes do fast-forward falhou (passos 1 a 5 e o merge do passo 6; exceto conflito no rebase, que vai ao George — seção acima), ou o George escolheu descartar. A falha do `git push origin main` não entra aqui (seção **Push falhou**, acima):
1. Descarte o resultado: `git worktree remove --force "$WT"` (se existir; `git worktree unlock "$WT"` antes, se travado) e apague as branches dele (`worktree-<nome>` e, se criada, `estudos/T-XXX`) com `git branch -D`.
2. Registre no Log da tarefa **sem sair da tarefa em andamento**: `git worktree add .claude/worktrees/estudos-T-XXX -b estudos/T-XXX main`, acrescente em `## Log` da nota nesse worktree `- AAAA-MM-DD — documentador: FALHOU — <motivo>; diário não integrado (não bloqueia)`, commit `docs(tarefas): atualiza T-XXX — diário de estudo falhou` e siga os passos 6 e 7 da Integração com `WT=.claude/worktrees/estudos-T-XXX`.
3. Avise o George no próximo ponto de contato; ele pode pedir um novo disparo (volte a "Disparo").

### Consolidação (`/estudar-consolidar`)
A consolidação dos diários em notas por conceito também é do `documentador` (decisão do George na T-014). Não depende de tarefa: o George pede pelo comando, a qualquer momento, inclusive com uma tarefa em andamento. Como o frontmatter vale para toda chamada, ela roda **igual ao diário** — em segundo plano, num worktree criado a partir de `origin/main` — e entra na `main` pela branch `estudos/consolidacao-AAAA-MM-DD` (se já existir uma no mesmo dia, acrescente `-2`, `-3`...). O disparo está no comando; a integração segue os passos da **Integração** acima, com estas diferenças:

| Passo | Diário (`estudos/T-XXX`) | Consolidação (`estudos/consolidacao-AAAA-MM-DD`) |
|---|---|---|
| Disparo | id, caminho e modo da tarefa, depois do push do encerramento | `consolidação` e a lista de diários pendentes na `main`, com a `main` sem commits sem push |
| 2. Conferência de área | qualquer arquivo em `docs/04-estudos/**`; diário da tarefa presente | qualquer arquivo em `docs/04-estudos/**`; nos diários da lista, só a linha `consolidado` muda (`git -C "$WT" diff -- docs/04-estudos/tarefas/`); pelo menos um diário marcado `consolidado: true`; nenhuma nota apagada ou renomeada |
| 3. Branch | `git -C "$WT" switch -c estudos/T-XXX` | `git -C "$WT" switch -c estudos/consolidacao-AAAA-MM-DD` |
| 4. Commits | diário + transcrição na nota da tarefa (dentro do worktree) | um commit só: `git -C "$WT" add docs/04-estudos` e `docs(estudos): consolida diários T-XXX, T-YYY em notas por conceito` (notas criadas e atualizadas no corpo). Não há nota de tarefa nem Log para atualizar |
| 5 a 7. Validador, rebase, fast-forward, push, limpeza | como na Integração | iguais (só o validador — exceção das branches de estudo no `AGENTS.md`) |
| Conflito no rebase | seção acima | seção acima (a escolha do George vai no corpo do commit) |
| Push falhou | seção acima (tentar de novo ou avisar o George; seguir a limpeza) | igual (a consolidação já está na `main` local; não é **Falha**) |
| Falha | descartar e registrar no Log da tarefa | descartar (passo 1 de **Falha**) e avisar o George; não há Log de tarefa para registrar |

No fim, mostre ao George as notas criadas e as atualizadas (lista do handoff). Um diário redisparado depois da consolidação volta a `consolidado: false` e entra na consolidação seguinte.

## Tarefas em paralelo (dev, dev-2, dev-3)

O `dev-2` e o `dev-3` são réplicas do `dev` (mesmo papel, instruções e área; T-035). Com eles, mais de uma tarefa pode estar em andamento ao mesmo tempo: a primeira segue no **checkout principal**, como sempre; cada uma das outras roda num **git worktree** próprio, em `.claude/worktrees/T-XXX` (pasta ignorada pelo git), na sua branch `feat/T-XXX-<slug>`. O fluxo de cada tarefa é o de sempre (modos, rodadas, limite, conferência de área, commits, encerramento); muda só **onde** os comandos rodam e como a integração é ordenada.

### Quando duas tarefas podem rodar juntas
Todas as condições abaixo; na dúvida, rode uma depois da outra.
1. **Implementadores diferentes**: cada tarefa em andamento tem o seu (`dev` no checkout principal; `dev-2` e `dev-3` nos worktrees; `devops` em no máximo uma tarefa; o George, no `eu-faco`, conta como implementador e trabalha no checkout principal).
2. **Sem arquivos em comum previstos**: compare a descrição, os critérios e o "Contexto relevante" das notas (ex.: duas tarefas no mesmo componente ou na mesma nota de estudo não rodam juntas).
3. **Sem dependência entre elas**: nenhuma precisa do resultado da outra.
4. **No máximo uma mexe em dependências** (`package.json` de qualquer workspace e `package-lock.json`): o lock é gerado e conflita fácil.

### Preparação da tarefa no worktree (no lugar dos passos 2 e 3 da Preparação)
Os comandos rodam a partir do checkout principal, que continua na branch da outra tarefa (não troque de branch nele). `WT=.claude/worktrees/T-XXX`.
1. A `main` local deve estar igual à `origin/main` (sem commits sem push). Crie o worktree: `git worktree add "$WT" -b feat/T-XXX-<slug> main`.
2. Instale as dependências **nele** (cada worktree tem a sua `node_modules`): `cd "$WT" && npm ci` (no PowerShell: `Push-Location $WT; npm ci; Pop-Location`). Os navegadores do Playwright ficam no cache do usuário e já servem a todos.
3. **Porta do e2e**: o checkout principal usa a padrão (5173, sem variável). Cada worktree recebe uma porta só dele, a primeira livre entre `5174`, `5175` e `5176`, passada em `E2E_PORTA_FRONT` (o `e2e/playwright.config.ts` a lê; sem ela, um e2e reaproveitaria o servidor do outro checkout e testaria o código errado). Registre a porta no Log da tarefa.
4. Status `em-andamento` e linha no Log (`orquestrador: em-andamento — worktree $WT, branch feat/T-XXX-<slug>, porta do e2e NNNN`) na nota **do worktree** (`$WT/docs/03-tarefas/T-XXX-<slug>.md`); commit com `git -C "$WT"`. Nunca edite a cópia da nota que está no checkout principal.

### Durante o fluxo
- **Chamada de cada subagente** (implementador, code-reviewer, qa; e o instrutor no `eu-faco`, se for o caso): além do id, caminho da tarefa e modo, envie o caminho absoluto do worktree, a instrução de trabalhar **só** dentro dele (ler a nota a partir dele, rodar os comandos lá — `cd "$WT" && ...` ou `git -C "$WT"`), de **não** alterar arquivos do checkout principal, e a porta: `E2E_PORTA_FRONT=NNNN npm run test:e2e`. O code-reviewer e o qa da tarefa também trabalham no worktree dela (`git -C "$WT" diff main...HEAD`).
- **Implementador**: `dev-2` no primeiro worktree e `dev-3` no segundo (ou o `devops`, se a tarefa tem tag `infra`, `release` ou `orquestracao`). Use sempre o mesmo implementador nas rodadas de ajuste da tarefa.
- **Conferência de área**: `git -C "$WT" status --porcelain --untracked-files=all`, com a mesma tabela "Áreas por caminho" (o hook avalia os caminhos relativos à raiz do worktree). Confira também que o `git status --porcelain` do checkout principal só tem o que é da tarefa de lá.
- **Commits**: `git -C "$WT" add <arquivos>` e `git -C "$WT" commit` (mesma ordem de sempre: arquivos do agente, depois a nota).
- **Backlog**: enquanto houver tarefas em paralelo, **nenhuma** delas atualiza o `docs/03-tarefas/backlog.md` durante o fluxo — as linhas das tarefas ficam próximas e conflitariam no rebase. Cada uma atualiza a sua linha só no encerramento (abaixo), já sobre a `main` atual.

### Encerramento em paralelo (uma tarefa de cada vez)
Se duas tarefas chegarem ao `PASSOU` do qa juntas, encerre uma por completo (até o push e a remoção do worktree) antes de começar a outra. A tarefa do checkout principal segue o **Encerramento** normal (o merge pode virar `--no-ff`, já previsto). Para a tarefa do worktree:
1. `definition-of-done` com base nos handoffs (passo 1 do Encerramento).
2. **Atualize sobre a `main`**: `git -C "$WT" rebase main`. Conflito → `git -C "$WT" rebase --abort`, anote os arquivos (nada de forçar), status `aguardando-decisao` e apresente ao George. Se o rebase trouxe mudanças em `package.json`/`package-lock.json`, rode `npm ci` no worktree de novo.
3. **Verificação no worktree** (regra do George, passo 2 do Encerramento): `npm test`, `E2E_PORTA_FRONT=NNNN npm run test:e2e` e `python3 scripts/validar_estrutura.py` (no Windows, `PYTHONUTF8=1`), todos dentro de `$WT`. Algo falhou → não marque `concluida` nem faça merge; status `aguardando-decisao` e apresente ao George.
4. Tudo verde → status `concluida`, Log, a linha da tarefa no backlog (no worktree); commit com `git -C "$WT"`.
5. **Integração** (sempre fast-forward, porque o passo 2 deixou a branch sobre a `main`):
   - checkout principal numa branch de tarefa: `git -C "$WT" switch main && git -C "$WT" merge --ff-only feat/T-XXX-<slug>`;
   - checkout principal em `main` (nenhuma outra tarefa em andamento): `git merge --ff-only feat/T-XXX-<slug>` nele;
   - `git push origin main`. Falhou → tente de novo; sem credenciais, avise o George (igual ao Encerramento).
6. **Diário de estudo**: dispare o `documentador` (passo 5 do Encerramento; ele nasce da `origin/main`, por isso depois do push).
7. **Limpeza**: pare servidores que tenham ficado rodando no worktree (no Windows, arquivos abertos travam a remoção), `git worktree remove "$WT"` (a `node_modules` é ignorada pelo git e sai junto) e apague a branch depois de confirmar que já está na `main`: `git merge-base --is-ancestor feat/T-XXX-<slug> main && git branch -D feat/T-XXX-<slug>`.
8. A outra tarefa em andamento nasceu de uma `main` mais antiga: no encerramento dela, o rebase (worktree) ou o merge `--no-ff` (checkout principal) traz esta. Conflito → George decide, como sempre.

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
