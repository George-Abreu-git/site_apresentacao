---
tipo: estudo
tarefa: T-003
tags: [orquestracao, devops]
data: 2026-10-10
---

# Dono da plataforma e aprovação humana

## Conceito

Num projeto há dois tipos de arquivo:

- o **produto**: o que o usuário final vê (o site, a API) — aqui, `src/**`;
- a **plataforma**: tudo que faz o trabalho acontecer — regras dos agentes, skills, scripts, CI, configs do repositório, documentação de arquitetura.

**Dono da plataforma** é quem tem responsabilidade (e permissão) para alterar a plataforma. Ter um dono único evita que cada agente "ajeite" a regra que o atrapalha.

Mas há uma parte da plataforma especial: a **definição dos próprios agentes** (`.claude/agents/**`). Se um agente pudesse reescrever o próprio arquivo, poderia ampliar a própria permissão. Por isso existe a regra de **aprovação humana**: mudança ali só com o George aprovando. É o mesmo princípio de "quem é auditado não escreve as regras da auditoria".

## Por que importa

1. **Sem dono, a regra apodrece**: na T-002, `scripts/**`, `.gitignore`, `.obsidian/**` e `.claude/agents|skills|commands` não tinham dono (achado M3). Qualquer correção nesses arquivos era, tecnicamente, "fora da área" de todo mundo.
2. **Separação de poderes**: o devops implementa mudanças na plataforma, mas não decide sozinho o que muda no comportamento dos agentes; essa decisão é do George.
3. **Rastreabilidade**: a aprovação fica registrada em `## Decisões` da tarefa, então dá para saber depois quem autorizou cada mudança de regra.

## Como aparece no projeto

- **Decisão do George (opção B, 2026-10-09)** registrada na nota da T-003: o devops é dono de `.claude/**`, `AGENTS.md`, `CLAUDE.md`, `scripts/**`, configs da raiz (`.gitignore`, `.gitattributes`, `.obsidian/**`) e `docs/**` exceto `03-tarefas` e `04-estudos`. Tarefas com tag `orquestracao` são implementadas pelo devops.
- Isso foi escrito em quatro lugares, que precisam dizer a mesma coisa: `AGENTS.md`, `.claude/agents/devops.md`, `.claude/skills/orquestrar-tarefa/SKILL.md` e a spec da orquestração.
- **Ressalvas** (ajuste pedido pelo code-reviewer na rodada 1): mesmo sendo dono de `docs/**`, o devops **não cria ADRs** — ele devolve `AGUARDANDO-DECISAO` e o orquestrador cria via `registrar-decisao`. E `docs/00-visao/**` e `docs/01-requisitos/**` nascem do levantamento de requisitos, conduzido pela sessão principal. Ser "dono" do caminho não dá direito de **decidir** o conteúdo.
- **Aprovação humana na prática**: `AGENTS.md` diz que alterar `.claude/agents/**` exige aprovação do George, mesmo dentro da área do devops. Na T-003 o devops mexeu em `qa.md` e `devops.md` (pedidos diretamente pelos critérios do George) e em `dev.md` (consequência do M3). Como o `dev.md` não foi pedido explicitamente, o orquestrador registrou em `## Decisões` que o **George precisa confirmar essa alteração ao fechar a tarefa**. A regra nova já se aplicou na própria tarefa que a criou.
- **Ainda não há trava técnica**: hoje a regra é só texto. A T-001 (hooks) ganhou critérios para transformá-la em bloqueio real: identificar qual subagente está agindo e exigir aprovação em `.claude/agents/**` (achado M4). Veja [[hooks-pretooluse-e-bypass-via-bash]].

## Exemplo

Trecho de `AGENTS.md` (abaixo da tabela de áreas), com comentários:

```
Uma alteração em `.claude/agents/**` (a definição de um agente)   <- o que é protegido
exige **aprovação do George**, mesmo dentro da área do devops:   <- vale até para o dono
nenhum agente altera a própria definição por conta própria.      <- o motivo
Na tarefa que pedir essa mudança, a aprovação é a decisão do     <- como provar a aprovação
George registrada em `## Decisões`.
```

## Para aprofundar

- Pergunta: qual é a diferença entre "pode alterar o arquivo" (área) e "pode decidir o conteúdo" (decisão)? Dê um exemplo com uma ADR.
- Exercício: abra `.claude/agents/devops.md` e `AGENTS.md` e confira se as duas descrições da área do devops batem. O code-reviewer apontou (opcional) que a linha do devops na tabela "Áreas por caminho" não repete a ressalva das ADRs. Isso é contradição ou só omissão?
- Pergunta: se um hook bloquear escrita em `.claude/agents/**`, como o George "aprova" uma exceção sem desligar o hook?

## Links

- Tarefa: [[docs/03-tarefas/T-003-corrige-achados-t002]]
- Relacionadas: [[areas-por-caminho-de-escrita]], [[hooks-pretooluse-e-bypass-via-bash]], [[modo-de-fluxo-por-tag]]
