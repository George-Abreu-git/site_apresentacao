---
id: T-035
titulo: Mais dois subagentes dev (dev-2 e dev-3) para codar em paralelo
status: aguardando-decisao
modo: agente-faz
tags: [orquestracao]
rodadas: 0
criada: 2026-10-27
---

# T-035 — Mais dois subagentes dev (dev-2 e dev-3) para codar em paralelo

## Descrição

O George pediu mais dois subagentes de código, réplicas do `dev`, para implementar tarefas em paralelo. Hoje há um só `dev`, que trabalha no checkout principal; as tarefas `agente-faz` de front-end e back-end rodam uma de cada vez.

Para rodar em paralelo, cada tarefa precisa do seu próprio checkout (git worktree), das dependências instaladas nele (para rodar os testes) e de um servidor do e2e numa porta própria: hoje o `e2e/playwright.config.ts` usa a porta fixa 5173 com `reuseExistingServer` fora do CI, então um e2e rodando num worktree reaproveitaria o servidor de outro worktree e testaria o código errado.

## Critérios de aceite

- [ ] `.claude/agents/dev-2.md` e `.claude/agents/dev-3.md` existem, com o mesmo papel, ferramentas, skills e instruções do `dev` (só o `name`, a `description` e a cor mudam). O `dev` original continua como está.
- [ ] Os três têm a mesma área de escrita: `.claude/hooks/areas.mjs` (com testes em `.claude/hooks/tests/`), a tabela "Áreas por caminho" e a de "Papéis dos agentes" do `AGENTS.md`, a lista de agentes do `CLAUDE.md` e o `scripts/validar_estrutura.py` reconhecem `dev-2` e `dev-3`. Tudo que vale para o `dev` (ex.: `package-lock.json`, carregar-contexto, definition-of-done, code-reviewer conferindo a área) vale para eles.
- [ ] O e2e aceita a porta do front por variável de ambiente (padrão 5173, sem mudar nada para quem não a define), para que dois worktrees rodem o e2e ao mesmo tempo sem reaproveitar o servidor um do outro.
- [ ] A skill `orquestrar-tarefa` ganha uma seção "Tarefas em paralelo" com o passo a passo do orquestrador: quando duas tarefas podem rodar juntas (implementadores diferentes e sem arquivos em comum previstos), como criar o worktree da tarefa (`git worktree add .claude/worktrees/T-XXX -b feat/T-XXX-<slug> main`) e instalar as dependências nele, que porta do e2e passar a cada implementador, como conferir a área e commitar com `git -C`, e como integrar (encerramento um de cada vez: rebase na `main` atual, suíte completa e validador verdes no worktree, merge, push, remoção do worktree). Code-reviewer e qa de cada tarefa trabalham no worktree dela.
- [ ] (decisão do George, Q1) O qa só altera arquivos de teste: os arquivos de configuração dentro de `e2e/` (`playwright.config.ts`, e `tsconfig*.json`/`package.json` se surgirem) são da área do devops — `AGENTS.md` (Papéis e Áreas por caminho), `.claude/hooks/areas.mjs` e testes do hook refletem isso.
- [ ] `npm run test:hooks` e `python3 scripts/validar_estrutura.py` verdes; `npm test` e `npm run test:e2e` continuam verdes.

## Contexto relevante

- `AGENTS.md` (Papéis, Áreas por caminho, Hooks), `CLAUDE.md`
- `.claude/hooks/areas.mjs` (worktrees de subagente já são avaliados relativos à raiz do worktree), `.claude/hooks/README.md`
- `.claude/skills/orquestrar-tarefa/SKILL.md`, `.claude/skills/carregar-contexto/`
- `e2e/playwright.config.ts`
- Esta tarefa roda num worktree (`.claude/worktrees/T-035`), em paralelo com a T-024 no checkout principal.

## Decisões

- 2026-10-27 — George: criar mais 2 subagentes dev (réplicas do `dev`) para codar em paralelo ("Pode replicar e criar mais 2 subagentes dev para codar em paralelo"). Vale como a aprovação exigida pelo `AGENTS.md` para alterar `.claude/agents/**` nesta tarefa.
- 2026-10-27 — George (Q1 do devops, quem altera `e2e/playwright.config.ts`): "O QA somente aplica mudanças em arquivos de testes, se necessário; mudanças em arquivos de ambiente e desenvolvimento devem ser de um dev, ou do devops se for infraestrutura." Consequência nesta tarefa: os arquivos de configuração dentro de `e2e/` (hoje `e2e/playwright.config.ts`; também `tsconfig*.json` e `package.json` que surgirem lá) passam para a área do devops; o qa fica com `e2e/testes/**`, `e2e/apoio/**` e `apps/api/test/**`. O devops atualiza a tabela "Áreas por caminho" e "Papéis" do `AGENTS.md`, `.claude/hooks/areas.mjs` e os testes, e aplica a porta por `E2E_PORTA_FRONT`.
- 2026-10-27 — George (Q3, como gravar o `e2e/playwright.config.ts` bloqueado pelo hook do checkout principal, que ainda tem a área antiga): opção A — o orquestrador copia, uma única vez, o arquivo escrito e testado pelo devops (scratchpad `proposta/playwright.config.ts`) para o worktree. Exceção pontual por causa da ordem de ativação do hook; não vale como precedente. Code-reviewer e qa revisam e validam normalmente.

## Dev

## Revisão

## QA

## Estudo

## DevOps

### Rodada 1

Resultado: AGUARDANDO-DECISAO
Resumo: Criei dev-2 e dev-3 (réplicas do dev) com a mesma área no hook, nos testes, no AGENTS.md, no CLAUDE.md, no validador e nas skills (carregar-contexto, atualizar-tarefa). Escrevi a seção "Tarefas em paralelo" na orquestrar-tarefa: worktree, npm ci, porta do e2e, conferência e commits com git -C, backlog só no encerramento, encerramento um de cada vez com rebase, suíte, merge ff, push e limpeza. Incluí E2E_PORTA_FRONT nas variáveis seguras do code-reviewer. Falta a porta configurável no e2e/playwright.config.ts: o arquivo é da área do qa e o hook negou a edição (texto exato pronto no handoff). test:hooks (449), npm test, lint e validador verdes; test:e2e não rodado.
Arquivos alterados: .claude/agents/dev-2.md (novo), .claude/agents/dev-3.md (novo), .claude/hooks/areas.mjs, .claude/hooks/politica.mjs, .claude/hooks/tests/politica.test.mjs, .claude/hooks/tests/integracao.test.mjs, .claude/hooks/README.md, .claude/skills/orquestrar-tarefa/SKILL.md, .claude/skills/carregar-contexto/SKILL.md, .claude/skills/atualizar-tarefa/SKILL.md, AGENTS.md, CLAUDE.md, scripts/validar_estrutura.py
Pendências:
1. Critério 3: aplicar a porta por `E2E_PORTA_FRONT` em e2e/playwright.config.ts (depende da Q1). Texto proposto: `const PORTA_DO_FRONT = lerPorta(process.env.E2E_PORTA_FRONT, 5173);` e uma função `lerPorta` que devolve o padrão para valor vazio e lança erro claro para porta inválida.
2. Critério 5: rodar `npm run test:e2e` (padrão 5173) e `E2E_PORTA_FRONT=5174 npm run test:e2e` no worktree depois da alteração.
3. A inclusão de E2E_PORTA_FRONT nas variáveis seguras do code-reviewer (politica.mjs) não estava nos critérios; o code-reviewer deve avaliá-la.
Decisão pendente: Q1 — quem altera o e2e/playwright.config.ts (A: qa; B: orquestrador; C: tornar o arquivo área do devops). Recomendação do devops: A.
Conceitos para estudo: git worktree (vários checkouts de um repositório), variáveis de ambiente em configuração de ferramenta, porta TCP e reuseExistingServer do Playwright, rebase antes do merge fast-forward, execução paralela e conflitos em arquivos compartilhados (backlog, lockfile)

### Rodada 1 (retomada após a decisão Q1)

Resultado: CONCLUIDO
Resumo: Apliquei a decisão Q1. O qa fica com `e2e/testes/**`, `e2e/apoio/**` e `apps/api/test/**`; o devops recebe `e2e/playwright.config.*`, `e2e/tsconfig*.json` e `e2e/package.json`. Isso está no `areas.mjs`, nos testes do hook (novos casos de permitir e negar, inclusive dentro de worktree), no AGENTS.md (estrutura, Papéis e Áreas por caminho), no README dos hooks e nas definições qa, devops, dev, dev-2 e dev-3 (uma linha em cada). A porta por `E2E_PORTA_FRONT` não pôde ser gravada porque o hook ativo é o do checkout principal, ainda com a área antiga; o arquivo pronto ficou no scratchpad. test:hooks (465), npm test, lint e validador verdes. e2e com a config proposta na porta 5174: 352 passaram, 12 pulados, 0 falhas. Sem a variável, a config resolve 5173.
Arquivos alterados: .claude/hooks/areas.mjs, .claude/hooks/tests/politica.test.mjs, .claude/hooks/tests/integracao.test.mjs, .claude/hooks/README.md, .claude/agents/qa.md, .claude/agents/devops.md, .claude/agents/dev.md, .claude/agents/dev-2.md, .claude/agents/dev-3.md, AGENTS.md
Pendências:
1. Gravar o `e2e/playwright.config.ts` com a porta por `E2E_PORTA_FRONT` (bloqueado pelo hook do checkout principal) e rodar `E2E_PORTA_FRONT=5174 npm run test:e2e` e o lint no worktree.
2. A ADR-0001 (linha 72) ainda diz "qa → `e2e/**`"; registrar a atualização via `registrar-decisao`.
3. O code-reviewer confere a mudança de uma linha nas 5 definições de agente (coberta pela Q1) e a inclusão de `E2E_PORTA_FRONT` nas variáveis seguras em politica.mjs.
Decisão pendente: nenhuma
Conceitos para estudo: área de escrita por caminho (glob) e separação teste × configuração; hook carregado do checkout principal versus mudança feita num worktree (só vale depois do merge); validação de variável de ambiente com padrão e falha rápida; reuseExistingServer e porta estrita (--strictPort) no Playwright

## Log

- 2026-10-27 — tarefa criada
- 2026-10-27 — orquestrador: em-andamento — worktree .claude/worktrees/T-035, branch feat/T-035-devs-em-paralelo; devops chamado
- 2026-10-27 — devops: AGUARDANDO-DECISAO — dev-2 e dev-3 criados; porta do e2e bloqueada (e2e/** é área do qa)
- 2026-10-27 — orquestrador: aguardando-decisao — Q1 apresentada ao George
- 2026-10-27 — George: Q1 — qa só altera testes; config do e2e vira área do devops (registrado em Decisões)
- 2026-10-27 — orquestrador: em-andamento — devops retoma (rodada 1, após decisão)
- 2026-10-27 — devops: CONCLUIDO — área do qa só com testes; config do e2e do devops; porta do e2e bloqueada pelo hook do checkout principal (área antiga)
- 2026-10-27 — orquestrador: aguardando-decisao — Q3 apresentada ao George (como gravar a config do e2e)
- 2026-10-27 — George: Q3 — A; orquestrador copia o playwright.config.ts do devops para o worktree (exceção registrada em Decisões)
