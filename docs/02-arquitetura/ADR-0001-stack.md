---
tipo: adr
numero: ADR-0001
status: aceita
data: 2026-10-10
---

# ADR-0001 — Stack da v1

## Contexto

Os [[docs/01-requisitos/requisitos|requisitos da v1]] pedem uma página única responsiva com seções estáticas e uma API própria de projetos (arquivo curado + dados vivos do GitHub, com cache e fallback), hospedagem com custo zero e textos separados do código. A [[docs/00-visao/visao|visão]] prevê evolução para várias páginas, banco de dados, autenticação e hospedagem paga na v2.
O projeto também é trilha de aprendizado: a separação clara entre front e API é central.

Decisões tomadas pelo George em duas rodadas (`apresentar-decisao`) em 2026-10-10. Abaixo, cada decisão com as opções avaliadas.

## Opções e decisões

### 1. Front-end — **React + Vite + TypeScript**
| Opção | Prós | Contras |
|---|---|---|
| **React + Vite + TS** ✔ | Mais pedido em vagas; ensina fundamentos (componentes, estado, consumo de API); evolução natural para rotas na v2 | SEO só por metadados no `index.html`; mais JS no navegador; muitas escolhas a fazer |
| Astro + TS | Ótimo desempenho/SEO; conteúdo e i18n nativos; aceita React | Menos comum em vagas; dois modelos mentais; consumo de API menos central |
| Next.js + TS | Muito pedido; SEO e rotas prontos | Back-end embutido tenta a pular a API separada; muitos conceitos; mais "mágica" |

### 2. Back-end — **Node.js + TypeScript com NestJS**
| Opção | Prós | Contras |
|---|---|---|
| Express | Mais material e vagas; simples | Tipagem e validação via bibliotecas extras |
| Fastify | TS e validação por schema nativos; Swagger | Menos material; menos vagas |
| **NestJS** ✔ | Estrutura forte (módulos, injeção de dependência); valorizado em empresas; escala para a v2 | Pesado para a v1; muitos conceitos; decorators escondem fundamentos |

Linguagem Node.js + TS (em vez de C#/.NET ou Python/FastAPI) para ter um só ecossistema e tipos compartilhados com o front.

### 3. Arquitetura e repositório — **API como monolito modular + monorepo com npm workspaces**
| Opção | Prós | Contras |
|---|---|---|
| **API monolito modular (módulos NestJS por domínio) + `apps/web`, `apps/api`, `packages/shared` em npm workspaces** ✔ | Padrão do NestJS; compatível com front e API em deploys separados; domínios novos viram módulos | Conceito de workspaces; dois deploys; mais pastas |
| Um único app (NestJS serve o React) | Um deploy, sem CORS | Site inteiro "dorme" no plano gratuito — quebra o RNF-03; mistura deploys |
| Um só `package.json` com `src/web`, `src/api`, `src/shared` | Uma instalação | Dependências misturadas; builds/deploys separados trabalhosos |

### 4. Hospedagem v1 — **Cloudflare Pages (front) + Render plano gratuito (API)**
| Opção | Prós | Contras |
|---|---|---|
| **Cloudflare Pages + Render** ✔ | Front estático rápido e sem restrição comercial; API Node real; partida a frio coberta pelo RNF-03 | 1ª visita após inatividade espera ~1 min pelos projetos; duas plataformas; Render não recomenda o gratuito para produção |
| Vercel (front + funções) | Simples; partida a frio curta | Plano Hobby restrito a uso não comercial (seção Serviços); API vira serverless |
| Cloudflare Pages + Workers | Sem partida a frio | Workers não é Node (sem NestJS); limite de 10 ms de CPU por requisição |

Pesquisa de planos gratuitos verificada em setembro de 2026 (fontes ao final).

### 5. Estilização — **CSS Modules + variáveis de CSS**
| Opção | Prós | Contras |
|---|---|---|
| **CSS Modules + variáveis** ✔ | Aprende CSS de verdade; variáveis atendem o RNF-04; nativo no Vite | Mais CSS à mão; sem design system pronto |
| Tailwind CSS | Rápido; pedido no mercado | Esconde fundamentos; muitas classes no HTML |
| Biblioteca de componentes | Componentes prontos e acessíveis | "Cara de template"; aprende a biblioteca, não CSS |

### 6. Testes — **Vitest + Testing Library + Supertest + Playwright**
| Opção | Prós | Contras |
|---|---|---|
| **Vitest + Testing Library (unitários) + Supertest (rotas da API) + Playwright (aceitação/e2e)** ✔ | Cobre a divisão dev (unitário) / qa (aceitação); integra com Vite/TS; navegador real (celular, teclado) | Quatro ferramentas; Playwright pesa no CI |
| Jest + Testing Library + Supertest, sem e2e | Conhecido; mais leve | Integra pior com Vite/TS; aceitação manual |
| Só Vitest agora | Simples | QA sem aceitação automatizada; contraria o RNF-09 |

## Decisão

Escolhida pelo George: React + Vite + TS no front; NestJS (Node + TS) como monolito modular na API; monorepo com npm workspaces (`apps/web`, `apps/api`, `packages/shared`); Cloudflare Pages + Render (gratuito); CSS Modules + variáveis de CSS; Vitest, Testing Library, Supertest e Playwright.

## Consequências

- **Estrutura:** `apps/web/` (React), `apps/api/` (NestJS, um módulo por domínio — v1: `projetos` e `github`), `packages/shared/` (tipos compartilhados, ex.: `Projeto`), `e2e/` (Playwright).
- **Áreas por caminho** (atualizar o `AGENTS.md`): dev → `apps/**` e `packages/**` (incluindo testes unitários `*.spec.ts`/`*.test.ts(x)` junto do código); qa → `e2e/**` e testes de rotas da API (`apps/api/test/**`); devops → plataforma (inalterado) + configs de deploy e CI.
- **Partida a frio:** o front nunca bloqueia o conteúdo estático esperando a API (RNF-03); a seção Projetos mostra estado de carregamento.
- **CORS:** a API aceita só a origem do front publicado (RNF-05).
- **Segredos:** token do GitHub só em variável de ambiente no Render.
- **v2:** a troca para hospedagem paga remove a partida a frio; banco, autenticação e contato entram como novos módulos NestJS.
- **Desbloqueia:** a [[docs/03-tarefas/T-001-hooks-restricao-escrita|T-001]] (as pastas agora estão definidas).

## Fontes da pesquisa de hospedagem

- https://flaviocopes.com/hosting-free-tiers/ (verificado em setembro de 2026)
- https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026
- https://agentdeals.dev/vendor/render
