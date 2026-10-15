---
tipo: estudo
tarefa: T-005
tags: [back-end, api]
data: 2026-10-10
---

# NestJS: módulos, controllers e o bootstrap da API

## Conceito

O **NestJS** é um framework para APIs em Node. Por baixo ele usa o Express (o servidor HTTP); por cima, organiza o código em três peças, todas marcadas com **decorators**:

- **Decorator** é uma função com `@` na frente de uma classe ou método (`@Controller`, `@Get`, `@Module`). Ela não muda o que o código faz; ela **anota** a classe com informações ("esta classe responde em `/health`"). Quando a API sobe, o Nest lê essas anotações e monta as rotas. Por isso o `tsconfig.json` da API liga `experimentalDecorators` e `emitDecoratorMetadata`, e o pacote `reflect-metadata` está nas dependências.
- **Controller** recebe a requisição HTTP e devolve a resposta. Cada método marcado com `@Get()`, `@Post()` etc. é uma rota. O que o método retorna vira JSON automaticamente.
- **Módulo** (`@Module`) agrupa os controllers (e, mais tarde, os *services*) de um mesmo assunto. O `AppModule` é a raiz que importa os outros. A ADR-0001 chama isso de **monolito modular**: uma API só, dividida em módulos por assunto (health, projetos, contato...).

### O bootstrap: `criarApp` × `main.ts`

*Bootstrap* é o código que "liga" a API. Na T-005 ele foi dividido em dois arquivos de propósito:

| Arquivo | Faz | Quem usa |
|---|---|---|
| `apps/api/src/criar-app.ts` | Cria a aplicação a partir do `AppModule` e aplica o **prefixo global** `/api`. **Não** abre porta. | `main.ts` e os testes de rota |
| `apps/api/src/main.ts` | Lê o `.env`, chama `criarApp()` e faz `app.listen(PORT)`. | Só a execução real (`npm run dev`, `npm start`) |

Assim, o teste de rota monta **exatamente a mesma API** que roda de verdade (mesmo prefixo, mesmos módulos), sem disputar porta com nada. Se o prefixo ficasse no `main.ts`, o teste montaria uma API diferente da real e não pegaria um erro de prefixo.

**Prefixo global**: `app.setGlobalPrefix('api')` faz toda rota começar com `/api`. O controller diz só `@Controller('health')`, e a rota final é `GET /api/health`. O teste de rota confere os dois lados: `/api/health` responde 200 e `/health` responde 404.

### `process.loadEnvFile`: lendo o `.env` sem biblioteca

Variáveis de ambiente (`PORT`, `CORS_ORIGIN`, `GITHUB_TOKEN`) guardam configuração e segredos **fora do código**. Em desenvolvimento ficam num arquivo `apps/api/.env` (ignorado pelo git; o modelo é o `.env.example` da raiz). Em produção são cadastradas no painel do Render.

O Node (desde a versão 20.12, e o projeto exige 24) tem `process.loadEnvFile(caminho)`, que lê um arquivo `CHAVE=valor` e preenche `process.env`. Por isso não foi preciso `dotenv` nem `@nestjs/config`. Dois detalhes, ambos com teste:

1. Se o arquivo não existe, o Node **lança erro**. Em produção não há `.env`, então `carregarVariaveisDeAmbiente` confere com `existsSync` antes e devolve `false`.
2. Uma variável que **já existe** no ambiente não é sobrescrita. Assim, em produção, vale o valor do painel.

Atenção à ordem: os `import` de um arquivo ESM rodam **antes** do corpo do arquivo. Então o `.env` só está carregado depois da linha `carregarVariaveisDeAmbiente()`. Por isso o comentário do `main.ts` pede que os módulos leiam `process.env` **dentro das classes**, não no topo do arquivo.

## Por que importa

- A API é metade da trilha (back-end + API). Módulo → controller → (service, na T-010) é o caminho que toda rota nova vai seguir.
- Separar "montar" de "ligar" é um padrão que aparece em quase todo framework: é o que torna a API testável de ponta a ponta sem rede.
- Segredos fora do código são requisito de segurança (Definition of Done: "sem segredos").

## Como aparece no projeto

- `apps/api/src/app.module.ts` — módulo raiz; `imports: [HealthModule, ProjetosModule]` (o `ProjetosModule` entrou na T-010). Novos assuntos entram aqui.
- `apps/api/src/health/health.module.ts` e `health.controller.ts` — o primeiro módulo; `GET /api/health` → `{ status: "ok" }`, com o tipo `StatusDaApi`.
- `apps/api/src/criar-app.ts` — `criarApp()` e a constante `PREFIXO_DAS_ROTAS`.
- `apps/api/src/main.ts` — `.env` + `listen`.
- `apps/api/src/config/carregar-variaveis-de-ambiente.ts` — `process.loadEnvFile` com os 3 testes ao lado.
- `.env.example` (raiz) — documenta `PORT`, `CORS_ORIGIN` e `GITHUB_TOKEN` (vazio).

## Exemplo

```ts
// apps/api/src/health/health.controller.ts
@Controller('health')          // parte da URL que este controller atende
export class HealthController {
  @Get()                       // GET /api/health (o "/api" vem do criarApp)
  verificar(): StatusDaApi {
    return { status: 'ok' };   // o Nest transforma em JSON e responde 200
  }
}

// apps/api/src/criar-app.ts
export async function criarApp(opcoes?: NestApplicationOptions) {
  const app = await NestFactory.create(AppModule, opcoes); // lê os decorators e monta tudo
  app.setGlobalPrefix(PREFIXO_DAS_ROTAS);                  // 'api'
  return app;                                              // sem listen: quem decide é quem chama
}
```

O caminho de uma requisição `GET http://localhost:3000/api/health`:

```
Express recebe → Nest tira o prefixo /api → procura um controller 'health'
→ método com @Get() sem caminho → verificar() → { status: 'ok' } → JSON, 200
```

## Para aprofundar

- **Exercício**: crie (numa branch de estudo, sem commitar) uma rota `GET /api/health/versao` que devolve `{ versao: "0.0.0" }`. Dica: um segundo método no mesmo controller com `@Get('versao')`. Depois escreva o teste de rota dela, copiando o padrão de `apps/api/test/health.e2e-spec.ts`.
- **Pergunta**: o teste unitário `health.controller.spec.ts` faz `new HealthController()` e também monta o `HealthModule` com `Test.createTestingModule`. O que o segundo teste prova que o primeiro não prova?
- **Pesquisa**: o que é **injeção de dependência** no Nest (`@Injectable`, `providers`)? Ela vai aparecer na T-010, quando o controller de projetos receber um *service*.
- **Pergunta**: por que `GITHUB_TOKEN` fica vazio no `.env.example` em vez de ter um valor de exemplo?

## Links

- Tarefa: [[docs/03-tarefas/T-005-monorepo-base]]
- ADR: [[docs/02-arquitetura/ADR-0001-stack]]
- Relacionadas: [[mapa-do-monorepo]], [[tipos-de-teste-unitario-rota-e2e]], [[gitignore-padroes-e-check-ignore]]
