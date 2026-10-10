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

**Embrulhos** (comandos que executam o comando seguinte): `env`, `timeout`, `nice`, `nohup`, `stdbuf`, `time`, `exec`, `command`, `builtin`, `sudo`, `doas` e `xargs` são tirados antes da análise.
Cada um tem uma lista de opções conhecidas; as que têm valor consomem o valor (`env -u X`, `timeout -s KILL 5`, `exec -a nome`, `stdbuf -oL`, `nice -n 5`).
Opção fora da lista, `env -S`/`--split-string` (divide um texto em comando) e embrulhos sem análise (`setsid`, `watch`, `flock`, `strace`, `chroot`...) são negados para subagentes.
`env -C PASTA` e `sudo -D PASTA` trocam a pasta do comando seguinte (ou a deixam desconhecida, se for variável); `time -o ARQUIVO` é conferido como alvo.
Também são conferidos: as origens de `tar --remove-files` (apagadas); os arquivos de entrada do `awk` quando o programa vem de arquivo (`-f`, `-E`, `-i outro.awk`).
Negados para subagentes: `curl -K`/`--config`, `wget --config`, programa do `awk` com `@include`/`@load`, `awk -l`, e as variáveis `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE`, `GIT_NAMESPACE`, `CURL_HOME`, `WGETRC`, `HOME` e `XDG_CONFIG_HOME` (antes do comando, com `env` ou em `export`/`declare`), que apontam o git para outro repositório ou trocam a configuração de curl e wget.

O code-reviewer só roda uma lista de leitura: git de leitura, testes, lint, build, o validador, laços (`for`, `case`, `while read`), `awk` de leitura e utilitários como `cat` e `grep`.
Para ele também são negados `--fix`, `-u`/`--update` (snapshots), `node --test --import/--require`, `git -c`, `time -o` e variáveis como `GIT_EXTERNAL_DIFF` e `NODE_OPTIONS`, que fazem um comando de leitura gravar ou executar outro programa.
Variáveis liberadas antes de um comando: as da lista segura (`CI`, `PYTHONUTF8`, `IFS`...). Atribuição solta, sem comando (`n=0`), só para variáveis em minúsculas, que ficam no shell (as que mudam o que um programa executa, como `PATH`, são maiúsculas).

**Precedência**: as regras `permissions.deny` do `.claude/settings.json` valem antes do "permitir" do hook. Exemplo: `rm -rf apps/web/dist` passa no teste do hook para o dev, mas a regra `deny` de `rm -rf` nega do mesmo jeito.

**Limites conhecidos**: o que um script faz por dentro (`node script.mjs`, `npm run x`) não é analisado.
Para os agentes que escrevem, comandos fora da lista acima que gravam arquivos (ex.: `gzip`, `zip`, `split`, `npx prettier --write`) também não são analisados; o mesmo vale para embrulhos fora das duas listas (comando desconhecido é permitido, decisão D5 da T-001).
Arquivos de configuração lidos por padrão (`~/.curlrc`, `~/.wgetrc`, `.gitconfig`) ficam fora do repositório e não são lidos pelo hook.
O hook é uma grade de proteção contra o engano comum, não uma caixa de areia; a conferência do orquestrador (`git status`) e a revisão do code-reviewer continuam valendo.

### Falhas

Erro inesperado no hook: a sessão principal segue (falha aberta) e o subagente é bloqueado com a mensagem do erro (falha fechada).

### Testes

```bash
npm run test:hooks
```

Também rodam dentro de `npm test` (e, portanto, no CI).
Quando a tabela "Áreas por caminho" do `AGENTS.md` mudar, atualize `areas.mjs` e os testes em `tests/`.
