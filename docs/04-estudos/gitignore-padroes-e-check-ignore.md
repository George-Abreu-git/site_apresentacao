---
tipo: estudo
tarefa: T-004
tags: [devops]
data: 2026-10-10
---

# Padrões do .gitignore e `git check-ignore`

## Conceito

O `.gitignore` é uma lista de **padrões** (um por linha) que dizem ao Git: "não ofereça estes arquivos para commit". Arquivo ignorado não aparece no `git status` como não rastreado e não entra num `git add .`.

As regras que mais importam no projeto:

| Padrão | O que significa |
|---|---|
| `dist/` | **Barra no final** = casa **só com pastas** chamadas `dist`. Um arquivo chamado `dist` não seria ignorado. |
| `dist/` (sem outra barra) | Sem barra no início ou no meio, o padrão vale **em qualquer nível**: `dist/`, `apps/web/dist/`, `apps/api/dist/`. |
| `/dist/` ou `apps/dist/` | Barra no início ou no meio "ancora" o padrão na pasta onde está o `.gitignore`. `/dist/` pegaria só a da raiz. |
| `.env.*` | `*` casa com qualquer sequência de caracteres (menos `/`): `.env.local`, `.env.production`, `.env.example`... |
| `!.env.example` | **Negação**: um `!` no início "desfaz" um padrão anterior para esse caminho. |
| `#` | Comentário. |

Duas regras de leitura:

1. **A última regra que casa vence.** Por isso `!.env.example` vem **depois** de `.env.*`. Se viesse antes, o `.env.*` da linha seguinte voltaria a ignorar o arquivo.
2. **Não dá para "designorar" um arquivo dentro de uma pasta ignorada.** Se `config/` estiver ignorada, `!config/modelo.json` não funciona: o Git nem entra na pasta para olhar. (No projeto isso não acontece, porque o `.env.example` fica direto em uma pasta não ignorada.)

E para **conferir** as regras, sem adivinhar:

- `git check-ignore <caminho>` imprime o caminho se ele for ignorado; se não for, não imprime nada.
- `-v` (verbose) mostra **qual regra** decidiu: `arquivo:linha:padrão<TAB>caminho`.
- `--no-index` faz o Git **ignorar o índice** (a "área de stage"). Sem ele, um arquivo que já foi rastreado aparece como "não ignorado", mesmo que um padrão case com ele, porque o `.gitignore` só vale para arquivos ainda não rastreados.

## Por que importa

- **Segredos**: o `.env` vai guardar o token do GitHub (ADR-0001: "token só em variável de ambiente no Render"). Se ele for commitado, o token vaza no histórico, e apagar depois não basta (é preciso revogar o token).
- **Lixo gerado**: `node_modules/` tem milhares de arquivos e é recriado com `npm install`; `dist/`, `coverage/`, `playwright-report/` e `test-results/` são recriados a cada build ou teste. Commitá-los gera diffs enormes e conflitos sem sentido.
- **O modelo precisa ir**: o `.env.example` (com nomes das variáveis e valores falsos) é o que ensina quem clona o projeto a montar o próprio `.env`. Ignorá-lo por engano (achado B4/B5 da T-002) esconderia essa documentação.

## Como aparece no projeto

Na [[docs/03-tarefas/T-004-atualiza-agents-stack|T-004]] o devops ajustou o `.gitignore` da raiz para o monorepo Node da [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]]:

- Já existiam `node_modules/`, `dist/`, `build/`, `.env` e `.env.*`.
- Entraram `coverage/` (relatório de cobertura do Vitest), `playwright-report/` e `test-results/` (saídas do Playwright) e a negação `!.env.example`.
- O comentário da primeira linha explica a barra final: "npm workspaces: valem em qualquer pasta, ex.: `apps/web/dist/`". Um único `.gitignore` na raiz cobre `apps/web`, `apps/api` e `packages/shared`.

Como o código ainda não existe, ninguém pode "ver" o resultado no `git status`. Por isso o code-reviewer e o QA usaram `git check-ignore --no-index` para **testar as regras com caminhos**: `node_modules`, `dist`, `coverage`, `playwright-report`, `test-results`, `.env`, `.env.local`, `.env.production` e `apps/api/.env*` saíram ignorados; `.env.example`, `apps/api/.env.example` e `apps/web/.env.example` **não** saíram (regra `!.env.example`, linha 14). Repare: `!.env.example` também não tem barra no meio, então vale em qualquer pasta.

Isso é o princípio de [[verificar-antes-de-concluir]] aplicado a um arquivo de configuração: em vez de "acho que está certo", um comando que prova.

## Exemplo

O trecho do `.gitignore` da raiz, comentado:

```
# Dependências e builds
node_modules/      # só pastas, em qualquer nível (raiz, apps/web/, apps/api/...)
dist/              # saída do build do Vite e do NestJS

# Relatórios de testes
coverage/          # Vitest --coverage
playwright-report/ # relatório HTML do Playwright
test-results/      # traces e screenshots do Playwright

# Variáveis de ambiente
.env               # o arquivo de segredos
.env.*             # .env.local, .env.production... e também .env.example!
!.env.example      # ...por isso esta negação, DEPOIS do .env.*
```

Conferindo no terminal (PowerShell ou bash):

```
git check-ignore -v --no-index apps/api/.env.local
# .gitignore:13:.env.*	apps/api/.env.local      -> ignorado pela linha 13

git check-ignore -v --no-index apps/api/.env.example
# .gitignore:14:!.env.example	apps/api/.env.example -> a regra que casou começa com "!": NÃO ignorado

git check-ignore --no-index apps/api/.env.example
# (sem saída) -> não ignorado
```

Atenção ao `-v`: ele também mostra caminhos que casaram com uma **negação**. Leia o padrão: se começa com `!`, o arquivo **não** é ignorado. Para um "sim/não" simples, use o comando sem `-v` (imprime = ignorado; vazio = não ignorado).

## Para aprofundar

- Exercício: rode `git check-ignore -v --no-index` para `apps/web/dist/index.html` e `e2e/test-results/trace.zip`. Qual linha decidiu cada um? Repare que o arquivo está *dentro* da pasta ignorada: o Git confere as pastas do caminho, não só o nome final.
- Exercício: num rascunho, inverta a ordem das linhas 13 e 14 do `.gitignore` (sem commitar) e rode o check-ignore no `.env.example`. O que mudou? Desfaça com `git checkout -- .gitignore`.
- Pergunta: por que o comando sem `--no-index` responderia "não ignorado" para um `.env` que alguém já tivesse commitado? O que precisaria ser feito além de colocá-lo no `.gitignore`? (Dica: `git rm --cached`, e revogar o segredo.)
- Pesquisa: teste `git check-ignore --no-index apps/web/node_modules` antes e depois de criar essa pasta. O resultado muda? Por que um padrão com barra final dependeria de o Git saber se o caminho é uma pasta?

## Links

- Tarefa: [[docs/03-tarefas/T-004-atualiza-agents-stack]]
- ADR: [[docs/02-arquitetura/ADR-0001-stack]]
- Relacionadas: [[gitattributes-e-fim-de-linha]], [[verificar-antes-de-concluir]], [[monorepo-com-npm-workspaces]]
