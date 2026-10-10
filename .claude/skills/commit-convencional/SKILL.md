---
name: commit-convencional
description: Use ao sugerir ou criar commits e branches — padrão Conventional Commits em português.
---

# Commit convencional

## Mensagem

```
<tipo>(<escopo opcional>): <descrição no imperativo, minúscula, sem ponto>

<corpo opcional: o porquê da mudança>
Tarefa: T-XXX

Co-Authored-By: Claude <noreply@anthropic.com>
```

Tipos: `feat` (funcionalidade), `fix` (correção), `docs`, `style` (formatação), `refactor`, `test`, `chore` (manutenção), `ci`.

Exemplos: `feat(contato): adiciona formulário de contato` · `test(api): cobre validação do e-mail`

## Branches

- `main` é a principal; nunca commitar trabalho de tarefa direto nela.
- Uma branch por tarefa: `feat/T-XXX-<slug>` (ou `fix/...`).
- Merge em `main` só após decisão do George.

## Quem commita

O orquestrador. Dev e devops apenas sugerem a mensagem no handoff.
Um commit por etapa do fluxo que alterou arquivos.
