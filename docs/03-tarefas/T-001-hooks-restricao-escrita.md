---
id: T-001
titulo: Hooks PreToolUse de restrição de escrita por agente
status: em-qa
modo: agente-faz
tags: [infra, orquestracao]
rodadas: 3
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
- 2026-10-10 — **D5 — Rodada 2 da revisão: embrulhos e opcionais (decidido pelo orquestrador, delegação).** Bloqueante: opções de comandos-embrulho (`env -u/-C/-S`, `timeout -s/-k`, `exec -a`, `stdbuf`, `nice`, `time -p`) viram o "nome do comando", e o `rm` que vem depois passa para dev, qa e devops (critérios 25, 28 e 30). Opcionais: (1) `IFS` nas variáveis seguras do code-reviewer (falso positivo em `while IFS= read`); (2) `tar --remove-files`; (3) `curl -K`, `wget --config`, gawk `@include "inplace"`; (4) negar `GIT_DIR`/`GIT_WORK_TREE`/`GIT_INDEX_FILE` como `--git-dir`/`--work-tree`. Com `rodadas = 2`, mais um `AJUSTES` leva a 3 e o quarto bloqueia a tarefa.
  - **A) Bloqueante pela sugestão do revisor (opções com valor consomem o valor; `env -S` e opção de embrulho desconhecida negadas para subagentes; `time -p` tratado) + os 4 opcionais**
    - ✅ Fecha a classe inteira de embrulhos, não só os exemplos (a regra "opção desconhecida = negar" é uma lista de permissões). ✅ Os opcionais são pequenos e fecham brechas da mesma família (2–4) ou um falso positivo real (1). ✅ Reduz a chance de um terceiro `AJUSTES`.
    - ❌ Rodada maior. ❌ Mais regras no `politica.mjs` antes da divisão. ❌ Risco de falso positivo em embrulhos legítimos raros.
  - **B) Só o bloqueante**
    - ✅ Rodada menor. ✅ Menos risco de regressão. ✅ Escopo estrito.
    - ❌ `tar --remove-files`, `curl -K` e `GIT_DIR=` seguem abertos. ❌ O falso positivo de `while IFS= read` continua travando o revisor. ❌ Mais chance de a próxima revisão achar a mesma família.
  - **C) Trocar a abordagem: para subagentes que escrevem, comando desconhecido passa a ser negado (lista de permissões geral)**
    - ✅ Robusto contra qualquer comando novo ou embrulho não previsto. ✅ Acaba com a caça a brechas. ✅ Alinha com o que já vale para o code-reviewer.
    - ❌ Trava fluxos legítimos que ninguém listou (`npx <ferramenta>`, scripts do projeto, utilitários). ❌ Mudança grande no meio da rodada de ajustes, com risco alto de regressão. ❌ Exige catalogar todos os comandos legítimos de dev, qa e devops.
  - **Escolha: A.** Fecha a família de embrulhos com uma lista de opções conhecidas (sem a explosão de falsos positivos da C) e aproveita a rodada para os opcionais baratos. Se a próxima revisão ainda achar brechas desta família, a C fica registrada como alternativa para uma tarefa própria.
- 2026-10-10 — **D6 — Rodada 3 da revisão: 4 bloqueantes, última volta antes do limite (decidido pelo orquestrador, delegação).** Bloqueantes: (1) `timeout` com palavra dinâmica (código novo); (2) `sed` com `e`/`w`/`W` — o code-reviewer executou um comando via `s///e` ao vivo, e quem escreve grava em `docs/03-tarefas/` com `sed -n 'w ...'`; (3) `powershell` sem `-Command`, `cmd //c`, `winpty`, `start`; (4) `GIT_EXTERNAL_DIFF`/`git -c diff.external` para quem escreve. Os itens 2–4 existem desde o primeiro commit e escaparam das rodadas 1 e 2. Opcionais: (5) rede de segurança — comando sem análise com trecho protegido (`docs/03-tarefas`, `.claude/agents`) em algum argumento/atribuição → negar; (6) restringir a negação de `HOME`/`XDG_CONFIG_HOME`/`CURL_HOME`/`WGETRC` a `curl`/`wget`/`git`. Com `rodadas = 3`, mais um `AJUSTES` bloqueia a tarefa e leva a decisão ao George.
  - **A) Corrigir os 4 bloqueantes como o revisor especificou + a rede de segurança (5) + o (6)**
    - ✅ Fecha os 4 caminhos concretos e, com a rede de segurança, a classe inteira "comando não analisado tocando caminho protegido" (`npx rimraf`, `sort -o`, `uniq` e afins), que é o que gerou as três rodadas. ✅ Correções pequenas e bem especificadas, com testes. ✅ Maior chance de a revisão seguinte aprovar, evitando o bloqueio.
    - ❌ Rodada grande na última volta disponível. ❌ A rede de segurança pode negar leituras legítimas de quem escreve que citem `docs/03-tarefas` (ex.: `grep` numa nota) — mitigável deixando leituras conhecidas de fora. ❌ Mais regras no `politica.mjs` antes da divisão.
  - **B) Corrigir só os 4 bloqueantes**
    - ✅ Rodada menor. ✅ Escopo estrito. ✅ Menos risco de falso positivo.
    - ❌ A próxima revisão tende a achar outro comando da mesma família (como nas três rodadas), estourando o limite. ❌ `npx rimraf`, `sort -o` e afins continuam abertos. ❌ Não ataca a causa.
  - **C) Corrigir só o item 1 (código novo) e mover 2–4 + a abordagem "comando desconhecido negado" para uma tarefa própria**
    - ✅ A T-001 fecha agora com o que foi pedido nas rodadas. ✅ A reestruturação vira tarefa com escopo e revisão próprios. ✅ Respeita a observação da D5.
    - ❌ Fecha a T-001 com brechas conhecidas que permitem escrever em `docs/03-tarefas/**` (critérios 25, 27, 28 abertos). ❌ O code-reviewer continua podendo executar comandos via `sed .../e`. ❌ Contraria a Definition of Done (critérios de aceite atendidos).
  - **Escolha: A.** É a única que deixa os critérios atendidos e ataca a causa das rodadas repetidas; a rede de segurança deve excluir leituras conhecidas (`cat`, `grep`, `head`, `less`, `git show`...) para não travar fluxos legítimos. Se a próxima revisão ainda devolver `AJUSTES`, a tarefa fica `bloqueada` e o George decide (a C e a reestruturação por lista de permissões ficam registradas como alternativas).
- 2026-10-10 — **D7 — Opcionais da revisão final (decidido pelo orquestrador, delegação).** O code-reviewer aprovou na rodada 4 e listou 7 opcionais, todos com construção obscura e intenção deliberada: (1, recomendado) `powershellViaBash` perdeu a negação por caminho protegido do `codigoInline` (pequena regressão); (2) opções longas abreviadas do GNU getopt (`sed --in`, `--expr=`, `sort --out=`); (3) script do `sed` vindo de variável; (4) `vim -e -s`/`-s`/`-S`/`-y`; (5) rede de segurança ignora a pasta atual (`cd docs/03-tarefas && <desconhecido>`); (6) falsos positivos da rede (`for ... in docs/03-tarefas/*`, `[ -f ... ]`, `[[ ]]`, `case`); (7) contradição no README.
  - **A) Aplicar agora 1, 4, 6 e 7 (pequenos, seguros e de baixo risco de regressão); deixar 2, 3 e 5 para uma tarefa futura de endurecimento, junto com a divisão do `politica.mjs`**
    - ✅ Corrige a única regressão (1) e um caso trivial de fechar (4: negar `vim` sempre — o Bash da ferramenta não tem terminal). ✅ Tira falsos positivos plausíveis para o devops em tarefas de orquestração (6) e a contradição do README (7). ✅ Mudanças de uma linha ou quase, sem nova revisão pesada.
    - ❌ 2, 3 e 5 seguem abertos (documentados como limites). ❌ Mais uma ida ao devops. ❌ Mudanças depois da aprovação não voltam ao code-reviewer (o QA roda os testes).
  - **B) Não aplicar nada; fechar como aprovado**
    - ✅ Zero atraso. ✅ Encerra uma tarefa já longa (4 rodadas). ✅ Nada novo para revisar.
    - ❌ Deixa a regressão (1) que o próprio revisor recomenda corrigir. ❌ Mantém falsos positivos plausíveis. ❌ README contraditório.
  - **C) Aplicar os 7 agora**
    - ✅ Nada pendente. ✅ Fecha os prefixos do getopt e o script dinâmico do sed. ✅ Rede de segurança mais completa.
    - ❌ 2, 3 e 5 exigem lógica nova (prefixos, análise parcial de script dinâmico, pasta atual), com risco real de regressão sem revisão. ❌ `politica.mjs` (~1600 linhas) cresce ainda mais antes da divisão. ❌ Escopo além do que a T-001 precisa para os critérios.
  - **Escolha: A.** Fecha a regressão e o que é trivial; o que exige lógica nova vai para uma tarefa de endurecimento (sugestão ao George: "endurecer e dividir o hook de restrição de escrita" — itens 2, 3 e 5 desta revisão + item 6 da D4). Não conta rodada (não é `AJUSTES`).

## Dev

## Revisão

### Rodada 1

**Resultado:** AJUSTES — hook bem construído; um ajuste bloqueante na análise do Bash.

**Verificações:** `npm run test:hooks` 152/152; `npm test` verde (web, api e hooks); `npm run lint` verde; validador OK. Ao vivo, o hook identificou o revisor como code-reviewer e negou `hostname` ("não está na lista de leitura") — `agent_type` chega ao hook e o formato `command` + `args` com `${CLAUDE_PROJECT_DIR}` funciona.

**Critérios (lidos com D1–D3):** 22–24, 26, 27, 29, 30 e 32 atendidos; 25 e 28 abertos pelo ajuste; 31 atendido pela D2 (`settings.json` só com `deny` e o hook).

**Conferido e correto:** sessão principal nunca bloqueada (`politica.mjs:35`, antes de qualquer lógica); `catch` só nega com `agent_id` (`restringir-escrita.mjs:52`); nunca "allow"; caminhos no Windows (`/c/...`, `/tmp`, barras invertidas, maiúsculas, nomes curtos via `realpath.native`, NFC) e no worktree do documentador; fluxos legítimos passam (code-reviewer: git de leitura, `npm test`, `test:hooks`, `test:e2e`, `build`, `lint`, validador, pipes; qa: `test:e2e`, `npx playwright`; dev: `npm install`); documentador e instrutor sem Bash, ninguém com PowerShell; áreas, segredos e comentários OK.

**Ajuste (bloqueante):** curingas e chaves com `..` escapam da conferência de área (`politica.mjs:133-139`, `shell.mjs:258` e `:117`): (a) curinga seguido de `..` — `rm apps/web/*/../../../docs/03-tarefas/T-001.md` (dev) é permitido; (b) chaves não reconhecidas — `touch docs/{02-arquitetura,03-tarefas}/x.md` (devops) e `touch apps/{web/a,../docs/03-tarefas/b}` (dev) permitidos; (c) `$'...'` com escapes (`apps/$'\x2e\x2e'/docs/...`). Correção: marcar `{` com `,`/`..` fora de aspas como glob e `$'` como dinâmico; incluir `{` no corte do curinga; negar curinga com segmento `..` depois do corte; testes negados para cada forma e permitido para `mkdir -p apps/web/src/{components,hooks}` (dev).

**Opcionais:** (2) `curl -o`, `wget -O/-P`, `rsync`, `tar -x/-C`, `unzip -d`, `awk -i inplace`; (3) code-reviewer: negar `--fix`, `-u/--update`, `node --test --import/--require`, `git -c`; (4) liberar para o code-reviewer laços `for`, `awk` de leitura e `python -X utf8`; (5) README: `permissions.deny` tem precedência sobre o "permitir" do hook (ex.: `rm -rf apps/web/dist` passa no teste do hook, mas a regra nega); (6) dividir `politica.mjs` e tirar `separarArgs` duplicado; texto do handoff do devops citava `rm -rf` no PowerShell (o `settings.json` só tem `git push` no PowerShell). Ver D4.

### Rodada 2

**Resultado:** AJUSTES — o bloqueante da rodada 1 e os opcionais 2–5 da D4 estão aplicados e testados, sem regressão; há um novo bloqueante (anterior a este commit, não visto na rodada 1).

**Verificações (com os hooks valendo para o revisor):** `test:hooks` 236/236; `npm test` verde; lint verde; validador OK com `PYTHONUTF8=1` e com `python -X utf8`. Fluxos legítimos rodados ao vivo: git de leitura (inclusive `HEAD@{1}..HEAD`, chave literal), `awk '{print $1}'` em pipe, laço `for` com `wc`, `npm run build`, `CI=1 npm run test:e2e -- --list`. `env -S 'GIT_EXTERNAL_DIFF=x git diff'` negado. Fluxos do qa e do dev conferidos pelo código e pelos testes. Área: só `.claude/hooks/**`.

**Extensões além do pedido:** corretas — expansão de chaves (necessária; aspas misturadas negadas; limite de 256; `HEAD@{1}` literal); variáveis seguras (fecha `GIT_EXTERNAL_DIFF`/`NODE_OPTIONS`, inclusive via `env`/`env -S`; `GIT_PAGER`/`PAGER` só `cat`); `find -exec` (fecha `-exec sh -c 'rm "$1"'`; `-execdir` = pasta desconhecida; não trava `-exec grep`).

**Bloqueante:** `politica.mjs:307-320` (`desembrulhar`) e `shell.mjs:299` (`time` reservado): o valor de uma opção do embrulho vira o nome do comando e o comando de escrita seguinte não é analisado (comando desconhecido é permitido para dev, qa e devops). Passam: `env -u X rm -f docs/03-tarefas/T-001.md`, `env -C docs/03-tarefas rm T-001.md`, `env -S 'rm -f docs/03-tarefas/x'`/`env -Srm ...`, `timeout -s KILL 5 rm ...`, `exec -a nome rm ...`, `time -p rm -f .claude/agents/dev.md`. Correção: opções com valor consomem o valor (`env -u/--unset`, `-C/--chdir`, `timeout -s/--signal`, `-k/--kill-after`, `exec -a`, `stdbuf -i/-o/-e`, `nice --adjustment`); negar `env -S`/`--split-string` e opção de embrulho desconhecida para subagentes; pular `time -p`; testes negados para cada forma e permitidos para `env -i FOO=1 npm test` e `timeout 60 npm test` (dev).

**Opcionais:** (1) `IFS` em `VARIAVEIS_SEGURAS` (`while IFS= read -r l` negado ao vivo; atribuição solta `n=0` também); (2) `tar -c --remove-files`; (3) `curl -K/--config`, `wget --config`, gawk `@include "inplace"`; (4) negar `GIT_DIR=`, `GIT_WORK_TREE=`, `GIT_INDEX_FILE=` como `--git-dir`/`--work-tree`. Ver D5.

### Rodada 3

**Resultado:** AJUSTES — o bloqueante da rodada 2 (embrulhos) e os opcionais 1–4 da D5 estão aplicados e testados, sem regressão; 4 novos bloqueantes (1 no código novo; 3 existentes desde `26b671a`).

**Verificações (hooks valendo para o revisor):** `test:hooks` 309/309; `npm test` verde; lint verde; validador OK (`PYTHONUTF8=1` e `python -X utf8`); `git status` limpo. Permitidos ao vivo: git de leitura (inclusive `HEAD@{1}..HEAD`), `while IFS= read -r l`, `n=0; for ...`, `time -p git status`, `timeout 60 git log`, `npm run build`, `CI=1 npm run test:e2e -- --list`. Negados ao vivo: `env -S`, `winpty`, `powershell`. Dev e qa conferidos pelos testes e código. Área só `.claude/hooks/**`; lock inalterado. Extensões corretas (`xargs`; `HOME`/`XDG_CONFIG_HOME`/`CURL_HOME`/`WGETRC` — efeito colateral aceitável; awk com programa de arquivo; embrulhos não analisados negados, mas a lista só tem ferramentas Linux ausentes nesta máquina).

**Bloqueantes:**
1. `politica.mjs:390`/`:441` — `timeout $(echo --foreground) 5 rm -f docs/03-tarefas/x` passa (a palavra dinâmica vira a duração e `5` vira o comando). Negar palavra dinâmica antes do comando em embrulho com `posicionais`; teste negado e `timeout 60 npm test` permitido.
2. `sed` `e`/`w`/`W` — code-reviewer (`:1351`): `echo x | sed 's/.*/echo executado-pelo-sed/e'` executou ao vivo; `sed -n '1w /dev/null'` passou (fura o critério 27). Quem escreve (`:635`, `sedNoLugar` só olha `-i`): `sed -n 'w docs/03-tarefas/...' f`, `sed 's/a/b/w .claude/agents/dev.md' f`, `sed '1e rm -f docs/03-tarefas/x' f` passam. Checagem única para todos os subagentes (comando `e`/`w`/`W` com ou sem endereço, flag `e`/`w` no `s`, `-f`/`--file` negado); testes negados e permitidos (`sed -n '1,20p' f`, `sed 's/foo/the bar/' f`, `sed -i` na área).
3. Executores do Windows/Git Bash (`:370`, `:1095-1122`): `powershell Remove-Item docs/03-tarefas/x` (PS 5.1 trata argumentos soltos como `-Command`), `cmd //c del docs\03-tarefas\x` (MSYS converte `/c`), `powershell -c Set-Content AGENTS.md x` (dev, fora da área), `winpty -Xallow-non-tty rm ...`, `start rm ...` passam. `winpty`/`start`/`cmd` em `EMBRULHOS_NAO_ANALISADOS`; `powershell`/`pwsh` via Bash para o `avaliarPowerShell` (D3(7)); README; testes (`Get-ChildItem` via `powershell` permitido para o dev).
4. git executando programas para quem escreve (`:1258`, `:1262`, `:304`): `GIT_EXTERNAL_DIFF='rm -f docs/03-tarefas/x' git diff` e `git -c diff.external='...' diff` passam. Negar `git -c`/`--config-env`/`--exec-path`/`grep -O` e variáveis `GIT_*` (exceto `GIT_PAGER=cat`; `PAGER` só `cat`) para todos os subagentes; testes negados e `GIT_PAGER=cat git log -1`, `git add apps/web/src/a.ts` (dev) permitidos.

Critérios reabertos: 25, 26 e 28 (itens 1–4) e 27 (item 2).

**Opcionais:** (5) rede de segurança para quem escreve — comando sem análise com trecho protegido em argumento/atribuição → negar (fecharia `npx rimraf docs/03-tarefas/...`, `sort -o`, `uniq`...); (6) restringir a negação de `HOME`/`XDG_CONFIG_HOME`/`CURL_HOME`/`WGETRC` a `curl`/`wget`/`git`; (7) divisão do `politica.mjs` (~1460 linhas) segue para depois. Ver D6.

### Rodada 4

**Resultado:** APROVADO — os 4 bloqueantes da rodada 3 e os opcionais 5 e 6 da D6 estão aplicados e testados no `2584c19`, sem regressão nos fluxos legítimos; varredura adversarial do devops correta.

**Verificações (hooks valendo para o revisor):** `test:hooks` 380/380; `npm test` verde; lint verde; validador OK (`PYTHONUTF8=1` e `python -X utf8`); `git status` limpo; área só `.claude/hooks/**`; lock inalterado; sem segredos. Ao vivo, permitidos: `GIT_PAGER=cat git log -1`, `timeout 60 git log -1`, `grep -n T-001 docs/03-tarefas/backlog.md`, `git diff ... | while IFS= read -r l; ...`, `sed -n '1,3p'`, `sed 's/x/the bar/'`, `npm run build`, `CI=1 npm run test:e2e -- --list`, `npm run test:e2e` completo (8/8). Dev e qa conferidos pelos testes e código (`timeout 60 npm test`, `HOME=/tmp npm test`, `env -i FOO=1 npm test`, `mkdir -p apps/web/src/{a,b}`, `git add apps/...`, `npm install`, `npx playwright`). `git -c` negado para todos não afeta fluxo listado.

**Conferido:** `timeout` dinâmico (`:451-455`, `:486-489`, `:400`); parser do `sed` (endereços, `!`, `{}`, `s///` com flags, `y`, `a/i/c/r/R/b/t/T/:`, `-f`) — negados ao vivo `sed -n '1w /dev/null'` e `sed 's/.*/echo y/e'`; executores do Windows (inclusive `.exe`); git executando programas (exceção `GIT_PAGER=cat`/`PAGER=cat`, inclusive em `export`); rede de segurança; `HOME` restrito; `sort`/`shuf -o` (inclusive `-uo`), `ex`/`ed`/`red`, `vim -c`/`+cmd`.

**Critérios:** 22 a 32 atendidos (31 pela D2), lidos com D1–D6.

**Opcionais (nenhum bloqueante; todos com construção obscura e intenção deliberada):** (1, recomendado) `powershellViaBash` (`:756-767`) perdeu a negação por caminho protegido — `powershell -c "(gi docs/03-tarefas/T-001.md).Delete()"`, `powershell -c "clc docs/03-tarefas/x"`, `echo ... | powershell -Command -` passam; negar quando o texto juntado casa com `TRECHO_PROTEGIDO_REDE` e negar `-Command -`. (2) opções longas abreviadas (`sed --in`, `--expr=`, `--fil=`, `sort`/`shuf --out=`) — `sed --in` aceito e `sed --expr='e ...'` executou ao vivo. (3) script do `sed` vindo de variável (`:877`; executou ao vivo; anterior a este commit). (4) `vim -e -s`/`-s`/`-S`/`-y` escapam — negar `vi`/`vim`/`nvim`/`view` sempre. (5) rede ignora a pasta atual (`cd docs/03-tarefas && npx prettier --write T-001.md`). (6) falsos positivos da rede: `for f in docs/03-tarefas/*.md`, `[ -f ... ]`, `[[ ]]`, `case`, `sort`/`uniq` lendo — incluir `[`, `[[`, `for`, `case`, `select`, `read` na isenção. (7) README: linha 32 contradiz a 53; registrar que `export HOME=` voltou a passar (sem efeito real, limite da linha 54). Ver D7.

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

### Rodada 3 (ajustes da revisão 2 + D5)

**Resultado:** CONCLUIDO — bloqueante dos embrulhos e opcionais 1–4 da D5 aplicados; `test:hooks` 309/309 (eram 236); `npm test`, lint e validador verdes. Ao vivo, o hook negou `env -Q true` ("opção de embrulho fora da lista conhecida"). (A execução foi interrompida pelo limite de uso da API antes do README; retomada do próprio histórico e concluída.)
- **Embrulhos:** tabela `EMBRULHOS` em `politica.mjs` com a lista de opções de `env`, `timeout`, `nice`, `nohup`, `stdbuf`, `time`, `exec`, `command`, `builtin`, `sudo`, `doas`, `xargs`. Opções com valor consomem o valor (separado ou colado): `env -u/--unset`, `-C/--chdir`, `timeout -s/-k` + duração, `exec -a`, `stdbuf -i/-o/-e`, `nice -n/--adjustment` e `nice -10`. `--help`, `--version` e `command -v` não executam o seguinte. Negados para todo subagente: opção fora da lista, `env -S`/`--split-string` (inclusive `-Srm`) e embrulhos não analisados (`setsid`, `watch`, `flock`, `strace`, `chroot`...). `env -C`/`sudo -D` trocam a pasta do comando seguinte (variável/curinga = desconhecida). `time` saiu das palavras reservadas e virou embrulho: `-p` pulado, `-o ARQUIVO` conferido (negado para o code-reviewer), `time { ...; }` analisado. `cd` depois de embrulho = pasta desconhecida. Além do pedido: `xargs` com a mesma lista e desembrulho do comando interno (antes passavam `xargs -0n 1 rm docs/...` e `xargs env rm`).
- **D5:** (1) `IFS` nas variáveis seguras (`while IFS= read -r l` passa); atribuição solta liberada só para nomes em minúsculas (`PATH=...;` e `n=0 git status` negados). (2) `tar --remove-files` confere as origens como apagadas; com `-C`/`-T` negado. (3) Negados `curl -K/--config`, `wget --config`, gawk com `@include`/`@load`, `awk -l`; programa vindo de arquivo (`-f`, `-E`, `-i outro.awk`) faz as entradas serem conferidas como alvos. (4) Negadas `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE` e `GIT_NAMESPACE` antes do comando, via `env` ou em `export`/`declare`/`typeset`/`local`/`readonly`.
- **README:** parte sobre embrulhos, itens novos negados/conferidos, regras de variáveis do code-reviewer e dois limites novos (embrulho fora das listas = comando desconhecido, permitido pela D5; configurações do HOME não são lidas).

Arquivos: `.claude/hooks/politica.mjs`, `shell.mjs`, `tests/politica.test.mjs`, `README.md`.

**Para a revisão:** extensões além do pedido — `xargs`; negação de `CURL_HOME`, `WGETRC`, `HOME`, `XDG_CONFIG_HOME` (efeito: `HOME=... npm test` negado para subagentes); awk com programa de arquivo; embrulhos não analisados negados. Testes de `time -p rm -f .claude/agents/dev.md`: "negar" para o dev, "perguntar" para o devops (D3). Divisão do `politica.mjs` (~1500 linhas) segue para depois (D4).

### Rodada 4 (ajustes da revisão 3 + D6)

**Resultado:** CONCLUIDO — 4 bloqueantes e opcionais 5 e 6 da D6 aplicados, mais uma varredura adversarial; `test:hooks` 380/380 (eram 309); `npm test`, lint e validador verdes; UTF-8 preservado; lock inalterado. Os hooks bloquearam as próprias sondagens do devops que citavam caminhos protegidos (esperado).
1. **`timeout` dinâmico:** embrulho com `posicionais` que consome argumento dinâmico → negado (`posicionalDinamico`); `timeout 60 npm test`/`git log` seguem permitidos.
2. **`sed`:** parser de script (`separarSed`, `sedPerigoso`, `scriptSedPerigoso`, com `pularEnderecoSed`/`pularRegexSed`/`pularSubstituicaoSed`) para todos os subagentes: nega `e`/`w`/`W` com ou sem endereço (dígitos, `$`, `/re/`, `\cREc`, faixas, `!`), flag `e`/`w` no `s///` e `-f`/`--file`; `sedNoLugar` e o code-reviewer reusam o parser. Permitidos `sed -n '1,20p'`, `sed 's/foo/the bar/'`, `sed -i` na área.
3. **Executores do Windows/Git Bash:** `cmd`, `start`, `winpty` (e `wsl`) em `EMBRULHOS_NAO_ANALISADOS`; `powershell`/`pwsh` via Bash vão para o `avaliarPowerShell` com os argumentos juntados (`powershellViaBash`, D3(7)); `-EncodedCommand` e argumento dinâmico negados; `powershell Get-ChildItem` permitido.
4. **git executando programas, para todos:** `git -c`/`--config-env`/`--exec-path`/`grep -O` e qualquer `GIT_*`/`PAGER` antes do comando (exceto `GIT_PAGER=cat`/`PAGER=cat`) negados; `GIT_PAGER=cat git log -1` e `git add apps/web/src/a.ts` (dev) permitidos. O teste antigo `dev · git -c user.name=x log` passou de permitir para negar.
5. **Rede de segurança** (`redeDeSeguranca`, `TRECHO_PROTEGIDO_REDE` com `.git/`): comando sem análise específica citando `docs/03-tarefas`, `.claude/agents` ou `.git/` → negado; leituras conhecidas (`LEITURA_CONHECIDA`: `cat`, `grep`, `head`, `tail`, `wc`, `diff`...) isentas; `sort`/`uniq` fora da isenção. Negados `npx rimraf docs/03-tarefas/x`, `sort -o docs/03-tarefas/x f`, `uniq f docs/03-tarefas/x`; permitidos `grep -n T-001 docs/03-tarefas/backlog.md` e `cat docs/03-tarefas/T-001-...md`.
6. **`HOME`/`XDG_CONFIG_HOME`/`CURL_HOME`/`WGETRC`** negadas só com `curl`/`wget`/`git`; `HOME=/tmp npm test` volta a passar.
- **Varredura adversarial:** `sort -o`/`shuf -o` com destino conferido contra a área; editores `ex`/`ed`/`red` e `vim`/`vi`/`nvim`/`view` em modo ex/script (`-c`, `+cmd`, `-E`, `-es`, `--cmd`) negados para quem escreve (`vim arquivo` interativo segue permitido); encadeamentos `env winpty`, `env powershell`, `timeout 5 powershell`, `nice -n 5 powershell`, `xargs ... cmd` confirmados nas regras novas.

Arquivos: `.claude/hooks/politica.mjs`, `tests/politica.test.mjs`, `README.md`.

**Pendências:** divisão do `politica.mjs` (~1600 linhas) e unificação dos separadores de argumentos ficam para depois (D4/D5); limites do README continuam (o que um script executado faz por dentro; `gzip`/`zip`/`split`/`csplit` fora das listas só são barrados pela rede quando citam caminho protegido).

### Ajuste pela decisão D7 (não conta rodada)

**Resultado:** CONCLUIDO — opcionais 1, 4, 6 e 7 aplicados; `test:hooks` 412/412 (eram 380; saiu 1, entraram 33); `npm test`, lint e validador verdes; UTF-8; lock inalterado.
1. **`powershell`/`pwsh` via Bash:** negados texto com caminho protegido e comando lido da entrada (`-Command -`, `-c -`, `-File -` ou nenhum comando, ex.: `echo x | powershell -NoProfile`); leitura de parâmetros aceita as abreviações do PowerShell. Os três casos da revisão negados; `powershell Get-ChildItem` permitido. Além do pedido: `-EncodedCommand` em qualquer abreviação a partir de `-en` negado (antes `-enc` passava); `-?`/`-h`/`-help` permitidos (só ajuda).
4. **`vi`/`vim`/`nvim`/`view`:** sempre negados (o teste `vim apps/web/src/a.ts` passou de permitir para negar).
6. **Isenção da rede:** `[`, `[[`, `for`, `case`, `select`, `read` em `LEITURA_CONHECIDA` (`for`/`case`/`select` já passavam; a correção valeu para `[`, `[[`, `read`). `[ -f docs/03-tarefas/x ]` e `for` com `head` passam; `for` com `rm "$f"` segue negado ("alvo dinâmico").
7. **README:** coerente (desconhecido permitido, exceto citando caminho protegido); `export HOME=` voltou a passar (só `HOME=... curl|wget|git` negado); itens 2, 3 e 5 listados como limites conhecidos, para tarefa futura.

Arquivos: `.claude/hooks/politica.mjs`, `tests/politica.test.mjs`, `README.md`.

## Log

- 2026-10-09 — tarefa criada
- 2026-10-10 — orquestrador: início — implementador devops (tags `infra`, `orquestracao`); D1 (delegação): critérios lidos pela tabela de áreas vigente
- 2026-10-10 — devops: AGUARDANDO-DECISAO — hooks implementados e ativos (152 testes); `autoMode` do critério 31 em aberto
- 2026-10-10 — orquestrador: D2 (delegação) — sem bloco `autoMode` (ignorado pelo Claude Code no projeto); D3 — 7 interpretações aceitas; segue para revisão
- 2026-10-10 — code-reviewer: AJUSTES — curingas/chaves com `..` e `$'...'` escapam da análise do Bash (critérios 25 e 28); rodadas = 1
- 2026-10-10 — orquestrador: D4 (delegação) — aplicar o bloqueante e os opcionais 2–5; refatoração fica para depois
- 2026-10-10 — devops: CONCLUIDO — brechas fechadas (chaves expandidas, `$'...'`, curinga com `..`, escrita por opção, code-reviewer); 236 testes; test/lint/validador OK
- 2026-10-10 — code-reviewer: AJUSTES — opções de comandos-embrulho (`env`, `timeout`, `exec`, `time -p`) escondem o comando de escrita; rodadas = 2
- 2026-10-10 — orquestrador: D5 (delegação) — corrigir os embrulhos (opções conhecidas; desconhecida = negar) e aplicar os 4 opcionais
- 2026-10-10 — devops: CONCLUIDO — embrulhos com lista de opções, `env -S`/opção desconhecida negados, opcionais da D5; 309 testes (interrompido pelo limite de uso e retomado); test/lint/validador OK
- 2026-10-10 — code-reviewer: AJUSTES — 4 bloqueantes (`timeout` dinâmico; `sed` `e`/`w`; `powershell`/`cmd`/`winpty`/`start`; `GIT_EXTERNAL_DIFF`/`git -c`); rodadas = 3 (última volta antes do limite)
- 2026-10-10 — orquestrador: D6 (delegação) — corrigir os 4 bloqueantes + rede de segurança para comando não analisado em caminho protegido + restrição do `HOME`
- 2026-10-10 — devops: CONCLUIDO — 4 bloqueantes, rede de segurança, `HOME` restrito e varredura adversarial (`sort -o`, `ex`/`ed`/`vim -c`); 380 testes; test/lint/validador OK
- 2026-10-10 — code-reviewer: APROVADO — bloqueantes fechados, sem regressão nos fluxos legítimos; 7 opcionais
- 2026-10-10 — orquestrador: D7 (delegação) — aplicar opcionais 1, 4, 6 e 7 antes do QA; 2, 3 e 5 sugeridos para tarefa futura de endurecimento
- 2026-10-10 — devops: CONCLUIDO — `powershell` via Bash, `vim` negado, isenções da rede e README; 412 testes; test/lint/validador OK
