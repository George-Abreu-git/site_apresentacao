# Hooks do Claude Code

## `restringir-escrita.mjs` — restrição de escrita por agente (T-001)

Hook `PreToolUse` registrado em `.claude/settings.json` para `Edit`, `Write`, `MultiEdit`, `NotebookEdit`, `Bash` e `PowerShell`.
Ele aplica a tabela "Áreas por caminho" do `AGENTS.md`: cada subagente só escreve na sua área.

### Como ele sabe quem está agindo

O Claude Code manda ao hook um JSON pela entrada padrão.
Quando a chamada vem de um subagente, o JSON traz `agent_id` e `agent_type` (o `name` do frontmatter em `.claude/agents/`).
Sem `agent_id`, a chamada é da **sessão principal** (o orquestrador), que **nunca é bloqueada**.

### Decisões

- **permitir**: sem saída; segue o fluxo normal de permissões. O hook nunca responde "allow", para não pular confirmações.
- **negar**: `permissionDecision: "deny"` com o motivo, que o agente lê.
- **perguntar**: `permissionDecision: "ask"`. Usado quando o devops altera `.claude/agents/**`: o George confirma na hora (critério 30).

Regras para todo subagente: nunca `docs/03-tarefas/**`, `.git/**` nem `package-lock.json` editado à mão.
Agente fora da tabela (ex.: `Explore`, `general-purpose`) não tem área: não escreve no repositório.
Caminhos fora do repositório (ex.: a pasta temporária) não são governados pela tabela.
Dentro de um worktree de subagente (`.claude/worktrees/<nome>/`), o caminho é avaliado relativo à raiz do worktree.

### Bash

`shell.mjs` separa o comando em comandos simples e procura escritas: redirecionamentos (`>`, `>>`, `&>`), `tee`, `sed -i`, `mv`, `cp`, `rm`, `touch`, `mkdir`, `find -delete`, `xargs rm`, `bash -c "..."`, `$(...)` e os comandos `git` que mexem na árvore de trabalho.
Também confere o destino de `curl -o`/`-O`, `wget` (`-O`, `-P` ou a pasta atual), `rsync` (último argumento), `tar -x`/`-C` e `tar -c -f`, `unzip` (`-d` ou a pasta atual) e `awk -i inplace`.
Chaves viram vários caminhos, como no bash (`apps/web/src/{a,b}` → dois alvos); com curinga, vale a pasta antes dele, e `..` (ou nome que começa com `.`) depois do curinga é negado.
Alvo que não dá para conferir (variável, `$'...'`, `cd` para um lugar desconhecido, comando que não analisa) é negado para subagentes.
O code-reviewer só roda uma lista de leitura: git de leitura, testes, lint, build, o validador, laços (`for`, `case`, `while read`), `awk` de leitura e utilitários como `cat` e `grep`.
Para ele também são negados `--fix`, `-u`/`--update` (snapshots), `node --test --import/--require`, `git -c` e variáveis como `GIT_EXTERNAL_DIFF` e `NODE_OPTIONS`, que fazem um comando de leitura gravar ou executar outro programa.

**Precedência**: as regras `permissions.deny` do `.claude/settings.json` valem antes do "permitir" do hook. Exemplo: `rm -rf apps/web/dist` passa no teste do hook para o dev, mas a regra `deny` de `rm -rf` nega do mesmo jeito.

**Limites conhecidos**: o que um script faz por dentro (`node script.mjs`, `npm run x`) não é analisado.
Para os agentes que escrevem, comandos fora da lista acima que gravam arquivos (ex.: `gzip`, `zip`, `split`, `npx prettier --write`) também não são analisados.
O hook é uma grade de proteção contra o engano comum, não uma caixa de areia; a conferência do orquestrador (`git status`) e a revisão do code-reviewer continuam valendo.

### Falhas

Erro inesperado no hook: a sessão principal segue (falha aberta) e o subagente é bloqueado com a mensagem do erro (falha fechada).

### Testes

```bash
npm run test:hooks
```

Também rodam dentro de `npm test` (e, portanto, no CI).
Quando a tabela "Áreas por caminho" do `AGENTS.md` mudar, atualize `areas.mjs` e os testes em `tests/`.
