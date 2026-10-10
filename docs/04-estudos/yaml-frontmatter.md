---
tipo: estudo
tarefa: T-002
tags: [orquestracao]
data: 2026-10-09
---

# YAML frontmatter

## Conceito

**Frontmatter** é um bloco de metadados no início de um arquivo Markdown, entre duas linhas `---`. É escrito em **YAML**, um formato de "chave: valor" legível por humanos e por programas.

```yaml
---
id: T-002
status: em-qa
tags: [qa]
---
```

Quem lê o arquivo (Obsidian, o Claude Code, scripts) usa esse bloco como dados: filtra tarefas por `status`, descobre o `name` de um agente, etc.

O YAML tem **regras de sintaxe estritas**. Uma delas: dentro de um valor sem aspas, a sequência `": "` (dois-pontos + espaço) é lida como "início de um novo par chave: valor". Se você precisa desse trecho no texto, coloque o valor **entre aspas**.

## Por que importa

Um frontmatter inválido pode ser lido de formas diferentes por programas diferentes: um parser tolerante "adivinha", um estrito dá erro ou ignora o campo. Em arquivos de agentes e skills, o `description` é o que o Claude usa para decidir quando acionar aquilo. Se ele for lido errado, a skill pode não ser acionada como esperado.

## Como aparece no projeto

- Todas as notas de tarefa, ADRs, notas de estudo, agentes e skills usam frontmatter (veja o topo deste arquivo).
- Achado **B1** da T-002: em `.claude/skills/registrar-decisao/SKILL.md`, linha 3, o `description` contém `": "` sem aspas:

```yaml
description: Use (somente na sessão principal) quando ... (ex.: stack, padrão de API, hospedagem) — cria uma ADR.
```

  O trecho `ex.: stack` tem dois-pontos seguido de espaço. Em um parser YAML estrito isso é inválido. O `validar_estrutura.py` **não detecta**, porque usa um parser próprio e simples (**B2**). Correção possível: reescrever sem `": "` (por exemplo "ex. stack, ...") ou envolver o valor em aspas.
- Achado **B8**: os templates em `docs/_templates/` geram frontmatter com pequenas inconsistências (`titulo:` vazio, `criada:` sem aspas, `tarefa:` vazio).

## Exemplo

```yaml
# Problemático em parser estrito
description: Use quando decidir algo (ex.: stack) — cria uma ADR.

# Corrigido, com aspas
description: "Use quando decidir algo (ex.: stack) — cria uma ADR."

# Corrigido, sem o ": "
description: Use quando decidir algo (ex. stack) — cria uma ADR.
```

Cuidado ao usar aspas duplas: se o texto tiver aspas duplas dentro, é preciso escapá-las ou usar aspas simples por fora.

## Para aprofundar

- Exercício: cole os dois primeiros exemplos em um validador YAML online e compare as respostas.
- Pergunta: por que `tags: [qa]` e uma lista com hífens (`- qa`) são equivalentes em YAML?
- Pergunta: qual a vantagem de o validador do projeto usar uma biblioteca YAML real em vez de um parser próprio?

## Links

- Tarefa: [[docs/03-tarefas/T-002-qa-revisa-arquivos-antes-adr]]
- Relacionadas: [[revisao-de-consistencia-documental]]
