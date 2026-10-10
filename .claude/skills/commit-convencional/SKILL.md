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

- `main` é a principal; nunca commitar trabalho de tarefa direto nela. Exceção: a criação da nota de tarefa (`/nova-tarefa`) e atualizações do backlog fora de um fluxo são commitadas em `main`.
- Uma branch por tarefa: `feat/T-XXX-<slug>` (ou `fix/...`).
- Merge em `main`: automático quando **todos** os testes e o validador passam (merge local primeiro, depois `git push origin main`). Se algo falhar, nada de merge — decisão do George.
- Remoto: `origin` = https://github.com/George-Abreu-git/site_apresentacao

## Quem commita

O orquestrador. Dev e devops apenas sugerem a mensagem no handoff.
Um commit por etapa do fluxo que alterou arquivos.
