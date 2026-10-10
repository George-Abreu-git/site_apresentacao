---
id: T-014
titulo: Documentação de estudo em paralelo (diário por tarefa em worktree) e consolidação sob demanda
status: concluida
modo: agente-faz
tags: [orquestracao]
rodadas: 1
criada: 2026-10-10
---

# T-014 — Documentação de estudo em paralelo (diário por tarefa em worktree) e consolidação sob demanda

## Descrição

Na T-005 o instrutor (modo explicador) levou mais de 350 min na etapa final e travou o encerramento e o início da T-006. Causa: ele é a última etapa do caminho crítico e, a cada tarefa, lê e reescreve notas por conceito existentes (custo crescente e risco de conflito).

Esta tarefa tira a documentação do caminho crítico:
1. A tarefa **fecha logo após o QA** (verificação → `concluida` → merge → push).
2. Em seguida o orquestrador dispara, **em segundo plano e num git worktree isolado** (branch `estudos/T-XXX`, criada a partir da `main` já com a tarefa integrada), um agente que escreve **um único diário** da tarefa em `docs/04-estudos/tarefas/T-XXX.md`.
3. O orquestrador integra a branch de estudos na `main` quando o agente termina, enquanto a próxima tarefa segue em paralelo.
4. As notas por conceito passam a ser geradas sob demanda pelo comando `/estudar-consolidar`.

O modo `eu-faco` não muda: o instrutor continua síncrono como mentor (ele precisa ler o código da branch da tarefa).

## Critérios de aceite

- [x] **Novo subagente `documentador`** (`.claude/agents/documentador.md`): `background: true`, `isolation: worktree`, `model: inherit`; produto principal: `docs/04-estudos/tarefas/T-XXX.md`; **lê e grava em `docs/04-estudos/**`** (pode consultar e, se necessário, atualizar outras notas de estudo) — *alterado pelo esclarecimento do George de 2026-10-10*; termina com `## Handoff`
- [x] **Template** `docs/_templates/diario-estudo.md`: frontmatter `tipo: diario`, `tarefa`, `data`, `consolidado: false`, `conceitos: []`; seções O que foi feito, Conceitos (curtos, com o porquê), Onde aparece no projeto (caminhos), Exercícios, Links
- [x] **`orquestrar-tarefa`**: no modo `agente-faz` (e no fechamento do `eu-faco`), o fluxo vira implementador → code-reviewer → qa → **encerramento** → **dispara o documentador em background**; regras para integrar `estudos/T-XXX` na `main` (merge + push) quando ele terminar, sem interromper a tarefa em andamento; se o documentador falhar, registrar no Log e seguir (não bloqueia nada)
- [x] **`instrutor`**: deixa de ter o modo explicador no fluxo; mantém o modo mentor (`eu-faco`) e o `/estudar`; **não** consolida — *alterado pela decisão Q3-B do George*
- [x] **Comando `/estudar-consolidar`** (executado pelo **documentador** — *Q3-B*): lê os diários com `consolidado: false`, cria/atualiza notas por conceito em `docs/04-estudos/` (raiz) e marca os diários como `consolidado: true`
- [x] **`nota-de-estudo`** descreve os dois formatos (diário por tarefa e nota por conceito) e quem escreve cada um
- [x] **`definition-of-done`**: o item de encerramento vira "diário de estudo disparado" (não exige o diário pronto)
- [x] **Áreas por caminho** (`AGENTS.md`): documentador → `docs/04-estudos/**`; instrutor → `docs/04-estudos/**` (os dois leem e gravam — *esclarecimento do George*)
- [x] As notas por conceito atuais **ficam onde estão** (nenhum link quebra); `docs/04-estudos/README.md` explica os dois formatos e a pasta `tarefas/`
- [x] Spec e `scripts/validar_estrutura.py` incluem o novo agente, o comando e o template
- [x] **Prova:** o encerramento desta própria tarefa já usa o fluxo novo — o diário `docs/04-estudos/tarefas/T-014.md` é gerado em background e integrado na `main`

## Contexto relevante

- Depende de: nenhuma (entra antes da [[docs/03-tarefas/T-006-ci-github-actions|T-006]], que está pausada na branch dela)
- Recursos do Claude Code usados: campos `background` e `isolation: worktree` do frontmatter de subagentes
- Notas existentes em `docs/04-estudos/` (permanecem como notas por conceito)

## Decisões

- 2026-10-10 — George (Q1-A): tirar a documentação do caminho crítico; formato **diário por tarefa** + consolidação sob demanda (`/estudar-consolidar`); execução em paralelo num worktree.
- 2026-10-10 — consequência registrada na abertura: o diário fica com um **novo agente** (`documentador`), porque o instrutor em modo mentor precisa ler a branch da tarefa e não pode rodar isolado a partir da `main`. Se o George preferir manter um agente só, o orquestrador apresenta a alternativa (`apresentar-decisao`) antes de implementar.
- 2026-10-10 — orquestrador: as alterações em `.claude/agents/**` desta tarefa (novo `documentador.md`; `instrutor.md` sem o modo explicador) estão **aprovadas pelo George** por constarem explicitamente nos critérios de aceite que ele definiu (decisão Q1-A).
- 2026-10-10 — George (Q1-A, rodada 2 de decisões): aprova que o **devops atualize o próprio `devops.md`** nesta tarefa (fluxo termina no encerramento após o QA, com o documentador em paralelo; `docs/04-estudos/**` do instrutor e do documentador).
- 2026-10-10 — George (Q2-A): a branch `estudos/T-XXX` entra na `main` **só com o validador** (sem a suíte), como **exceção explícita registrada no `AGENTS.md`** — ela só altera Markdown e o worktree não tem `node_modules`.
- 2026-10-10 — George (esclarecimento, **altera o 1º critério e o de áreas**): **instrutor e documentador podem ler e gravar em `docs/04-estudos/**`** (o documentador não fica restrito ao próprio diário nem proibido de ler outras notas). **O fluxo da tarefa termina quando o QA passa** (verificação → `concluida` → merge → push); nesse momento o documentador é disparado **em paralelo** para documentar a tarefa recém-finalizada, enquanto a próxima tarefa já começa (ex.: o QA passa a T-006 → o documentador documenta a T-006 em paralelo e a T-007 já inicia). O fluxo não espera o documentador terminar.
- 2026-10-10 — George (Q3-B, **altera o critério do instrutor**): o **instrutor** atua como **mentor no `eu-faco`** e mantém o **`/estudar`** (tirar dúvidas na hora, interativo); **não** consolida. O **documentador** faz o **diário por tarefa** e a **consolidação** (`/estudar-consolidar`). O fechamento do `eu-faco` também passa a disparar o documentador em paralelo (o instrutor não fecha mais com nota de estudo).
- 2026-10-10 — orquestrador: a Q3-B cobre as alterações em `.claude/agents/instrutor.md` e `documentador.md` necessárias para mover a consolidação; critérios 1, 30 e 34 atualizados na nota conforme o esclarecimento e a Q3-B. A exceção do validador também para `estudos/consolidacao-*` segue o mesmo motivo da Q2-A (só Markdown) — **interpretação do orquestrador**, a confirmar pelo George.
- 2026-10-10 — George (Q4-A): **confirma** a exceção "só validador" também para a branch `estudos/consolidacao-AAAA-MM-DD` (mesmo motivo da Q2-A: só Markdown, worktree sem `node_modules`). O texto atual do `AGENTS.md`, da spec, da `commit-convencional` e da `orquestrar-tarefa` fica como está.

## Dev

## Revisão

### Rodada 1

**Resultado:** AGUARDANDO-DECISAO — critérios 27 a 36 atendidos; o 37 é executável pela `orquestrar-tarefa`. Arquivos coerentes entre si (nenhuma contradição sobre quem faz o quê; "explicador" só no plano histórico), cada mudança na área de quem a fez, mudanças em `.claude/agents/**` aprovadas em `## Decisões`, nenhuma nota por conceito movida (só o README mudou em `docs/04-estudos/`), validador OK.

**Segurança do procedimento git:** não interrompe a tarefa em andamento (`git -C "$WT" switch main` funciona porque o checkout principal está na `feat/` e a `main` não está aberta em nenhum worktree); limpeza com `merge-base --is-ancestor` antes do `branch -D`; rebase antes do fast-forward; conflito → `rebase --abort` sem forçar; a branch de estudos não toca o backlog.

**Ajuste:**
1. `orquestrar-tarefa:97-99` (seção "Falha"): o gatilho "algum passo da integração falhou" pega também o `git push origin main` do passo 6 — quando o push falha, a `main` local **já** tem o diário (fast-forward), e a "Falha" registraria falsamente "diário não integrado". Correção: tirar a falha de push do gatilho; com a `main` já avançada, tentar o push de novo ou avisar o George, e seguir a limpeza do passo 7.

**Decisão pendente (Q4):** a exceção "só validador" para `estudos/consolidacao-*` está escrita no `AGENTS.md:61` como "decisão do George na T-014", mas a Q2-A cobre só `estudos/T-XXX` — é interpretação do orquestrador e precisa de confirmação antes do merge.

**Opcionais:** espaço no fim das linhas 3 e 21 de `docs/_templates/diario-estudo.md`; rodar o validador também no registro de FALHOU da seção "Falha"; confirmar na prova como funcionam os pedidos de permissão do subagente em background.

### Rodada 2

**Resultado:** APROVADO — o ajuste da Rodada 1 foi aplicado no commit `e984b8f` (passo 6 → "Push falhou"; seção nova com tentar de novo / avisar o George, limpeza do passo 7 e sem "diário não integrado"; gatilho da "Falha" só antes do fast-forward; linha na tabela da Consolidação). Integração, conflito no rebase, Falha e Consolidação coerentes, sem laço entre "Falha" e "Push falhou". Diff só na área do devops; validador OK; `git status` limpo. Q4 resolvida (George, A).

**Opcional:** `orquestrar-tarefa:100` — quem chega a "Push falhou" pelo registro do FALHOU lê "o diário foi integrado"; poderia ser "o resultado (diário, consolidação ou registro de falha) já está na `main` local". Efeito prático já correto.

## QA

### Rodada 2

**Resultado:** PASSOU — critérios 27 a 36 atendidos no estado atual da branch (já com esclarecimento, Q3-B e Q4-A); o 37 fica para o encerramento, e a `orquestrar-tarefa` deixa disparo e integração executáveis passo a passo (pré-condição de push, comandos concretos, lock do worktree, limpeza segura, conflito, push falho e falha). Diff de 21 arquivos, todos nas áreas certas; o qa não alterou nada.

**Verificação:** validador OK; `npm test` verde (api 8, web 3); em `docs/04-estudos/` só o README mudou, `--diff-filter=DR` vazio (nenhuma nota apagada/renomeada), as 17 notas por conceito seguem na raiz; nenhum link `[[...]]` ou `](*.md)` quebrado nos arquivos alterados.

**Observações (baixa, fora do escopo):** o plano histórico de 2026-10-09 (linha 123) ainda diz "nota de estudo criada"; a spec (linha "Áreas de dev e qa (T-003)") ainda cita `src/**` e `tests/**` — texto anterior à T-014.

## Estudo

### README de `docs/04-estudos/` (pendência 1 do devops)

**Resultado:** CONCLUIDO — o instrutor substituiu as linhas 3-4 do README por: uma tabela com os dois formatos (onde fica, quem escreve, quando — a mesma da skill `nota-de-estudo`); um item sobre `tarefas/` (um diário por tarefa, template `docs/_templates/diario-estudo.md`, campo `consolidado`); um item sobre a raiz (nota por conceito em kebab-case, criada por `/estudar` ou `/estudar-consolidar`; notas existentes nunca são movidas nem renomeadas). Título, linha do grafo e links mantidos. Base: o resumo do devops na nota e a skill `nota-de-estudo`.

### Diário de estudo (documentador, em paralelo)

**Resultado:** CONCLUIDO — diário [[docs/04-estudos/tarefas/T-014|T-014]] escrito em segundo plano, no worktree isolado, a partir da nota da tarefa (8 conceitos: `caminho-critico`, `subagente-em-segundo-plano`, `git-worktree`, `rebase-e-fast-forward`, `diario-e-consolidacao-de-estudo`, `areas-por-caminho-de-escrita`, `dono-da-plataforma-e-aprovacao-humana`, `modo-de-fluxo-por-tag`). As conferências dele passaram (dentro de `.claude/worktrees/`; nota da tarefa `concluida`).

Notas por conceito atualizadas com mudanças pequenas:
- [[docs/04-estudos/modo-de-fluxo-por-tag|Modo de fluxo por tag]] — atualização (T-014): o instrutor saiu do fim do fluxo e o encerramento dispara o documentador; linha do modo `revisao` corrigida (diagrama e pseudocódigo da T-003 mantidos como registro).
- [[docs/04-estudos/areas-por-caminho-de-escrita|Áreas por caminho de escrita]] — linha do documentador no resumo da tabela.

**Prova do critério 37:** disparo depois do push do encerramento, sem esperar; integração pela branch `estudos/T-014` com `git -C` no worktree, enquanto a T-006 já estava em andamento no checkout principal. Observação: nenhum pedido de permissão do documentador apareceu na sessão principal durante esta execução.

## DevOps

### Rodada 1

**Resultado:** CONCLUIDO — todos os critérios implementados, exceto o README de `docs/04-estudos/` (área do instrutor; texto pronto) e a "Prova" (encerramento, orquestrador). Validador OK; as checagens novas foram testadas numa cópia e pegam `background`/`isolation` errados, comando faltando, diário com `tipo`/`tarefa`/`consolidado` inválidos ou sem seções, template com `consolidado: true`.

**Frontmatter conferido na documentação do Claude Code** (`sub-agents.md`, `worktrees.md`): `background: true` (fica em segundo plano), `isolation: worktree` (worktree temporário em `.claude/worktrees/<nome>/`, branch `worktree-<nome>`), `model: inherit`. Pontos que mudaram o desenho:
1. Com `worktree.baseRef: "fresh"` (padrão), o worktree nasce de `origin/main`, não do `HEAD` → o disparo só acontece **depois do `git push origin main`** (sem push, não disparar; avisar o George).
2. A branch criada é `worktree-<nome>`; na integração o orquestrador roda `git -C "$WT" switch -c estudos/T-XXX` e commita (o documentador não tem Bash).
3. `.claude/worktrees/` entrou no `.gitignore` (recomendação da documentação; evita ruído na conferência de área).
- A sessão vigia `.claude/agents/`, então o `documentador` é reconhecido sem reiniciar. Antes de escrever, ele confere se está em `.claude/worktrees/` e se a nota no worktree está `concluida` (senão `FALHOU`).

**Disparo e integração** (passo a passo na `orquestrar-tarefa`, seção "Diário de estudo em paralelo"): disparo depois do push, só com id, caminho e modo, sem esperar; aprovar só a escrita do diário dentro de `.claude/worktrees/`. Integração com `git -C "$WT"` (sem trocar a branch do checkout principal): conferir que só o diário mudou, `switch -c estudos/T-XXX`, commits do diário e da nota (`## Estudo` + Log), validador, `rebase main` → `merge --ff-only` → `git push origin main`, remover o worktree e apagar as branches com `git merge-base --is-ancestor ... main && git branch -D`. Falha não bloqueia: descartar o worktree e registrar no Log via worktree próprio.

**Arquivos:** `.claude/agents/documentador.md` (novo), `.claude/agents/instrutor.md` (sem modo explicador; ganha a consolidação), `.claude/commands/estudar-consolidar.md` (novo), `estudar.md`, `nova-tarefa.md`, skills `orquestrar-tarefa`, `nota-de-estudo` (dois formatos), `definition-of-done` ("diário de estudo disparado"), `atualizar-tarefa`, `carregar-contexto`, `commit-convencional`, `docs/_templates/diario-estudo.md` (novo), spec, `scripts/validar_estrutura.py`, `AGENTS.md` (estrutura, papéis, áreas), `CLAUDE.md`, `.gitignore`. Nenhuma nota por conceito movida ou renomeada. Na spec, "sem `src/`" virou "sem `apps/`".

**Pendências:**
1. `docs/04-estudos/README.md` (área do instrutor) — texto proposto pelo devops para as linhas 3-4, explicando o diário por tarefa (`tarefas/T-XXX.md`, documentador) e a nota por conceito (instrutor, `/estudar` e `/estudar-consolidar`).
2. `.claude/agents/devops.md` com dois trechos desatualizados (linha 18: "code-reviewer → qa → instrutor" → "→ encerramento (documentador)"; linha 26: `docs/04-estudos/**` "do instrutor" → "do instrutor e do documentador"); exige aprovação do George.
3. Leitura do devops: a branch `estudos/T-XXX` entra na `main` só com o validador (sem a suíte), porque só altera Markdown e o worktree não tem `node_modules`.

### Ajuste por decisões do George (Q1-A, Q2-A, esclarecimento — não conta rodada)

**Resultado:** CONCLUIDO — validador OK; 8 arquivos em UTF-8, LF, sem BOM.
1. **`devops.md` (Q1-A):** fluxo termina no encerramento após o QA, documentador em paralelo; `docs/04-estudos/**` do instrutor e do documentador.
2. **Validador só nas branches de estudo (Q2-A):** exceção em "Convenções de git" do `AGENTS.md` (origem e motivo); alinhados o passo 5 da integração na `orquestrar-tarefa`, a spec e a `commit-convencional`. A exceção cobre também `estudos/consolidacao-AAAA-MM-DD` (já previsto na `commit-convencional` e no `/estudar-consolidar`).
3. **Leitura e gravação em `docs/04-estudos/**`:** `documentador.md` sem a restrição antiga (diário continua sendo o produto principal; outras notas podem ser consultadas e, se necessário, receber mudança mínima com Edit, sem mover/renomear/apagar; cada nota alterada citada no handoff); `AGENTS.md` com a mesma área para os dois e linha de papéis atualizada; `carregar-contexto` e `nota-de-estudo` sem o "não lê / não cita outras notas"; validador não precisou mudar.
4. **Conferência na integração (`orquestrar-tarefa`):** aceita qualquer arquivo em `docs/04-estudos/**`, diário obrigatório; barra arquivo fora da pasta, nota apagada/renomeada e diário ausente; `--untracked-files=all` e `git add docs/04-estudos`.
5. **Conflito no rebase** (seção nova, "não force nada"): anotar os arquivos, `rebase --abort`, preservar worktree e branch sem integrar, levar ao George (`apresentar-decisao`), registrar a escolha na nota dentro do worktree; descartar segue a seção "Falha".
6. **Fim do fluxo no QA:** escrito na `orquestrar-tarefa`, no `AGENTS.md` e na spec, com o exemplo T-006 → T-007.

Arquivos: `.claude/agents/devops.md`, `.claude/agents/documentador.md`, skills `orquestrar-tarefa`, `carregar-contexto`, `nota-de-estudo`, `commit-convencional`, `AGENTS.md`, spec. Commit `4b5b875`.

**Pendências:** `instrutor.md` não foi tocado (sem aprovação naquela rodada) — coberto agora pela Q3-B; critérios 1, 30 e 34 da nota atualizados pelo orquestrador conforme as decisões.

### Ajuste pela decisão Q3-B (não conta rodada)

**Resultado:** CONCLUIDO — validador OK; 12 arquivos em UTF-8, LF, sem BOM. (A primeira execução travou por falta de progresso e a seguinte foi interrompida pelo fim da sessão; o agente foi retomado do próprio histórico e concluiu, mantendo os 9 arquivos já corretos.)
- **Instrutor:** mentor no `eu-faco` + `/estudar` interativo; não consolida e não fecha o `eu-faco`.
- **Documentador:** diário por tarefa + consolidação (`/estudar-consolidar`), sempre em segundo plano, worktree a partir de `origin/main`; a consolidação entra pela branch `estudos/consolidacao-AAAA-MM-DD`, com o mesmo procedimento da branch de estudos.
- **`eu-faco`:** fecha com o encerramento após o QA e o documentador em paralelo, igual ao `agente-faz`.
- **Alinhados:** `AGENTS.md` (estrutura, exceção das branches, papéis, áreas), `CLAUDE.md` (documentador também no `/estudar-consolidar` e no fim do `eu-faco`; linha do `/estudar`), spec (decisões, estrutura, tabelas de agentes e skills, fluxo do `eu-faco`, comandos). `definition-of-done` e validador conferidos, sem mudança (o item "diário disparado" não depende do modo; o validador não verifica quem executa o comando). Nenhuma menção restante ao papel antigo do instrutor fora do plano histórico de 2026-10-09.

Arquivos: `.claude/agents/{documentador,instrutor}.md`, `.claude/commands/{estudar-consolidar,estudar}.md`, skills `atualizar-tarefa`, `carregar-contexto`, `commit-convencional`, `nota-de-estudo`, `orquestrar-tarefa`, `AGENTS.md`, `CLAUDE.md`, spec. Commit `b44b0d0`.

**Pendência:** `docs/04-estudos/README.md` (linha ~8) ainda diz que o instrutor escreve no `/estudar-consolidar` — enviada ao instrutor.

### Rodada 2 (ajuste da revisão)

**Resultado:** CONCLUIDO — só o ajuste da Rodada 1 do code-reviewer, na `orquestrar-tarefa`; validador OK.
- **Passo 6 da Integração:** se o `git push origin main` falhar, a `main` local já tem o diário → não é Falha; vai para a seção nova "Push falhou".
- **"Push falhou"** (antes de "Falha"): tentar o push de novo; se continuar falhando, avisar o George para rodar `git push` no VS Code; seguir a limpeza do passo 7 (o `merge-base --is-ancestor` confirma que as branches já estão na `main`); não registrar "diário não integrado".
- **Gatilho da "Falha":** só passos antes do fast-forward (1 a 5 e o merge do passo 6), exceto conflito no rebase.
- **Tabela da Consolidação:** linha "Push falhou" com o mesmo caminho.

Arquivo: `.claude/skills/orquestrar-tarefa/SKILL.md`. Opcionais não aplicados.

## Log

- 2026-10-10 — tarefa criada
- 2026-10-10 — orquestrador: início — implementador devops (tag `orquestracao`)
- 2026-10-10 — devops: CONCLUIDO — documentador, template, `/estudar-consolidar`, fluxo novo na `orquestrar-tarefa`, áreas e validador; README de estudos e `devops.md` pendentes
- 2026-10-10 — instrutor: CONCLUIDO — README de `docs/04-estudos/` explica os dois formatos e a pasta `tarefas/`
- 2026-10-10 — orquestrador: Q1 (`devops.md`) e Q2 (verificação da branch de estudos) apresentadas ao George; revisão aguarda a resposta
- 2026-10-10 — orquestrador: George decidiu Q1-A, Q2-A e esclareceu acesso a `docs/04-estudos/**` e fim do fluxo; devops volta para alinhar (não conta rodada — mudança de decisão, não `AJUSTES`)
- 2026-10-10 — devops: CONCLUIDO — Q1-A, Q2-A e esclarecimento aplicados; conflito no rebase tratado; validador OK
- 2026-10-10 — orquestrador: George decidiu Q3-B (consolidação com o documentador); devops volta para aplicar
- 2026-10-10 — devops: CONCLUIDO — Q3-B aplicada (após travamento e retomada); validador OK
- 2026-10-10 — instrutor: CONCLUIDO — README de estudos atribui a consolidação ao documentador e o `/estudar` ao instrutor
- 2026-10-10 — code-reviewer: AGUARDANDO-DECISAO — critérios atendidos; 1 ajuste (falha de push na seção "Falha"); Q4 (exceção para `estudos/consolidacao-*`) ao George
- 2026-10-10 — orquestrador: George decidiu Q4-A; ajuste da revisão volta ao devops (rodadas = 1)
- 2026-10-10 — devops: CONCLUIDO — "Push falhou" separado da "Falha" na integração de estudos; validador OK
- 2026-10-10 — code-reviewer: APROVADO — ajuste conferido, sem contradições; 1 opcional de texto
- 2026-10-10 — qa: PASSOU — critérios 27 a 36 atendidos; validador e `npm test` verdes; nenhuma nota movida, nenhum link quebrado
- 2026-10-10 — orquestrador: concluida — verificação verde (`npm test`, `npm run test:e2e` 8/8, validador); diário de estudo disparado após a integração (prova do critério 37)
- 2026-10-10 — documentador: CONCLUIDO — diário integrado (branch `estudos/T-014`; 2 notas por conceito atualizadas); critério 37 cumprido
