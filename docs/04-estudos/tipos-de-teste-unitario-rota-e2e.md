---
tipo: estudo
tarefa: T-005
tags: [front-end, back-end, api, devops]
data: 2026-10-10
---

# Tipos de teste: unitário, rota e e2e

## Conceito

Um teste é um pequeno programa que usa o seu código e confere se o resultado é o esperado. O projeto tem **três tipos**, do menor (rápido, isolado) ao maior (lento, realista). Pense numa pirâmide: muitos unitários na base, poucos e2e no topo.

| Tipo | Ferramenta | O que monta | Comando | Exemplo no projeto |
|---|---|---|---|---|
| **Unitário** | Vitest (+ Testing Library no front) | Uma função, classe ou componente, sozinho | `npm test` | `App.test.tsx`, `health.controller.spec.ts` |
| **Rota** | Vitest + Supertest | A API inteira, em memória, recebendo HTTP de verdade | `npm test` | `apps/api/test/health.e2e-spec.ts` |
| **E2E** (ponta a ponta) | Playwright | O site rodando num navegador de verdade | `npm run test:e2e` | `e2e/testes/pagina-inicial.spec.ts` |

Todos seguem o mesmo esqueleto: **monta** o cenário, **age** e **confere** (`expect`).

### 1. Unitário no front: Vitest + Testing Library, buscando por papel

O **Vitest** roda os testes no Node. Mas o Node não tem `document` nem `window`, então o front usa o **jsdom**, um navegador simulado (`environment: 'jsdom'` em `apps/web/vite.config.ts`).

A **Testing Library** desenha o componente (`render(<App />)`) e oferece buscas que imitam **como uma pessoa usa a página**. A preferida é `getByRole`: procura pelo **papel** do elemento na árvore de acessibilidade, que é o que o leitor de tela anuncia ("título de nível 1, George Siqueira").

```tsx
// apps/web/src/App.test.tsx
render(<App />);
expect(screen.getByRole('heading', { level: 1, name: 'George Siqueira' })).toBeInTheDocument();
```

Por que por papel, e não por classe CSS ou `id`? Porque o teste continua passando se você mudar o estilo, e **quebra** se a página perder a semântica (ex.: trocar o `<h1>` por uma `<div>` com letra grande). O teste vira, de graça, um guardião da acessibilidade.

O `apps/web/src/configurar-testes.ts` roda antes de cada arquivo: traz os *matchers* do jest-dom (`toBeInTheDocument`, `toHaveTextContent`) e desmonta a tela depois de cada teste (`cleanup`).

### 2. Unitário na API: a classe sozinha e o módulo montado

`health.controller.spec.ts` tem dois testes: um faz `new HealthController()` e chama o método direto (testa a lógica); o outro usa `Test.createTestingModule({ imports: [HealthModule] })`, que monta o módulo como o Nest faria (testa se o controller está registrado). `carregar-variaveis-de-ambiente.spec.ts` cria arquivos `.env` numa pasta temporária e apaga tudo no `afterEach`.

### 3. Rota: Supertest sem abrir uma porta fixa

O teste de rota passa pelas camadas que o unitário pula: prefixo `/api`, roteamento do Nest, conversão para JSON, código HTTP.

```ts
// apps/api/test/health.e2e-spec.ts
app = await criarApp({ logger: false }); // a mesma API do main.ts (veja a nota do NestJS)
await app.init();                        // registra as rotas, mas NÃO chama listen()

const resposta = await request(app.getHttpServer()).get('/api/health');
expect(resposta.status).toBe(200);
expect(resposta.body).toEqual({ status: 'ok' });
```

O **Supertest** recebe o servidor HTTP do Nest e faz a requisição contra ele. Como o servidor não está escutando, o próprio Supertest o liga numa **porta temporária escolhida pelo sistema** (porta 0) só durante a requisição. Então não existe porta fixa (3000) para conflitar com um `npm run dev` aberto, e vários testes podem rodar em paralelo. No `afterAll`, `app.close()` libera tudo.

O arquivo se chama `e2e-spec` por convenção do Nest, mas no projeto ele é o **teste de rota**; o "e2e" de verdade é o Playwright.

### 4. E2E: Playwright com projetos e `webServer`

O **Playwright** controla um navegador real (Chromium) e faz o que uma pessoa faria: abrir a página, ler, medir. Dois recursos do `e2e/playwright.config.ts`:

- **`projects`**: cada teste roda uma vez **por projeto**. Há dois: `celular` (aparelho Pixel 7, tela pequena e toque) e `desktop` (1440×900). São 4 testes × 2 projetos = **8 execuções**. É assim que o projeto prova que a página é responsiva.
- **`webServer`**: antes dos testes, o Playwright roda `npm run dev -w apps/web -- --port 5173 --strictPort`, espera a URL responder e, no fim, derruba o servidor. Você não precisa subir nada à mão. Fora do CI, se já houver um servidor na 5173, ele é reaproveitado (`reuseExistingServer`). O `--strictPort` faz o Vite falhar em vez de "pular" para outra porta, que o teste não saberia achar.

Com `baseURL`, o teste escreve só `page.goto('/')`.

### 5. Contraste WCAG calculado no teste

As **WCAG** (diretrizes de acessibilidade da web) pedem, no nível AA, contraste de pelo menos **4,5:1** entre texto normal e fundo (3:1 para texto grande). A razão vai de 1:1 (mesma cor) a 21:1 (preto no branco).

O teste lê a cor real do texto e do fundo no navegador (`getComputedStyle`), calcula a **luminância relativa** de cada uma (a fórmula da WCAG, que pesa mais o verde porque o olho é mais sensível a ele) e faz `(clara + 0,05) / (escura + 0,05)`. A página tem `#1a1a1a` sobre `#ffffff`, cerca de **17:1**. Quando o tema da T-007 trocar as cores, esse teste avisa se alguma combinação ficar ilegível.

### 6. `expectTypeOf`: um teste que roda no compilador

`apps/web/src/compartilhamento.test.ts` e `apps/api/src/compartilhamento.spec.ts` provam que o tipo `Projeto` chega do `packages/shared`:

```ts
import type { Projeto } from '@site-apresentacao/shared';
expectTypeOf<Projeto>().toHaveProperty('titulo').toEqualTypeOf<string>();
```

Ao rodar, `expectTypeOf` **não faz nada**: o Vitest tira os tipos sem conferi-los, e `import type` some do JavaScript. Quem confere é o TypeScript no `npm run build` (`tsc --noEmit` na API, `tsc -b` no front, que checam os testes também). Ou seja: se o tipo quebrar, **`npm test` continua verde e o `npm run build` fica vermelho**. Por isso a suíte completa inclui o build.

## Por que importa

- Cada tipo pega uma classe de erro diferente: lógica (unitário), contrato HTTP (rota), experiência real em telas diferentes (e2e), formato dos dados entre front e API (`expectTypeOf`).
- No projeto, testes são parte do Definition of Done e a base do TDD do dev.
- Buscar por papel e medir contraste deixam a acessibilidade **automática**, em vez de uma checagem que alguém precisa lembrar de fazer.

## Como aparece no projeto

- Unitários: `apps/web/src/App.test.tsx`, `apps/web/src/compartilhamento.test.ts`, `apps/api/src/health/health.controller.spec.ts`, `apps/api/src/config/carregar-variaveis-de-ambiente.spec.ts`, `apps/api/src/compartilhamento.spec.ts`.
- Rota: `apps/api/test/health.e2e-spec.ts` (o `apps/api/vitest.config.ts` inclui `test/**/*.e2e-spec.ts`, por isso roda no `npm test`).
- E2E: `e2e/playwright.config.ts` e `e2e/testes/pagina-inicial.spec.ts`. O navegador é instalado uma vez com `npx playwright install chromium`.
- Na T-005 foram 8 testes na API, 3 no front e 8 execuções do Playwright. O qa também fez uma **mutação manual**: uma cópia esperando `lang="en"` falhou como devia, provando que o teste não passa "à toa".

## Exemplo

Os três tipos olhando o mesmo `<h1>`:

```
unitário (jsdom)  getByRole('heading', { level: 1, name: 'George Siqueira' })   existe?
e2e (Chromium)    o mesmo papel, agora visível na tela, inteiro na largura do celular e do desktop,
                  com contraste ≥ 4,5:1
rota (API)        não vê o <h1>: confere o outro lado do sistema, GET /api/health → 200 + JSON
```

## Para aprofundar

- **Exercício (unitário)**: em `App.tsx`, troque o `<h1>` por `<div>` e rode `npm test -w apps/web`. Leia a mensagem da Testing Library: ela lista os papéis que encontrou. Desfaça depois.
- **Exercício (e2e)**: rode `npx playwright test --config e2e/playwright.config.ts --ui` e assista aos testes nos dois tamanhos de tela. Depois mude a cor do texto em `index.css` para `#aaaaaa` e veja o teste de contraste falhar. Desfaça.
- **Exercício (tipos)**: em `compartilhamento.test.ts`, troque `toEqualTypeOf<string>()` por `toEqualTypeOf<number>()`. Rode `npm test` (passa!) e depois `npm run build` (falha). Explique por quê.
- **Pergunta**: por que o teste de rota usa `criarApp()` em vez de montar só o `HealthModule` como no teste unitário?
- **Pesquisa**: o que é `@axe-core/playwright`? O qa sugeriu como próximo passo de acessibilidade (seria dependência nova, então decisão do George).

## Links

- Tarefa: [[docs/03-tarefas/T-005-monorepo-base]]
- ADR: [[docs/02-arquitetura/ADR-0001-stack]]
- Relacionadas: [[mapa-do-monorepo]], [[nestjs-modulos-controllers-e-bootstrap]], [[vite-react-e-css-modules]], [[verificar-antes-de-concluir]]
