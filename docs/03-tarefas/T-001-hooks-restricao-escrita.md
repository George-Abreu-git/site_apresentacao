---
id: T-001
titulo: Hooks PreToolUse de restrição de escrita por agente
status: em-revisao
modo: agente-faz
tags: [infra, orquestracao]
rodadas: 0
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

## Dev

## Revisão

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

## Log

- 2026-10-09 — tarefa criada
- 2026-10-10 — orquestrador: início — implementador devops (tags `infra`, `orquestracao`); D1 (delegação): critérios lidos pela tabela de áreas vigente
- 2026-10-10 — devops: AGUARDANDO-DECISAO — hooks implementados e ativos (152 testes); `autoMode` do critério 31 em aberto
- 2026-10-10 — orquestrador: D2 (delegação) — sem bloco `autoMode` (ignorado pelo Claude Code no projeto); D3 — 7 interpretações aceitas; segue para revisão
