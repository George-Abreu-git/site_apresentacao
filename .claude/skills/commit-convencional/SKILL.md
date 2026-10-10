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
- Branches de estudo: `estudos/T-XXX` (diário do documentador, integrada pelo worktree sem sair da tarefa em andamento — ver `orquestrar-tarefa`) e `estudos/consolidacao-AAAA-MM-DD` (`/estudar-consolidar`). Só alteram Markdown de estudo e a nota da tarefa; entram na `main` com o validador verde, sempre por fast-forward.
- Merge em `main`: automático quando **todos** os testes e o validador passam (merge local primeiro, depois `git push origin main`). Se algo falhar, nada de merge — decisão do George.
- Remoto: `origin` = https://github.com/George-Abreu-git/site_apresentacao
- Sessões do Cowork não têm credenciais do GitHub: lá, faça só commit e merge local e avise o George para rodar `git push` no VS Code. No Claude Code do VS Code, o push é automático.

## Quem commita

O orquestrador. Dev e devops apenas sugerem a mensagem no handoff.
Um commit por etapa do fluxo que alterou arquivos.
