# Arquivo curado de projetos

`projetos.json` define **quais projetos aparecem no site e em que ordem** (RF-06, item 1).
A API lê este arquivo uma vez, ao iniciar, e o devolve em `GET /api/projetos`,
acrescentando os dados vivos do GitHub (ver "Resposta da API" abaixo).

## Formato

Uma lista (array) JSON. Cada item é um projeto, no formato do tipo `Projeto` de `packages/shared`
sem o campo `github` (tipo `ProjetoCurado`, em `src/projetos/projeto-curado.ts`):

| Campo | Obrigatório | Tipo | Descrição |
|---|---|---|---|
| `titulo` | sim | texto não vazio | Nome do projeto no card |
| `descricao` | sim | texto não vazio | Resumo do projeto |
| `stacks` | sim | lista de textos não vazios | Tecnologias, na ordem em que aparecem no card |
| `repositorio` | não | endereço `http(s)://` | Repositório do código; omita se o código não é público |
| `demo` | não | endereço `http(s)://` | Versão publicada do projeto |
| `imagem` | não | texto não vazio | Caminho da imagem de capa (ex.: `/imagens/projetos/site.png`) |

Salve o arquivo em **UTF-8**, com ou sem BOM (a marca invisível que alguns editores do Windows gravam
no início do arquivo): a API ignora um BOM no início e lê o restante normalmente.

A ordem dos itens no arquivo é a ordem no site. Campos fora desta tabela são recusados (pega erros de digitação, ex.: `"titlo"`).
O campo `github` também é recusado: ele é preenchido pela API, nunca pelo arquivo.

Cada projeto precisa de um **título único**: o título identifica o projeto no site (e é a chave dos cards no front).
Na comparação, espaços nas pontas, espaços a mais no meio e maiúsculas/minúsculas não contam:
`"Site"`, `" site "` e `"SITE"` são o mesmo título e o arquivo é recusado.

Exemplo:

```json
[
  {
    "titulo": "Site de apresentação",
    "descricao": "Portfólio pessoal com front em React e API em NestJS.",
    "stacks": ["React", "NestJS"],
    "repositorio": "https://github.com/George-Abreu-git/site_apresentacao",
    "demo": "https://exemplo.com",
    "imagem": "/imagens/projetos/site.png"
  }
]
```

## Arquivo inválido

Se o arquivo não existir, não for JSON válido ou sair do formato, a API **não inicia** e o log mostra
o caminho do arquivo e todos os problemas encontrados, por exemplo:

```
ArquivoDeProjetosInvalidoError: Arquivo curado de projetos inválido (.../apps/api/conteudo/projetos.json):
projeto 2 ("Meu projeto"): campo "stacks" é obrigatório e deve ser uma lista de textos não vazios
projeto 3 ("meu projeto"): título repetido — o mesmo do projeto 2 ("Meu projeto"); cada projeto precisa de um título único
```

A validação fica em `src/projetos/validar-projetos-curados.ts`; o teste
`src/projetos/ler-projetos-curados.spec.ts` confere que este arquivo continua válido.

## Resposta da API: dados vivos do GitHub

Em `GET /api/projetos`, cada projeto cujo `repositorio` é um endereço do GitHub
(`https://github.com/<dono>/<nome>`) ganha o campo `github` (RF-06, item 2):

| Situação | Campo `github` |
|---|---|
| Sem `repositorio`, ou repositório fora do GitHub | ausente (só os dados curados) |
| GitHub respondeu | `{ "disponivel": true, "linguagem": "TypeScript", "estrelas": 7, "ultimaAtualizacao": "2026-10-01T12:00:00Z" }` |
| GitHub fora do ar, lento (mais de 5 s), limite de requisições atingido ou repositório inexistente | `{ "disponivel": false }` — a resposta continua 200, com os dados curados |

- `linguagem` pode ser `null` (o GitHub não identificou a linguagem principal).
- `ultimaAtualizacao` é o último push no repositório, em ISO 8601.
- As respostas do GitHub ficam em cache na memória da API. Falhas não ficam: a próxima requisição tenta de novo.

Variáveis de ambiente (lidas na inicialização):

| Variável | Obrigatória | Descrição |
|---|---|---|
| `GITHUB_TOKEN` | não | Token de acesso à API do GitHub. Sem ele o limite é menor (60 requisições/hora). Nunca aparece no log nem na resposta |
| `GITHUB_CACHE_TTL_SEGUNDOS` | não | Por quantos segundos os dados de um repositório ficam em cache. Padrão: `3600` (1 hora). Valor que não seja inteiro maior que zero impede a API de subir |

O código fica em `src/github/` (módulo `github`).
