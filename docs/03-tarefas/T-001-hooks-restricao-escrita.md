---
id: T-001
titulo: Hooks PreToolUse de restrição de escrita por agente
status: em-revisao
modo: agente-faz
tags: [infra, orquestracao]
rodadas: 1
criada: 2026-10-09
---

# T-001 — Hooks PreToolUse de restrição de escrita por agente

## Descrição

Hoje a regra "cada agente só altera a sua área" é garantida por instrução e pela checagem do code-reviewer.
Esta tarefa cria hooks `PreToolUse` no Claude Code que bloqueiam Edit/Write fora das pastas permitidas para cada agente.
**Depende da ADR de stack** (as pastas de código, testes e infra precisam existir), que por sua vez depende do levantamento de requisitos: a ordem é levantamento → ADR → T-001.
Hooks em `Edit|Write` não impedem escrita via `Bash` (`echo > arquivo`, `sed -i`, `git checkout`), então a tarefa também cobre o `Bash`.

## Critérios de aceite

- [ ] Um hook bloqueia Edit/Write do dev fora das pastas de código/teste
- [ ] Um hook bloqueia Edit/Write do qa fora das pastas de teste
- [ ] Um hook bloqueia Edit/Write do instrutor fora de `docs/04-estudos/`
- [ ] Nenhum subagente consegue editar `docs/03-tarefas/`
- [ ] Um hook bloqueia Edit/Write do devops fora da sua área (tabela "Áreas por caminho" do `AGENTS.md`): nunca `src/**`, `docs/03-tarefas/**` nem `docs/04-estudos/**`
- [ ] O code-reviewer não consegue usar Edit/Write; o `Bash` dele fica restrito a leitura (`git diff`, `git log`, `git show`, `git status`) e a rodar testes/lint
- [ ] **Escrita via `Bash`:** um hook com matcher `Bash` bloqueia comandos que escrevem em caminhos protegidos (redirecionamento `>`/`>>`, `tee`, `sed -i`, `mv`, `cp`, `rm`, `git checkout`/`restore`/`reset`...) em `docs/03-tarefas/**` e fora da área de cada agente. Se a análise de comandos se mostrar inviável, a alternativa é retirar o `Bash` do qa e do code-reviewer; a escolha é do George (`apresentar-decisao`)
- [ ] **Identificação do subagente:** verificado se o payload do hook informa qual subagente está agindo (ex.: campos de identificação do agente no JSON de entrada); se não informar, definida uma alternativa (decisão do George) antes de implementar os demais hooks
- [ ] **Definição dos agentes protegida:** nenhum subagente (devops incluso) altera `.claude/agents/**` sem aprovação explícita do George; o hook bloqueia (ou pede confirmação) e há um teste com caso bloqueado e um permitido
- [ ] **Modo auto:** `.claude/settings.json` com o repositório `github.com/George-Abreu-git/site_apresentacao` marcado como confiável na configuração `autoMode` e regras `deny` para `git push --force`/`-f` e `rm -rf` (decisão do George, 2026-10-10)
- [ ] Testes demonstrando um caso bloqueado e um permitido por agente (dev, qa, instrutor, devops e code-reviewer), tanto para Edit/Write quanto para `Bash`

## Contexto relevante

- [[docs/02-arquitetura/specs/2026-10-09-orquestracao-agentes-design|Spec da orquestração]] (decisão "Restrição de escrita por agente")

## Decisões

- 2026-10-10 — George delegou ao orquestrador as decisões das tarefas T-005, T-006, T-001 e T-007 (ver T-005). As decisões abaixo, inclusive as que os critérios 28 e 29 marcam como "decisão do George", são tomadas pelo orquestrador, marcadas "decidido pelo orquestrador (delegação)" e documentadas com as opções, para revisão do George.
- 2026-10-10 — **D1 — Critérios escritos antes da ADR-0001 e da T-014 (decidido pelo orquestrador, delegação).** Os critérios citam `src/**` e não mencionam o documentador nem o orquestrador.
  - **A) Ler os critérios pela tabela "Áreas por caminho" vigente do `AGENTS.md`** (dev → `apps/**` e `packages/**` exceto `apps/api/test/**`; qa → `e2e/**` e `apps/api/test/**`; instrutor e documentador → `docs/04-estudos/**`; devops → plataforma; ninguém além do orquestrador em `docs/03-tarefas/**`), incluir o documentador (que roda no worktree dele) e garantir que a **sessão principal (orquestrador) não é bloqueada**
    - ✅ Os hooks protegem as regras que valem hoje, não as de 2026-10-09. ✅ Uma fonte única (a tabela) para hooks, conferência de área e revisão. ✅ Não trava o orquestrador nem o documentador, que o fluxo novo depende.
    - ❌ O texto literal dos critérios não muda (fica a nota explicando). ❌ Escopo um pouco maior (documentador). ❌ Os hooks precisam acompanhar futuras mudanças da tabela.
  - **B) Seguir o texto literal (`src/**`, sem documentador)**
    - ✅ Fiel à letra dos critérios. ✅ Escopo menor. ✅ Nenhuma interpretação.
    - ❌ `src/` não existe: o hook do dev bloquearia todo o código real em `apps/**`. ❌ O documentador seria bloqueado ao escrever o diário. ❌ Hooks e `AGENTS.md` ficariam em contradição.
  - **C) Reescrever os critérios antes de começar**
    - ✅ Nota e implementação ficam alinhadas na letra. ✅ Revisão e QA leem critérios exatos. ✅ Sem ambiguidade.
    - ❌ Muda critérios que o George escreveu sem ele estar presente. ❌ Atraso. ❌ O mesmo resultado prático da A.
  - **Escolha: A.** É a única leitura que funciona com o repositório de hoje; o texto original dos critérios fica intacto e esta decisão explica a leitura. O critério 26 ("nunca `src/**`") passa a ser "nunca `apps/**`/`packages/**`/`e2e/**`" (código e testes não são área do devops).
- 2026-10-10 — **D2 — `autoMode` do critério 31 (decidido pelo orquestrador, delegação).** A documentação oficial (auto-mode-config) diz que o classificador **não lê** `autoMode` de `.claude/settings.json` nem de `.claude/settings.local.json` — só de `~/.claude/settings.json` ou de configurações gerenciadas — e (permission-modes) que o diretório de trabalho e os remotes configurados no início da sessão **já são confiáveis por padrão** (o `origin` incluído).
  - **A) Não criar o bloco `autoMode`; registrar que o repositório já é confiável por padrão e que as regras `deny` estão feitas**
    - ✅ Não versiona configuração que o Claude Code ignora. ✅ O efeito pedido já existe sem configuração. ✅ Nada muda fora do repositório.
    - ❌ O texto literal do critério 31 não é cumprido. ❌ Sem o remote `origin` no início da sessão, essa confiança não existe. ❌ A confiança não fica escrita no repositório.
  - **B) Criar `autoMode.environment` no `.claude/settings.json` mesmo assim**
    - ✅ Cumpre a letra do critério. ✅ Intenção escrita no repositório. ✅ Valeria se o comportamento mudar.
    - ❌ Sem efeito hoje (falsa sensação de configuração). ❌ Confunde quem revisa. ❌ Repositório definindo as regras do próprio classificador é o que a documentação desaconselha.
  - **C) O George põe o `autoMode` no `~/.claude/settings.json` dele, à mão**
    - ✅ É onde funciona. ✅ Efeito real no classificador. ✅ Extensível a outras infraestruturas.
    - ❌ Não versionado nem revisado. ❌ Fora da área de qualquer agente. ❌ Vale só nesta máquina.
  - **Escolha: A.** Não deixa configuração morta no repositório e o efeito já existe por padrão. O critério 31 fica atendido pelas regras `deny` + este registro; se o modo auto bloquear operações legítimas no `origin`, o George aplica a C.
- 2026-10-10 — **D3 — Escolhas de interpretação do devops (decidido pelo orquestrador, delegação):** aceitas as 7, que seguem a tabela de áreas e as regras do projeto: (1) devops em `.claude/agents/**` → o hook **pergunta** ao George na hora (o critério 30 permite "bloqueia ou pede confirmação"); demais agentes negados; (2) agentes fora da tabela (Explore, general-purpose) não escrevem no repositório; (3) caminhos fora do repositório não são controlados; (4) devops bloqueado em `docs/02-arquitetura/ADR-*` (regra do `AGENTS.md`); (5) code-reviewer pode rodar `npm run build` (checagem de tipos, leitura); (6) implementadores: `git add/restore/checkout -- <caminhos>` só na área, `git fetch` liberado, commit/push/merge/reset/stash negados (quem commita é o orquestrador); (7) PowerShell de subagente só leitura; code-reviewer não usa. Alternativas consideradas para cada uma: negar sempre (mais rígido, quebraria fluxos legítimos) ou liberar (contraria a tabela); a revisão confere.
- 2026-10-10 — **D4 — Opcionais da revisão da rodada 1 (decidido pelo orquestrador, delegação).** Além do ajuste bloqueante, o code-reviewer listou: (2) comandos que escrevem e não são analisados (`curl -o`, `wget -O/-P`, `rsync`, `tar -x/-C`, `unzip -d`, `awk -i inplace`); (3) brechas no code-reviewer (`--fix`, `-u/--update`, `node --import/--require`, `git -c`); (4) bloqueios desnecessários do code-reviewer (laços `for`, `awk` de leitura, `python -X utf8`); (5) linha no README sobre a precedência de `permissions.deny`; (6) dividir `politica.mjs` (759 linhas) e tirar `separarArgs` duplicado.
  - **A) Aplicar 2–5 junto com o bloqueante; deixar 6 para depois**
    - ✅ Fecha brechas reais de segurança (2 e 3) num hook cuja função é justamente segurança. ✅ Tira atrito de fluxos legítimos do code-reviewer (4). ✅ README evita confusão sobre testes × `deny` (5).
    - ❌ Rodada de ajuste maior. ❌ Mais código no `politica.mjs` antes de dividi-lo. ❌ Mais testes para manter.
  - **B) Só o bloqueante**
    - ✅ Rodada menor e mais rápida. ✅ Menos risco de regressão. ✅ Escopo estrito.
    - ❌ O code-reviewer continua podendo rodar `--fix`/`-u`/`git -c` (escrita disfarçada). ❌ `curl -o` e afins continuam fora da análise. ❌ Falsos positivos continuam travando o revisor.
  - **C) Aplicar tudo, inclusive dividir o `politica.mjs`**
    - ✅ Código mais organizado. ✅ Nada pendente. ✅ Melhor leitura para o estudo.
    - ❌ Refatoração junto com correção de segurança aumenta o risco de regressão. ❌ Diff difícil de revisar. ❌ Rodada bem mais longa.
  - **Escolha: A.** Os itens 2–5 melhoram diretamente o que a T-001 promete (restrição de escrita sem travar fluxos legítimos); a refatoração (6) fica como melhoria futura, para não misturar com correção de segurança. O item 6 do code-reviewer sobre o texto do handoff (PowerShell sem `rm -rf` no `deny`) já está correto nesta nota.

## Dev

## Revisão

### Rodada 1

**Resultado:** AJUSTES — hook bem construído; um ajuste bloqueante na análise do Bash.

**Verificações:** `npm run test:hooks` 152/152; `npm test` verde (web, api e hooks); `npm run lint` verde; validador OK. Ao vivo, o hook identificou o revisor como code-reviewer e negou `hostname` ("não está na lista de leitura") — `agent_type` chega ao hook e o formato `command` + `args` com `${CLAUDE_PROJECT_DIR}` funciona.

**Critérios (lidos com D1–D3):** 22–24, 26, 27, 29, 30 e 32 atendidos; 25 e 28 abertos pelo ajuste; 31 atendido pela D2 (`settings.json` só com `deny` e o hook).

**Conferido e correto:** sessão principal nunca bloqueada (`politica.mjs:35`, antes de qualquer lógica); `catch` só nega com `agent_id` (`restringir-escrita.mjs:52`); nunca "allow"; caminhos no Windows (`/c/...`, `/tmp`, barras invertidas, maiúsculas, nomes curtos via `realpath.native`, NFC) e no worktree do documentador; fluxos legítimos passam (code-reviewer: git de leitura, `npm test`, `test:hooks`, `test:e2e`, `build`, `lint`, validador, pipes; qa: `test:e2e`, `npx playwright`; dev: `npm install`); documentador e instrutor sem Bash, ninguém com PowerShell; áreas, segredos e comentários OK.

**Ajuste (bloqueante):** curingas e chaves com `..` escapam da conferência de área (`politica.mjs:133-139`, `shell.mjs:258` e `:117`): (a) curinga seguido de `..` — `rm apps/web/*/../../../docs/03-tarefas/T-001.md` (dev) é permitido; (b) chaves não reconhecidas — `touch docs/{02-arquitetura,03-tarefas}/x.md` (devops) e `touch apps/{web/a,../docs/03-tarefas/b}` (dev) permitidos; (c) `$'...'` com escapes (`apps/$'\x2e\x2e'/docs/...`). Correção: marcar `{` com `,`/`..` fora de aspas como glob e `$'` como dinâmico; incluir `{` no corte do curinga; negar curinga com segmento `..` depois do corte; testes negados para cada forma e permitido para `mkdir -p apps/web/src/{components,hooks}` (dev).

**Opcionais:** (2) `curl -o`, `wget -O/-P`, `rsync`, `tar -x/-C`, `unzip -d`, `awk -i inplace`; (3) code-reviewer: negar `--fix`, `-u/--update`, `node --test --import/--require`, `git -c`; (4) liberar para o code-reviewer laços `for`, `awk` de leitura e `python -X utf8`; (5) README: `permissions.deny` tem precedência sobre o "permitir" do hook (ex.: `rm -rf apps/web/dist` passa no teste do hook, mas a regra nega); (6) dividir `politica.mjs` e tirar `separarArgs` duplicado; texto do handoff do devops citava `rm -rf` no PowerShell (o `settings.json` só tem `git push` no PowerShell). Ver D4.

## QA

## Estudo

## DevOps

### Rodada 1

**Resultado:** AGUARDANDO-DECISAO (resolvida na D2) — hooks implementados, testados e ativos; pendente só a parte `autoMode` do critério 31.

- **Critério 29:** confirmado na documentação oficial (hooks, "Common input fields") e na prática: dentro de um subagente o JSON do `PreToolUse` traz `agent_id` e `agent_type` (o `name` do frontmatter); sem `agent_id` = sessão principal. Depois do registro, um `rm -f` inofensivo do devops em `apps/` foi negado com "fora da área do devops".
- **Critério 28:** o `Bash` é analisável; não foi preciso retirar o `Bash` de ninguém.
- **Implementação:** Node (`.mjs`), runtime do projeto; testes com o executor do próprio Node; sem dependência nova. Edit/Write/MultiEdit/NotebookEdit aplicam a tabela de áreas (D1), com o documentador avaliado relativo à raiz do worktree. Para todo subagente: nunca `docs/03-tarefas/**`, `.git/**`, nem `package-lock.json` editado à mão. Code-reviewer sem Edit/Write e com `Bash` restrito a uma lista de leitura (git de leitura, test, lint, build, validador). Bash dos demais: redirecionamento, `tee`, `sed -i`, `mv`/`cp`/`rm`, `find -delete`, `xargs`, `bash -c`, `$(...)`, heredoc, `cd`, curingas e git que mexe na árvore. PowerShell de subagente só leitura.
- **Segurança da ativação:** sessão principal nunca bloqueada (erro do hook deixa passar); subagente com erro do hook é bloqueado; o hook nunca responde "allow" (não pula confirmações normais); 152 testes rodaram isolados antes do registro.
- **Critério 31 (parte `deny`):** `git push --force`/`-f` (várias posições) e `rm -rf`/`-fr`, no Bash e no PowerShell, valendo também para a sessão principal. O `.claude/settings.json` só tem essas regras `deny` e o registro do hook.
- **Verificação:** `npm run test:hooks` 152/152; `npm test` verde (inclui os hooks, logo roda no CI); `npm run lint` verde; validador OK. E2E não rodado (app não mudou).

**Arquivos:** `.claude/settings.json` (novo), `.claude/hooks/{restringir-escrita,politica,areas,shell}.mjs` e `README.md` (novos), `.claude/hooks/tests/{politica,integracao}.test.mjs` (novos), `package.json` (`test:hooks`; `test` e `lint` incluem os hooks), `eslint.config.mjs` (globals do Node para os hooks), `.github/workflows/ci.yml` (comentário e nome da etapa 7), `AGENTS.md` (parágrafo "Hooks"). Commit `26b671a`.

**Pendências:**
1. Critério 31, `autoMode` → D2.
2. `onFailure: "block"` não usado (exige Claude Code v2.1.295; instalada 2.1.292): o bloqueio por erro está no script; se o próprio `node` não iniciar, o hook não bloqueia. Ativar depois de atualizar.
3. Limite conhecido (no README dos hooks): o que scripts executados (`node x.mjs`, `npm run x`) fazem por dentro não é analisado; a conferência por `git status` e o code-reviewer continuam valendo.
4. As 7 escolhas de interpretação → D3.

### Rodada 2 (ajustes da revisão + D4)

**Resultado:** CONCLUIDO — bloqueante e opcionais 2–5 da D4 aplicados; `npm run test:hooks` 236/236 (eram 152); `npm test`, `npm run lint` e validador verdes. Ao vivo, o hook negou um comando do próprio devops com `$TEMP` ("alvo dinâmico").
1. **Bloqueante:** `{` fora de aspas com `,`/`..` marcado como curinga e chaves; `$'...'`/`$"..."` dinâmicos. Além do sugerido: as chaves são **expandidas em palavras separadas** antes da análise, como o bash (sem isso, `sed -i {s/a/b/,docs/03-tarefas/x}` editaria a nota); chaves misturadas com aspas e expansões com mais de 256 resultados são negadas. Corte do curinga inclui `{`; depois do corte, negado segmento `..` e nome com `.`/`[` inicial com curinga (`.?` casa com `..`). `cd`/`git -C` com curinga deixam o diretório desconhecido (antes, `cd apps/api/te* && rm -rf x` deixava o dev escrever na área do qa). Casos pedidos testados (4 negados; `mkdir -p apps/web/src/{components,hooks}` permitido).
2. **Escrita por opção:** destino conferido em `curl` (`-o`, `-O`, `--output-dir`, cabeçalhos e cookies), `wget` (`-O`, `-P` ou pasta atual; `-e` negado), `rsync` (último argumento como pasta; remoto passa), `tar` (`-x` com `-C` ou pasta atual; `-c`/`-r`/`-u` com `-f`; forma antiga `xzf`), `unzip` (`-d` ou pasta atual; `-l` só lê; `-:` negado), `awk -i inplace`. Além do pedido: `find -exec` com comando fora da lista de escritores passa a ser analisado (`{}` = caminho desconhecido).
3. **code-reviewer, negados:** `--fix`; `-u`, `--update*`, `--outputFile`, `--test-reporter-destination` em npm/npx/node; `node --test` com `--import`/`--require`/`--loader`/`--eval`/opção curta; `git -c`, `--config-env`, `--exec-path`; `git grep -O`. Além do pedido: variáveis antes do comando fora de uma lista segura (ex.: `GIT_EXTERNAL_DIFF`, `NODE_OPTIONS`); `PYTHONUTF8` liberada; `GIT_PAGER`/`PAGER` só com `cat`.
4. **code-reviewer, liberados:** `for`, `for ((...))`, `select`, `case`, `done`/`fi`/`esac`, `while read`, `[[ ]]`, `awk` de leitura (só `-F`/`-v`, sem `system`, `@`, `>`, `|`). Corrigida brecha no python (`python -c "<código>" scripts/validar_estrutura.py` passava): `-X`/`-W` com valor, `-c`/`-m` negados.
5. **README:** precedência do `permissions.deny` (exemplo `rm -rf apps/web/dist`); seções do Bash e de limites atualizadas.

Arquivos: `.claude/hooks/shell.mjs`, `politica.mjs`, `tests/politica.test.mjs`, `README.md`.

**Pendências:** item 6 da D4 (dividir o `politica.mjs`, agora com 1255 linhas, e unificar `separarArgs`/`separarOpcoesGnu`) segue para depois; conferir as duas extensões além do pedido (variáveis de ambiente do code-reviewer; `find -exec`); limites restantes no README (`gzip`, `zip`, `split`, `npx prettier --write`; opção dinâmica como `curl $OPT caminho`; `((i++))` solto no code-reviewer).

## Log

- 2026-10-09 — tarefa criada
- 2026-10-10 — orquestrador: início — implementador devops (tags `infra`, `orquestracao`); D1 (delegação): critérios lidos pela tabela de áreas vigente
- 2026-10-10 — devops: AGUARDANDO-DECISAO — hooks implementados e ativos (152 testes); `autoMode` do critério 31 em aberto
- 2026-10-10 — orquestrador: D2 (delegação) — sem bloco `autoMode` (ignorado pelo Claude Code no projeto); D3 — 7 interpretações aceitas; segue para revisão
- 2026-10-10 — code-reviewer: AJUSTES — curingas/chaves com `..` e `$'...'` escapam da análise do Bash (critérios 25 e 28); rodadas = 1
- 2026-10-10 — orquestrador: D4 (delegação) — aplicar o bloqueante e os opcionais 2–5; refatoração fica para depois
- 2026-10-10 — devops: CONCLUIDO — brechas fechadas (chaves expandidas, `$'...'`, curinga com `..`, escrita por opção, code-reviewer); 236 testes; test/lint/validador OK
