---
tipo: adr
numero: ADR-0004
status: aceita
data: 2026-10-27
---

# ADR-0004 — O qa só altera arquivos de teste; a configuração do e2e é do devops

## Contexto

Na [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]] a pasta `e2e/` inteira ficou na área do qa (`e2e/**`). Na tarefa [[docs/03-tarefas/T-035-devs-em-paralelo|T-035]] (dev-2 e dev-3 para tarefas em paralelo), o devops precisou mudar o `e2e/playwright.config.ts` para ler a porta do front de uma variável de ambiente (`E2E_PORTA_FRONT`), e o hook de áreas negou a edição: o arquivo é configuração de ferramenta, mas estava na área do qa. A pergunta foi quem altera esse arquivo.

## Opções

### A) O qa aplica a mudança na etapa dele
- ✅ Respeita a tabela de áreas sem exceção
- ✅ O dono do e2e altera e valida o próprio arquivo
- ✅ Não muda regra nem hook
- ❌ O qa passa a escrever configuração, não só testes
- ❌ Uma chamada a mais ao qa
- ❌ Quem altera e quem valida passam a ser o mesmo agente nesse arquivo

### B) O orquestrador aplica o texto pronto e registra a exceção
- ✅ O mais rápido
- ✅ Code-reviewer e qa continuam revisando de fora
- ✅ Não muda regra permanente
- ❌ O orquestrador implementando foge do papel dele
- ❌ Abre precedente de exceção pontual
- ❌ Fica fora do handoff de um agente (rastreio mais fraco)

### C) A configuração do e2e passa para a área do devops
- ✅ Configuração de ferramenta fica com o dono da plataforma, como as configs da raiz
- ✅ Resolve também as próximas mudanças nesse arquivo
- ✅ O qa segue só com os testes (`e2e/testes/**`, `e2e/apoio/**`)
- ❌ Muda a tabela de áreas (decisão permanente)
- ❌ Exige exceção no hook dentro de `e2e/**`
- ❌ Uma rodada a mais

## Decisão

Escolhida pelo George: **C**, como regra geral — "O QA somente aplica mudanças em arquivos de testes, se necessário; mudanças em arquivos de ambiente e desenvolvimento devem ser de um dev, ou do devops se for infraestrutura."

## Consequências

- **Área do qa:** `e2e/testes/**`, `e2e/apoio/**` e `apps/api/test/**` (só testes e apoio de testes). Precisando mudar configuração, o qa descreve a mudança no handoff.
- **Área do devops:** ganha a configuração dentro de `e2e/` — `e2e/playwright.config.*`, `e2e/tsconfig*.json` e `e2e/package.json`.
- **Atualizados na T-035:** tabela "Áreas por caminho" e "Papéis" do `AGENTS.md`, `.claude/hooks/areas.mjs` e testes do hook, definições dos agentes (qa, devops, dev, dev-2, dev-3) e README dos hooks.
- **Substitui** só a linha "qa → `e2e/**`" das consequências da ADR-0001; o restante da ADR-0001 continua valendo.
- **Transição:** o hook ativo é o do checkout principal, então a regra nova só passa a valer depois do merge da T-035; por isso o `playwright.config.ts` da própria T-035 foi copiado pelo orquestrador, uma única vez, por decisão do George (Q3 da T-035).
- **Tarefas abertas afetadas:** a T-027 cria um `tsconfig` em `e2e/`, que agora é do devops.
