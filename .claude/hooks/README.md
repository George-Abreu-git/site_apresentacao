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
Também confere o destino de `curl -o`/`-O`, `wget` (`-O`, `-P` ou a pasta atual), `rsync` (último argumento), `tar -x`/`-C` e `tar -c -f`, `unzip` (`-d` ou a pasta atual), `awk -i inplace` e `sort`/`shuf -o`.
`sed` é negado para todo subagente quando o script executa ou grava (comando `e`/`w`/`W`, com ou sem endereço; flag `e`/`w` no `s///`; `-f`/`--file`, que traz o script de um arquivo invisível), além do `sed -i` já conferido contra a área.
Editores de linha (`ex`, `ed`, `red`) gravam por comando e são negados para quem escreve. `vi`, `vim`, `nvim` e `view` são **sempre** negados para subagentes: o Bash da ferramenta não tem terminal, então eles só rodam em modo ex/script (`-c`, `+cmd`, `-e -s`, `-s`, `-S`, `-y`...), que grava arquivos.
Chaves viram vários caminhos, como no bash (`apps/web/src/{a,b}` → dois alvos); com curinga, vale a pasta antes dele, e `..` (ou nome que começa com `.`) depois do curinga é negado.
Nos comandos que o hook analisa, alvo de escrita que não dá para conferir (variável, `$'...'`, `cd` para um lugar desconhecido) é negado para subagentes.
Comando **desconhecido** (fora das listas) é **permitido** (decisão D5 da T-001), **exceto** quando cita um caminho protegido: aí a rede de segurança, abaixo, nega.

**Embrulhos** (comandos que executam o comando seguinte): `env`, `timeout`, `nice`, `nohup`, `stdbuf`, `time`, `exec`, `command`, `builtin`, `sudo`, `doas` e `xargs` são tirados antes da análise.
Cada um tem uma lista de opções conhecidas; as que têm valor consomem o valor (`env -u X`, `timeout -s KILL 5`, `exec -a nome`, `stdbuf -oL`, `nice -n 5`).
Opção fora da lista, `env -S`/`--split-string` (divide um texto em comando), argumento dinâmico antes do comando (`timeout $(…) 5 rm …`) e embrulhos sem análise (`setsid`, `watch`, `flock`, `strace`, `chroot`... e os executores do Windows/Git Bash `cmd`, `start`, `winpty`, `wsl`) são negados para subagentes.
`powershell`/`pwsh` chamados pelo Bash vão para o mesmo analisador do PowerShell (só leitura para subagente, D3(7)): verbos e apelidos que escrevem, redirecionamento e git que mexe na árvore são negados; comando codificado (`-EncodedCommand`, inclusive abreviado, como `-enc`) não é verificável.
Como essa checagem por verbos não pega tudo (`(gi arquivo).Delete()`, apelidos como `clc`), também são negados o texto que cita caminho protegido (`docs/03-tarefas`, `.claude/agents`, `.git/`) e o comando lido da entrada (`-Command -`, `-File -` ou nenhum comando, como em `echo ... | powershell`).
`env -C PASTA` e `sudo -D PASTA` trocam a pasta do comando seguinte (ou a deixam desconhecida, se for variável); `time -o ARQUIVO` é conferido como alvo.
Também são conferidos: as origens de `tar --remove-files` (apagadas); os arquivos de entrada do `awk` quando o programa vem de arquivo (`-f`, `-E`, `-i outro.awk`).
Negados para subagentes: `curl -K`/`--config`, `wget --config`, programa do `awk` com `@include`/`@load`, `awk -l`.

Para **todo subagente** (code-reviewer e quem escreve), o git que executa programas é negado: `git -c`, `--config-env`, `--exec-path`, `git grep -O`, e qualquer variável `GIT_*` ou `PAGER` antes do comando (diff externo, pager, ssh...), menos `GIT_PAGER=cat` e `PAGER=cat`. As variáveis `HOME`, `XDG_CONFIG_HOME`, `CURL_HOME` e `WGETRC` são negadas só quando o comando é `curl`, `wget` ou `git` (mudam de onde eles leem a configuração); antes de outros comandos (`HOME=/tmp npm test`) elas passam. `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE` e `GIT_NAMESPACE` apontam o git para outro repositório ou árvore e são sempre negadas (com `env` ou em `export`/`declare`).

**Rede de segurança** (para quem escreve): um comando sem análise específica (desconhecido ou fora das listas) que cita um caminho protegido (`docs/03-tarefas`, `.claude/agents` ou `.git/`) em algum argumento ou atribuição é negado. Leituras conhecidas (`cat`, `grep`, `head`, `tail`, `wc`, `diff`...), testes (`[`, `[[`, `test`), `read` e os cabeçalhos `for`, `case` e `select` ficam de fora para não travar fluxos legítimos (`[ -f docs/03-tarefas/x ]` passa; num laço, cada comando do corpo continua analisado: `do rm "$f"` é negado). `sort` e `uniq` não entram nessa isenção porque gravam com `-o`/arquivo de saída.

O code-reviewer só roda uma lista de leitura: git de leitura, testes, lint, build, o validador, laços (`for`, `case`, `while read`), `awk` de leitura e utilitários como `cat` e `grep`.
Para ele também são negados `--fix`, `-u`/`--update` (snapshots), `node --test --import/--require`, `git -c`, `time -o` e variáveis como `GIT_EXTERNAL_DIFF` e `NODE_OPTIONS`, que fazem um comando de leitura gravar ou executar outro programa.
Variáveis liberadas antes de um comando: as da lista segura (`CI`, `PYTHONUTF8`, `IFS`...). Atribuição solta, sem comando (`n=0`), só para variáveis em minúsculas, que ficam no shell (as que mudam o que um programa executa, como `PATH`, são maiúsculas).

**Precedência**: as regras `permissions.deny` do `.claude/settings.json` valem antes do "permitir" do hook. Exemplo: `rm -rf apps/web/dist` passa no teste do hook para o dev, mas a regra `deny` de `rm -rf` nega do mesmo jeito.

**Limites conhecidos**: o que um script faz por dentro (`node script.mjs`, `npm run x`) não é analisado.
Para os agentes que escrevem, comandos fora da lista acima que gravam arquivos (ex.: `gzip`, `zip`, `split`, `npx prettier --write`) também não são analisados; o mesmo vale para embrulhos fora das duas listas (comando desconhecido é permitido, decisão D5 da T-001). Eles só são barrados pela rede de segurança quando citam um caminho protegido.
Arquivos de configuração lidos por padrão (`~/.curlrc`, `~/.wgetrc`, `.gitconfig`) ficam fora do repositório e não são lidos pelo hook.
Por isso `export HOME=...` voltou a passar (só `HOME=... curl|wget|git` na mesma linha é negado, D6): o efeito é mudar de onde essas configurações são lidas, que já está fora do que o hook verifica.
Limites apontados na revisão da T-001 (rodada 4) e sugeridos para uma tarefa futura de endurecimento (D7):
1. opções longas abreviadas (`sed --in`, `sed --expr=...`, `--fil=`, `sort`/`shuf --out=`) não são reconhecidas como as formas completas;
2. script do `sed` vindo de variável (`sed "$s" arquivo`) não é inspecionado;
3. a rede de segurança olha só o texto dos argumentos, não a pasta atual (`cd docs/03-tarefas && npx prettier --write T-001.md` passa).
O hook é uma grade de proteção contra o engano comum, não uma caixa de areia; a conferência do orquestrador (`git status`) e a revisão do code-reviewer continuam valendo.

### Falhas

Erro inesperado no hook: a sessão principal segue (falha aberta) e o subagente é bloqueado com a mensagem do erro (falha fechada).

### Testes

```bash
npm run test:hooks
```

Também rodam dentro de `npm test` (e, portanto, no CI).
Quando a tabela "Áreas por caminho" do `AGENTS.md` mudar, atualize `areas.mjs` e os testes em `tests/`.
