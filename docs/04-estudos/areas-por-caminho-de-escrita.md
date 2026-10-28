---
tipo: estudo
tarefa: T-002
tags: [orquestracao]
data: 2026-10-09
---

# Áreas por caminho de escrita

## Conceito

Para cada agente, o projeto define **quais caminhos ele pode alterar** (a tabela "Áreas por caminho" do `AGENTS.md`). O orquestrador confere depois de cada agente com `git status`. É o mesmo princípio de **menor privilégio**: cada um mexe só no que precisa.

Uma boa tabela de áreas tem três propriedades:

1. **Sem sobreposição**: um caminho tem um único dono (ou a exceção é explícita).
2. **Sem lacuna**: todo caminho do repositório tem alguém responsável.
3. **Coerente com o papel**: o que o texto do papel diz ("dev altera código e testes") bate com o que a tabela permite.

## Por que importa

Se dois agentes "podem" mexer no mesmo caminho, a conferência fica ambígua. Se ninguém é dono de um caminho, ninguém é responsável por ele (ou todos mexem sem controle). E a tabela é a **base dos hooks** da T-001: o hook só consegue bloquear corretamente o que a tabela define corretamente.

## Como aparece no projeto

### Antes: o diagnóstico da T-002 (histórico)

> Esta subseção descreve a tabela **como era antes da T-003**. Ela foi mantida porque mostra o raciocínio do achado; a tabela vigente está na subseção seguinte.

O achado **M3** da T-002 mostrou os três problemas na tabela de `AGENTS.md` daquela época:

- **Sobreposição**: `**/*.test.*` estava na área do **qa**, mas o dev faz TDD (escreve testes). Como a área do dev era só `src/**`, os testes do dev seriam sinalizados como violação.
- **Lacunas (sem dono)**: `scripts/**` (inclui o validador), `.gitignore`, `.obsidian/**`, configs da raiz (`package.json`, `.env.example`), `docs/**` fora de `03-tarefas` e `04-estudos`, e `.claude/agents|skills|commands`. Nem o orquestrador tinha linha na tabela.
- **Incoerência**: o `devops.md` citava "scripts de build", mas `scripts/**` não estava na área do devops (também **B14**: dev "código e testes" vs. caminho só `src/**`).

As áreas já eram declaradas **provisórias** até a ADR de stack, porque ainda não existem `src/` nem pastas de teste. O QA sugeriu definir quem escreve testes unitários (dev) e o que é do qa (e2e/aceitação), e dar dono às lacunas. O George decidiu não esperar a ADR e corrigir isso na T-003.

### Depois: a tabela da T-003 (histórico)

> Esta subseção descreve a tabela **da T-003**, que valeu até a T-004. A tabela vigente, baseada na ADR-0001, está na subseção "Agora".

Na [[docs/03-tarefas/T-003-corrige-achados-t002|T-003]] o devops reescreveu a tabela de `AGENTS.md`. Veja como cada problema foi resolvido:

| Problema (T-002) | Como ficou (T-003) |
|---|---|
| Sobreposição dev × qa nos testes | **dev**: `src/**`, incluindo os **testes unitários** junto do código. **qa**: só testes de **aceitação/e2e** em `tests/**` e `e2e/**` na raiz. Um padrão como `**/*.test.*` não aparece mais em duas linhas. |
| `scripts/**`, `.gitignore`, `.obsidian/**`, configs da raiz sem dono | Agora são do **devops**, que virou o **dono da plataforma** (veja [[dono-da-plataforma-e-aprovacao-humana]]). |
| `docs/**` fora de `03` e `04` e `.claude/agents\|skills\|commands` sem dono | Também do **devops**, com duas ressalvas: ele **não cria ADRs** e não escreve visão/requisitos (isso nasce das skills `registrar-decisao` e `levantar-requisitos`, conduzidas pelo orquestrador). |
| Orquestrador sem linha | Ganhou linha: `docs/03-tarefas/**`, os commits e os arquivos que as skills `registrar-decisao` e `levantar-requisitos` mandam criar. |
| `devops.md` cita scripts, mas a área não tinha `scripts/**` | Resolvido: `scripts/**` está na área do devops. |

Duas regras novas acompanham a tabela:

- **Todos os subagentes: nunca `docs/03-tarefas/**`** (só o orquestrador escreve nas notas de tarefa).
- **`.claude/agents/**` exige aprovação do George**, mesmo estando na área do devops: nenhum agente muda a própria definição sozinho.

Repare numa sobreposição que **continua existindo, mas é explícita e coerente**: `docs/02-arquitetura/`, `docs/00-visao/` e `docs/01-requisitos/` aparecem para o devops e para o orquestrador. O code-reviewer aceitou porque a divisão é clara: o devops edita specs e planos; o orquestrador cria ADRs, visão e requisitos pelas skills. É a propriedade 1 ("ou a exceção é explícita").

Naquele momento a tabela era **provisória**: quando a ADR de stack definisse as pastas reais de código e de teste, as linhas de dev e qa mudariam. Foi o que a T-004 fez.

### Agora: a tabela vigente (T-004, a partir da ADR-0001)

A [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]] trocou `src/` por um monorepo (`apps/web`, `apps/api`, `packages/shared`, `e2e/`; veja [[monorepo-com-npm-workspaces]]). Nas "Consequências", ela já dizia como as áreas deveriam ficar. A [[docs/03-tarefas/T-004-atualiza-agents-stack|T-004]] levou isso para o `AGENTS.md`:

| Agente | T-003 (antes) | T-004 (agora) |
|---|---|---|
| dev | `src/**` + testes unitários junto do código | `apps/**` e `packages/**`, **exceto `apps/api/test/**`**; inclui testes unitários (`*.spec.ts`, `*.test.ts(x)`) e as configs de cada app (`apps/web/vite.config.ts`, `apps/api/package.json`) |
| qa | `tests/**`, `e2e/**` | `e2e/**` (Playwright) e `apps/api/test/**` (rotas da API com Supertest) |
| devops | plataforma | plataforma (igual) + CI e deploy (`.github/**`, `infra/**`, `Dockerfile*`, `render.yaml`, `wrangler.*`) + configs da raiz, agora com `package.json` de workspaces e `package-lock.json` |

O aviso de "provisórias" saiu, porque as pastas agora estão definidas por uma ADR aceita.

> **Atualização (T-035, ADR-0004):** a linha do qa mudou. Ele ficou só com **arquivos de teste** (`e2e/testes/**`, `e2e/apoio/**` e `apps/api/test/**`); as configurações dentro de `e2e/` (`playwright.config.*`, `tsconfig*.json`, `package.json`) passaram para o devops. A T-035 também criou `dev-2` e `dev-3`, com a mesma área do `dev`. Veja [[docs/02-arquitetura/ADR-0004-qa-so-altera-testes|ADR-0004]] e [[docs/04-estudos/tarefas/T-035]].

#### A exceção explícita

Aqui aparece um caso clássico: **uma pasta dentro da outra**. `apps/api/test/**` está *dentro* de `apps/**`. Se a linha do dev dissesse só "`apps/**`", o arquivo `apps/api/test/projetos.e2e-spec.ts` teria **dois donos** (dev e qa), e a propriedade 1 ("sem sobreposição") quebraria.

Existem duas formas de resolver isso:

1. **Regra implícita de precedência** ("o caminho mais específico vence"). Funciona, mas o leitor precisa conhecer a regra, que não está escrita em lugar nenhum.
2. **Exceção explícita na própria linha** ("`apps/**`, **exceto `apps/api/test/**`**"). Quem lê a linha do dev já vê o buraco, sem precisar cruzar com a linha do qa.

A T-004 escolheu a segunda e ainda reforçou com uma frase abaixo da tabela: *"Dev e qa não se sobrepõem: `apps/api/test/**` está dentro de `apps/**`, mas pertence só ao qa."* O code-reviewer e o QA conferiram exatamente isso.

Por que os testes de rotas da API ficam com o qa e os testes unitários com o dev? Pela divisão da ADR-0001 (decisão 6): **unitário** (Vitest, junto do código, escrito no TDD do dev) testa uma peça isolada; **aceitação** (Supertest batendo nas rotas, Playwright no navegador) testa o comportamento visto de fora, que é o trabalho do qa.

#### O que ainda ficou em aberto

O code-reviewer apontou (opcional 2) que `Dockerfile*` na linha do devops não se limita à raiz. Um futuro `apps/api/Dockerfile` cairia em `apps/**` (dev) **e** em `Dockerfile*` (devops): uma sobreposição nova, ainda sem exceção escrita. O devops também listou como pendência o dono de `playwright.config.*` e `tsconfig*.json` na raiz. Isso fica para a tarefa de setup do monorepo, como decisão do George.

## Exemplo

Resumo da tabela vigente em `AGENTS.md` (abreviado; o texto completo está lá):

```
| Agente        | Caminhos permitidos                                                 |
| dev           | apps/**, packages/** EXCETO apps/api/test/**                        |
|               | (inclui testes unitários *.spec.ts / *.test.ts(x) e configs de app) |
| qa            | e2e/**, apps/api/test/** (aceitação/e2e); tag revisao: nenhum       |
| instrutor     | docs/04-estudos/**                                                  |
| documentador  | docs/04-estudos/** (no worktree dele; T-014)                        |
| devops        | plataforma (.claude/**, AGENTS.md, CLAUDE.md, scripts/**, docs/**   |
|               | exceto 03 e 04) + CI/deploy (.github/**, infra/**, Dockerfile*,     |
|               | render.yaml, wrangler.*) + configs da raiz (package.json, lock...)  |
| orquestrador  | docs/03-tarefas/**, commits, ADRs e visão/requisitos via skills     |
| subagentes    | nunca docs/03-tarefas/**                                            |
```

Pergunta de teste para qualquer linha: "se eu alterar este arquivo, a quem pertence a alteração?" Se a resposta for "a ninguém" ou "a dois" (sem regra que desempate), há problema. Faça o teste com:

- `apps/web/src/components/Header.test.tsx` → dev (teste unitário junto do código)
- `apps/api/src/projetos/projetos.service.spec.ts` → dev
- `apps/api/test/projetos.e2e-spec.ts` → qa (a exceção)
- `e2e/contato.spec.ts` → qa
- `package-lock.json` → devops (config da raiz)
- `scripts/validar_estrutura.py` → devops

## Para aprofundar

- Exercício: pegue `git ls-files` e, para cada pasta de primeiro nível, diga o dono segundo a tabela **vigente** (T-004). Sobra alguma sem dono? (Dica: compare com a lista de lacunas da T-002.)
- Exercício: escreva a exceção que faltaria na linha do dev se o George decidir que `apps/api/Dockerfile` é do devops. Escreva também a frase de reforço abaixo da tabela, no mesmo estilo da T-004.
- Pergunta: a T-003 tinha a dúvida "e se os testes unitários forem para uma pasta separada `tests/unit/`?". A ADR-0001 respondeu: ficam junto do código. Por que essa escolha evita uma sobreposição com o qa?
- Pergunta: por que o orquestrador também precisa de uma linha na tabela, se ele não é um subagente?

## Links

- Tarefas: [[docs/03-tarefas/T-002-qa-revisa-arquivos-antes-adr]] (diagnóstico), [[docs/03-tarefas/T-003-corrige-achados-t002]] (correção), [[docs/03-tarefas/T-004-atualiza-agents-stack]] (áreas da ADR-0001)
- ADR: [[docs/02-arquitetura/ADR-0001-stack]]
- Relacionadas: [[hooks-pretooluse-e-bypass-via-bash]], [[revisao-de-consistencia-documental]], [[dono-da-plataforma-e-aprovacao-humana]], [[monorepo-com-npm-workspaces]], [[adr-como-fonte-unica]]
