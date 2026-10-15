# Arquivo curado de projetos

`projetos.json` define **quais projetos aparecem no site e em que ordem** (RF-06, item 1).
A API lê este arquivo uma vez, ao iniciar, e o devolve em `GET /api/projetos`.

## Formato

Uma lista (array) JSON. Cada item é um projeto, no formato do tipo `Projeto` de `packages/shared`:

| Campo | Obrigatório | Tipo | Descrição |
|---|---|---|---|
| `titulo` | sim | texto não vazio | Nome do projeto no card |
| `descricao` | sim | texto não vazio | Resumo do projeto |
| `stacks` | sim | lista de textos não vazios | Tecnologias, na ordem em que aparecem no card |
| `repositorio` | não | endereço `http(s)://` | Repositório do código; omita se o código não é público |
| `demo` | não | endereço `http(s)://` | Versão publicada do projeto |
| `imagem` | não | texto não vazio | Caminho da imagem de capa (ex.: `/imagens/projetos/site.png`) |

A ordem dos itens no arquivo é a ordem no site. Campos fora desta tabela são recusados (pega erros de digitação, ex.: `"titlo"`).

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
```

A validação fica em `src/projetos/validar-projetos-curados.ts`; o teste
`src/projetos/ler-projetos-curados.spec.ts` confere que este arquivo continua válido.
