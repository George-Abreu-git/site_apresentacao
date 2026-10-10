---
tipo: estudo
tarefa: T-002
tags: [devops]
data: 2026-10-09
---

# .gitattributes e fim de linha (autocrlf)

## Conceito

Um arquivo de texto tem um caractere invisível no fim de cada linha, e ele varia conforme o sistema:

- **LF** (`\n`): Linux e macOS.
- **CRLF** (`\r\n`): Windows.

O Git pode converter isso automaticamente. A configuração `core.autocrlf=true` (comum no Windows) faz o Git **converter para CRLF ao baixar** e **para LF ao commitar**. O problema é que esta é uma configuração **da máquina de cada pessoa**, não do repositório: quem tem outra configuração se comporta diferente.

O arquivo **`.gitattributes`** resolve isso: fica **dentro do repositório** e vale para todos. Uma linha como `* text=auto eol=lf` diz: "trate arquivos de texto automaticamente e use LF como fim de linha".

## Por que importa

Sem uma regra no repositório:

- Aparecem avisos como "LF will be replaced by CRLF" e diffs que mostram o arquivo inteiro como alterado, só pelo fim de linha.
- Scripts de shell (`.sh`) com CRLF **quebram** em Linux (o `\r` vira parte do comando). Isso importa quando houver CI ou Docker em Linux (T-001 e a futura stack).
- Ferramentas que comparam conteúdo (hashes, testes de snapshot) dão resultados diferentes entre Windows e Linux.

## Como aparece no projeto

- O George trabalha no **Windows 11** e o Git está com `core.autocrlf=true`.
- Achado **B6** da T-002: o repositório **não tem `.gitattributes`**. Sugestão do QA: `* text=auto eol=lf`.
- Relacionado, **B13**: no Windows, a saída do `validar_estrutura.py` mostra acentos quebrados em console `cp1252`. Não é o mesmo problema (aqui é *codificação de caracteres*, não fim de linha), mas é outra diferença de ambiente. Correção sugerida: `sys.stdout.reconfigure(encoding="utf-8")` ou rodar `python -X utf8`.
- Achado **B4/B5**: o `.gitignore` também é "regra do repositório" que precisa ser revisada na ADR de stack. Veja também que `.env.*` ignoraria `.env.example` (acrescentar `!.env.example`).

Em todos os casos, correção e escolha ficam para o George.

## Exemplo

```
# .gitattributes
* text=auto eol=lf          # texto sempre LF no repositório e no checkout
*.bat text eol=crlf         # exceção: scripts do Windows precisam de CRLF
*.png binary                # nunca converter imagens
```

Para ver o que o Git acha de um arquivo: `git ls-files --eol` mostra o fim de linha no índice e na pasta de trabalho.

## Para aprofundar

- Exercício: rode `git config core.autocrlf` e `git ls-files --eol` e veja se algum arquivo está com `w/crlf`.
- Pergunta: por que uma regra no repositório é melhor que depender da configuração de cada máquina?
- Pergunta: o que mudaria para um colega que usa macOS?

## Links

- Tarefa: [[docs/03-tarefas/T-002-qa-revisa-arquivos-antes-adr]]
- Relacionadas: [[revisao-de-consistencia-documental]]
