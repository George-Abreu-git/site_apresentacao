---
id: T-012
titulo: Front: cards de projetos consumindo a API
status: em-qa
modo: agente-faz
tags: [front-end, api]
rodadas: 1
criada: 2026-10-10
---

# T-012 — Front: cards de projetos consumindo a API

## Descrição

A seção Projetos busca `GET /api/projetos` e mostra os cards. Modo `agente-faz` (decisão do George em 2026-10-15; originalmente `eu-faco`, pois integração front ↔ API é o centro do aprendizado — o aprendizado fica no diário de estudo).

## Critérios de aceite

- [ ] RF-05: cards com título, descrição, stacks, links e dados vivos quando presentes
- [ ] RNF-03: estado de carregamento enquanto a API responde (inclusive partida a frio de ~1 min); o resto da página não espera
- [ ] Falha da API → mensagem amigável, sem quebrar a página
- [ ] URL da API configurável por variável de ambiente do Vite
- [ ] Testes unitários com a API simulada e e2e com sucesso, carregamento e falha

## Contexto relevante

- Depende de: T-011, T-007
- [[docs/01-requisitos/requisitos|Requisitos]]
- [[docs/03-tarefas/T-011-api-modulo-github|T-011]]
- [[docs/03-tarefas/T-007-layout-base|T-007]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).
- 2026-10-15 — George: todas as tarefas restantes do backlog seguem em modo `agente-faz` (o dev implementa).
- 2026-10-15 — George: Q1 (e2e instável na verificação do encerramento) → **A**: devolver ao qa para simular a API nos testes que abrem a página inteira, sem enfraquecer a checagem de erros no console; conta 1 rodada.

## Dev

### Rodada 1

Resultado: CONCLUIDO
Resumo: A seção Projetos busca `GET /api/projetos` (`src/api/projetos.ts`, endereço em `VITE_API_URL`, padrão `http://localhost:3000`) por um hook (`useProjetos`) com três estados: carregando, carregado e erro; a requisição é cancelada se a seção sair da tela. Cada projeto vira um `CartaoDeProjeto` com título, descrição, stacks, links (nova aba) e dados vivos (linguagem, estrelas, última atualização) quando presentes. O aviso de carregamento (menciona a demora de até um minuto), erro ou lista vazia fica num `role="status"` sempre presente. As outras seções não esperam a API (teste do App com API que nunca responde). Todos os textos novos no conteúdo (RF-09), cores só nas variáveis do tema. Unitários (web 74, API 142, hooks 412), build e lint verdes; conferido no navegador com API simulada (390px e 1440px, sem rolagem horizontal). e2e: 113 passaram, 2 falharam (pendência 1), 7 pulados.
Arquivos alterados:
- `apps/web/.env.example`, `apps/web/src/vite-env.d.ts` (novos)
- `apps/web/src/api/` (novos): `endereco-da-api.ts`, `projetos.ts` e testes
- `apps/web/src/componentes/CartaoDeProjeto/` e `Projetos/` (novos, com `useProjetos.ts`)
- alterados: `App.tsx`, `App.test.tsx`, `configurar-testes.ts` (por padrão o `fetch` nunca responde), `conteudo/tipos.ts`, `conteudo/pt-BR.ts` (bloco `projetos` e `geral.localidade`), `secoes.ts`, `secoes.test.ts` (`idDoTituloDaSecao`), `componentes/Secao/Secao.tsx`
- removido: `apps/web/src/compartilhamento.test.ts` (o próprio comentário previa a remoção quando a T-012 usasse `Projeto`)
Pendências:
1. (qa) `e2e/testes/secoes-estaticas.spec.ts`, "cada texto do arquivo de conteúdo aparece na página", falha: os textos de Projetos dependem do estado da API e `geral.localidade` não é visível. Excluir `ptBR.projetos` e `ptBR.geral.localidade` desse teste (ou conferir por estado). e2e de sucesso, carregamento e falha também são do qa (`page.route('**/api/projetos', ...)`).
2. (devops / George) No deploy, cadastrar `VITE_API_URL` no Cloudflare Pages com o endereço da API no Render (valor público, entra no build).
3. (George, informativo) `imagem` não aparece no card (RF-05 não pede); não há "tentar de novo" nem tempo limite próprio na requisição.
Decisão pendente: nenhuma
Conceitos para estudo: `fetch` e `response.ok`; `useEffect` com limpeza; `AbortController` (e StrictMode); custom hook; união discriminada para estados da busca; variáveis de ambiente do Vite (`import.meta.env`, prefixo `VITE_`); região viva (`role="status"`); `<article>`, `<dl>`, `<time dateTime>`; `useId`; `Intl.NumberFormat`/`Intl.DateTimeFormat`; `vi.stubGlobal`, `vi.stubEnv`, `findBy*`; CSS Grid mobile-first e `margin-top: auto`.
Commit: `feat(web): adiciona cards de projetos consumindo GET /api/projetos`

## Revisão

### Rodada 1

Resultado: APROVADO
Resumo: O diff do dev atende RF-05, RNF-03, a falha amigável e a URL por `VITE_API_URL`, com unitários de sucesso, carregamento, erro, lista vazia e cancelamento. Testes (web 74, API 142, hooks 412), lint e build do web verdes. O dev mexeu só em `apps/web/**` (remoção de `compartilhamento.test.ts` correta), sem segredos e sem mudança no lock. Nada bloqueante.
Arquivos alterados: nenhum
Pendências:
1. (qa) Ajustar o e2e de RF-09 em `e2e/testes/secoes-estaticas.spec.ts` (deixar de fora `ptBR.projetos` e `ptBR.geral.localidade`) e criar os e2e de sucesso, carregamento e falha com `page.route`.
2. (orquestrador / George) A API não tem CORS (`apps/api/src/criar-app.ts`): localmente o front real (5173) não consegue chamar a API real (3000). Registrar na T-013 que `CORS_ORIGIN` deve aceitar também a origem de desenvolvimento.
3. (devops) Cadastrar `VITE_API_URL` no Cloudflare Pages (T-013).
4. *opcional* — `CartaoDeProjeto.tsx:76`: data inválida lança `RangeError` e derruba a página (sem Error Boundary).
5. *opcional* — `Projetos.tsx:44`: `key={projeto.titulo}` pode repetir.
Decisão pendente: nenhuma
Conceitos para estudo: CORS entre origens de desenvolvimento e `enableCors` no NestJS; variáveis `VITE_` públicas; Error Boundary; `key` estável; `AbortController` na limpeza do `useEffect`.

## QA

### Rodada 1

Resultado: PASSOU
Resumo: Os 5 critérios de aceite foram validados com e2e novos em `e2e/testes/projetos.spec.ts` (46 testes, celular e desktop), com a API simulada por `page.route`: cards completos e parciais na ordem da API, carregamento com as outras seções já na tela (inclusive 90 s simulados de partida a frio), cinco tipos de falha com mensagem amigável e sem erro de JavaScript, lista vazia, 1/2/3 colunas sem rolagem horizontal, teclado, contraste e região viva. A troca de URL por `VITE_API_URL` foi conferida num servidor Vite separado (teste temporário, apagado). O teste de textos de RF-09 foi ajustado para deixar de fora `projetos` e `geral.localidade`. Suítes: e2e 161 passaram e 7 pulados; unitários web 74, API 142, hooks 412; lint e validador verdes.
Arquivos alterados:
- `e2e/testes/projetos.spec.ts` (novo)
- `e2e/testes/secoes-estaticas.spec.ts`
Pendências:
1. (George / dev, opcional) Data inválida em `github.ultimaAtualizacao` lança "Invalid time value" em `CartaoDeProjeto.tsx` e apaga a página inteira (confirmado no navegador). Só acontece fora do contrato; a API (T-011) só confere se `pushed_at` é texto. Proteção possível: tratar a data no front, validar `pushed_at` na API ou Error Boundary.
2. (T-013) Respostas simuladas pelo Playwright não passam pela checagem de CORS; a falta de CORS na API real precisa de verificação própria na T-013.
3. (devops / T-013) Cadastrar `VITE_API_URL` no Cloudflare Pages.
Decisão pendente: nenhuma
Conceitos para estudo: `page.route` e `route.fulfill`/`route.abort`; requisição pendurada com Promise; `page.clock`; `page.on('pageerror')`; seletor `:scope > li`; região viva persistente; respostas simuladas e CORS.

### Rodada 2

Resultado: PASSOU
Resumo: O e2e "carrega sem erros no console" ficou estável e nenhum e2e chama mais a API de verdade. O `test` comum de `e2e/apoio/teste.ts` simula, antes de cada teste, a API sem resposta (a seção Projetos fica no carregando e a página não muda de tamanho); quem precisa de resposta registra a própria simulação. O teste do console ficou mais rigoroso: simula 4 projetos e só confere os erros depois de os cards aparecerem. A lista vazia como padrão foi descartada: gerou 1 falha em 1.680 execuções em `navegacao.spec.ts:131` (a seção Projetos encolhia no meio da rolagem). Verificação: e2e 161 passaram e 7 pulados; com `--repeat-each=10`, 1610 passaram, 70 pulados, 0 falhas; teste do console 20/20; servidor espião na porta 3000 não recebeu nenhuma requisição; lint, unitários (web 74, API 142, hooks 412) e validador verdes.
Arquivos alterados:
- `e2e/apoio/api.ts`, `e2e/apoio/teste.ts` (novos)
- `e2e/testes/pagina-inicial.spec.ts`, `projetos.spec.ts`, `navegacao.spec.ts`, `secoes-estaticas.spec.ts`, `stacks.spec.ts`
Pendências:
1. (George / nova tarefa, fora do escopo) Abrir o site direto numa âncora com a página ainda sem carregar (ex.: `/#servicos`) não rola até a seção, no dev e no build de produção; deve vir da T-007. O e2e `navegacao.spec.ts:131` não pega porque o `beforeEach` abre `/` antes.
2. Continuam valendo as pendências da Rodada 1 (data inválida em `CartaoDeProjeto`, CORS e `VITE_API_URL` na T-013).
Decisão pendente: nenhuma
Conceitos para estudo: fixture automática do Playwright (`test.extend` com `auto: true`); ordem das rotas no `page.route`; requisição pendente como partida a frio; mudança de layout durante rolagem suave; rolagem até a âncora em SPA; servidor espião.

## Estudo

## DevOps

## Log

- 2026-10-10 — tarefa criada
- 2026-10-15 — orquestrador: em-andamento — início no modo agente-faz por decisão do George; dev chamado
- 2026-10-15 — dev: CONCLUIDO — cards de projetos consumindo a API; 1 e2e do qa a ajustar (RF-09 x textos por estado)
- 2026-10-15 — code-reviewer: APROVADO — critérios do dev atendidos; avisos de CORS e VITE_API_URL para a T-013
- 2026-10-15 — qa: PASSOU — e2e dos cards de projetos (161 passando, 7 pulados); suíte inteira verde
- 2026-10-15 — orquestrador: aguardando-decisao — verificação do encerramento: e2e "carrega sem erros no console" (`pagina-inicial.spec.ts:59`) instável — sem API simulada, o front chama `localhost:3000` e o navegador registra `net::ERR_CONNECTION_REFUSED` (falhou em várias de 20 repetições); sem merge
- 2026-10-15 — orquestrador: em-qa — George escolheu A; rodadas = 1; qa chamado para simular a API nos e2e que abrem a página inteira
- 2026-10-15 — qa: PASSOU (rodada 2) — API simulada em todos os e2e; 0 falhas em 1.680 execuções
