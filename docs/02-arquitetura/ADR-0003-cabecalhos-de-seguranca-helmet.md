---
tipo: adr
numero: ADR-0003
status: aceita
data: 2026-10-17
---

# ADR-0003 — Cabeçalhos de segurança HTTP na API com o pacote `helmet`

## Contexto

O pente-fino da T-016 achou o BUG-Q5 (tarefa [[docs/03-tarefas/T-026-cabecalhos-de-seguranca-api|T-026]]): as respostas da API (NestJS sobre Express) trazem `X-Powered-By: Express`, que anuncia a tecnologia do servidor, e não trazem `X-Content-Type-Options: nosniff`, que impede o navegador de "adivinhar" o tipo do conteúdo. O RNF-05 (segurança) pede boas práticas na API. A [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]] não prevê biblioteca para isso, e qualquer dependência nova é decisão do George.

## Opções

### A) Pacote `helmet` como middleware da API
- ✅ Um conjunto de cabeçalhos de segurança mantido pela comunidade e citado na documentação do NestJS (`nosniff`, remoção do `X-Powered-By`, `X-Frame-Options`, `Referrer-Policy` e outros)
- ✅ Uma linha em `criarApp()`, que vale para todas as rotas, atuais e futuras
- ✅ Atualizações de segurança chegam pela própria dependência
- ❌ Dependência nova no `apps/api` (mais um pacote para manter e auditar)
- ❌ Traz cabeçalhos que uma API JSON quase não usa (ex.: `Content-Security-Policy` padrão), que precisam ser entendidos e, se preciso, ajustados
- ❌ O comportamento padrão pode mudar entre versões maiores

### B) Ajuste manual no Express
- ✅ Nenhuma dependência nova
- ✅ Só os dois cabeçalhos pedidos, explícitos no código (`app.disable('x-powered-by')` e um middleware com `nosniff`)
- ✅ Fácil de ler e de testar
- ❌ Cada cabeçalho de segurança futuro tem de ser lembrado e escrito à mão
- ❌ Fácil esquecer boas práticas que o `helmet` já traz
- ❌ Código próprio para algo que a comunidade já resolve

### C) Cabeçalhos na camada de hospedagem (Render / Cloudflare)
- ✅ Nenhum código na API
- ✅ Pode valer também para o front publicado
- ✅ Configuração centralizada no deploy
- ❌ Não vale no ambiente local nem nos testes de rota (o bug continua aparecendo neles)
- ❌ Depende da T-013 (deploy), que ainda não foi feita
- ❌ Fica fora do repositório de código (ou espalhado em arquivos de cada provedor)

## Decisão

Escolhida pelo George: **A — pacote `helmet`** ("pode fazer com a dependência nova", 2026-10-17). As opções foram formalizadas nesta ADR a partir da descrição da T-026 (que apresentava `helmet` × ajuste manual) e da alternativa de hospedagem.

## Consequências

- `helmet` entra como dependência de produção de `apps/api` e é ligado em `criarApp()`, valendo para todas as rotas e para os testes de rota.
- Os testes de rota (`apps/api/test/`) passam a conferir os cabeçalhos de segurança; os `it.fails` do BUG-Q5 em `health.e2e-spec.ts` viram testes normais.
- Os cabeçalhos padrão do `helmet` precisam ser conferidos para uma API JSON consumida por outra origem: nenhum deles pode quebrar o CORS da T-013 nem as respostas JSON.
- O `package-lock.json` muda (regra da T-005: quem instala é o implementador; o code-reviewer confere o diff do lock).
- Mudanças de versão maior do `helmet` passam a exigir conferência dos cabeçalhos.
