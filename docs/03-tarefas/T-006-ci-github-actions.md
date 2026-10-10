---
id: T-006
titulo: CI no GitHub Actions (validador e testes a cada push)
status: concluida
modo: agente-faz
tags: [infra]
rodadas: 0
criada: 2026-10-10
---

# T-006 — CI no GitHub Actions (validador e testes a cada push)

## Descrição

Pipeline de integração contínua que roda em cada push e pull request para `main`.

## Critérios de aceite

- [x] Workflow em `.github/workflows/ci.yml` com etapas: instalar dependências, `python3 scripts/validar_estrutura.py`, `npm run lint`, `npm test`, `npm run test:e2e`
- [x] Cache de dependências npm
- [x] Cada etapa comentada explicando o que faz (didático)
- [ ] Pipeline verde no GitHub após o push — *pendente: o George confirma na aba Actions (D1)*

## Contexto relevante

- Depende de: T-005
- [[docs/02-arquitetura/ADR-0001-stack|ADR-0001]]
- [[docs/03-tarefas/T-005-monorepo-base|T-005]]

## Decisões

- 2026-10-10 — George: backlog inicial aprovado; modo definido pelo plano de aprendizado (exemplos `agente-faz` em T-007 e T-010; integração e seções em `eu-faco`).
- 2026-10-10 — George delegou ao orquestrador as decisões das tarefas T-005, T-006, T-001 e T-007 (ver T-005). Decisões abaixo marcadas "decidido pelo orquestrador (delegação)", para revisão do George.
- 2026-10-10 — **D1 — Como verificar o critério "pipeline verde no GitHub" (decidido pelo orquestrador, delegação).** O repositório é privado (a API pública devolve 404) e o `gh` não está instalado, então o orquestrador não consegue ler o status do Actions.
  - **A) Simular o CI localmente (instalação limpa com `npm ci` + os mesmos comandos do workflow + checagem da sintaxe do YAML), integrar em `main` e deixar a confirmação "verde no GitHub" para o George**
    - ✅ A sequência T-006 → T-001 → T-007 continua sem esperar. ✅ Os mesmos comandos já passam localmente, o que reduz muito o risco de vermelho. ✅ O próprio push em `main` dispara o CI, que o George vê ao acordar.
    - ❌ O critério 4 fica pendente de confirmação humana. ❌ Diferenças de ambiente (Ubuntu × Windows) só aparecem no GitHub. ❌ Se ficar vermelho, a correção vem depois do merge.
  - **B) Enviar a branch ao GitHub e esperar o George confirmar antes do merge**
    - ✅ Nada vai para `main` sem o CI confirmado. ✅ Segue a letra do critério. ✅ Diferenças de ambiente aparecem antes do merge.
    - ❌ Trava a sequência até o George acordar. ❌ A T-001 e a T-007 dependem de `main` atualizada. ❌ Perde a noite de trabalho delegada.
  - **C) Usar a credencial salva do git para consultar a API do GitHub**
    - ✅ Verificação automática, sem esperar ninguém. ✅ Critério fechado pelo próprio fluxo. ✅ Detecta vermelho na hora.
    - ❌ Manusear um segredo do George sem autorização explícita. ❌ Risco de vazar o token em logs. ❌ Contraria o RNF de segredos e a regra de não decidir sobre credenciais.
  - **Escolha: A.** Mantém o ritmo pedido sem tocar em credenciais. O critério 4 fica **sem marcar** até o George confirmar no GitHub; o resto da tarefa segue o fluxo normal. Se o CI ficar vermelho, a correção vira prioridade antes de qualquer outra tarefa.
- 2026-10-10 — **D2 — Checagem de tipos no CI (decidido pelo orquestrador, delegação).** O devops notou que o CI não confere os tipos do TypeScript. Isso inclui a prova de compartilhamento do tipo `Projeto` da T-005 (`expectTypeOf`), que **só falha no `npm run build`** — com `npm test` verde.
  - **A) Acrescentar a etapa `npm run build` ao CI agora (antes dos testes)**
    - ✅ Pega erros de tipo que lint e testes não veem, inclusive a prova do `Projeto`. ✅ O script já existe e passa; custo de alguns segundos. ✅ Valida também que o front e a API compilam para produção (pré-requisito do deploy da T-013).
    - ❌ Uma etapa a mais em cada execução. ❌ Pequena ampliação do escopo da T-006. ❌ Mais um passo a manter.
  - **B) Deixar para uma tarefa futura**
    - ✅ Escopo da T-006 intacto. ✅ Zero atraso. ✅ Pode ser decidido junto com outras melhorias do CI.
    - ❌ A `main` pode receber erro de tipo com o CI verde. ❌ A prova do `Projeto` fica sem guarda automática. ❌ Vira pendência fácil de esquecer.
  - **C) Criar scripts `typecheck` (`tsc --noEmit`) em cada workspace e rodá-los no CI**
    - ✅ Checa só tipos, sem gerar `dist/`. ✅ Separa "compilar" de "checar". ✅ Pode ser um pouco mais rápido.
    - ❌ Scripts novos em `apps/**`/`packages/**` (área do dev) e na raiz — mais gente envolvida. ❌ Duplica parte do que o `build` já faz. ❌ Não valida o build de produção.
  - **Escolha: A.** É barato, usa o que já existe e fecha uma brecha real (a prova de tipos da T-005 só é checada no build). O devops acrescenta a etapa antes da revisão.
- 2026-10-10 — **D3 — Extras e opcionais da revisão (decidido pelo orquestrador, delegação).** O code-reviewer aprovou, recomendou aceitar os extras do devops (upload do relatório do Playwright em falha; nome do job) e listou 4 opcionais: (2) validador antes do `npm ci`; (3) `concurrency` cancelando execuções antigas; (4) linha sobre o CI no README; (5) fixar actions por SHA.
  - **A) Aceitar os extras e aplicar 2–4 agora, antes do QA; deixar 5 para o futuro**
    - ✅ `concurrency` poupa minutos do repositório privado. ✅ Validador antes do `npm ci` falha mais cedo, coerente com o cabeçalho "do mais rápido ao mais lento". ✅ README passa a apontar para o CI (projeto didático).
    - ❌ Mais uma ida ao devops. ❌ Mudanças depois da revisão não voltam ao code-reviewer. ❌ Pequena ampliação do escopo.
  - **B) Aceitar os extras e não aplicar nenhum opcional**
    - ✅ Zero atraso. ✅ Escopo intacto. ✅ Revisão aprovada como está.
    - ❌ Execuções sobrepostas gastam minutos. ❌ Validador roda depois de instalar 441 pacotes. ❌ README sem menção ao CI.
  - **C) Aplicar todos, inclusive SHA fixo nas actions**
    - ✅ Máxima segurança na cadeia de fornecimento. ✅ Tudo resolvido de uma vez. ✅ Nada pendente.
    - ❌ SHA fixo exige atualizar à mão a cada versão nova (manutenção chata num projeto didático). ❌ Menos legível para quem estuda. ❌ Escopo maior.
  - **Escolha: A.** Os três opcionais são baratos e melhoram custo e clareza; o QA roda tudo de novo sobre o resultado final. SHA fixo fica como endurecimento futuro.

## Dev

## Revisão

### Rodada 1

**Resultado:** APROVADO — o `ci.yml` atende os critérios 1 a 3 e as decisões D1 e D2; critério 4 pendente pela D1.
- **Workflow:** gatilhos push/PR para `main` (pushes em `feat/*` sem PR não disparam, coerente com o merge local + push); `permissions: contents: read`; sem segredos; actions na v7 (maior tag, conferida com `git ls-remote`); Node `'24'` = `engines`; ordem `npm ci` → validador → lint → build → testes → `playwright install --with-deps chromium` → e2e; timeout 15 min; upload em falha com `if: failure()` e `if-no-files-found: ignore`, caminhos batendo com a config do Playwright; lock não alterado.
- **Extras do devops:** upload do relatório (só lê, sem segredos, retenção de 7 dias; com `trace: 'on-first-retry'` e 2 repetições no CI o rastro é gerado) e nome do job (sem efeito, não há proteção de branch) — recomenda aceitar.
- **Área:** `.github/**` do devops; README da raiz por precedente (Q1-B da T-005).
- **Verificações:** validador OK; PyYAML leu as 10 etapas; UTF-8 sem BOM, LF; `npm run lint` OK.

**Opcionais:** (2) validador antes do `npm ci`; (3) `concurrency` (`group: ci-${{ github.ref }}`, `cancel-in-progress: true`); (4) linha sobre o CI no README; (5) actions por SHA. Ver D3.

## QA

### Rodada 1

**Resultado:** PASSOU — critérios 1 a 3 atendidos; critério 4 pendente para o George (D1).

**Simulação** (clone limpo de `feat/T-006-ci-github-actions` @ `87603b0` fora do repositório, `CI=true`, ordem do `ci.yml`; Node 24.21.0, npm 11.19.0, Python 3.14.7): validador OK → `npm ci` (0 vulnerabilidades) → lint OK (3 workspaces + raiz) → build OK (shared `tsc`; api `tsc --noEmit && nest build`; web `tsc -b && vite build`) → `npm test` (api 8/8, web 3/3) → Chromium com `--with-deps` OK → `npm run test:e2e` 8/8. Pastas temporárias apagadas; repositório limpo.

**Critérios:** (1) 10 etapas lidas pelo PyYAML; gatilhos push/PR para `main`, `permissions: contents: read`, `concurrency`, timeout 15; ordem com validador antes do `npm ci` (D3) e build (D2); tags v7 existentes. (2) `cache: npm` com Node `'24'`. (3) cabeçalho e todas as etapas comentados em português; README com seção do CI. (4) pendente (repositório privado, sem `gh`).

**Outras verificações:** nenhum segredo (busca por `ghp_`, `github_pat_`, `token=`, `password`, `secret` só achou o comentário explicativo); UTF-8 sem BOM, LF; diff só em `.github/workflows/ci.yml`, `README.md` e `docs/03-tarefas/**`. Sem testes novos (workflow não é testável com Playwright/Supertest; aceitação pela simulação).

**Pendência:** a simulação rodou no Windows; o Ubuntu (`python3` do sistema, bibliotecas do `--with-deps`) só é exercitado no GitHub — se o check ficar vermelho, a correção vira prioridade (D1).

## Estudo

## DevOps

### Rodada 1

**Resultado:** CONCLUIDO — `.github/workflows/ci.yml` criado e simulado localmente, tudo verde; critério 4 sem marcar (D1).

**Workflow:** gatilhos push e pull request para `main`; `permissions: contents: read`; um job em `ubuntu-latest` com `timeout-minutes: 15` (minutos gratuitos do repositório privado). Etapas comentadas em português: (1) checkout; (2) `actions/setup-node@v7` com Node `'24'` (do `engines`) e `cache: npm` (chave pelo `package-lock.json`); (3) `npm ci`; (4) `python3 scripts/validar_estrutura.py`; (5) `npm run lint`; (6) `npm test`; (7) `npx playwright install --with-deps chromium`; (8) `npm run test:e2e`; (9) só em falha, `actions/upload-artifact@v7` guarda o relatório do Playwright por 7 dias (não pedido; para diagnóstico). `checkout`, `setup-node` e `upload-artifact` na v7 (maior tag publicada, conferida com `git ls-remote`; `action.yml` em node24). Sem segredos. Sem `npm run build`: no clone limpo, lint e testes passaram sem o `dist/` do shared (importado só com `import type`) — comentado na etapa 6.

**Verificação:** YAML lido sem erro pelo PyYAML (instalado em pasta temporária) e `actionlint` 1.7.12 sem apontamentos (shellcheck não roda no Windows). Simulação num clone limpo da branch, fora do repositório, com `CI=true`, na ordem do workflow: `npm ci` (441 pacotes), validador OK, lint 0 erros, `npm test` (api 8/8, web 3/3), Chromium instalado, `npm run test:e2e` 8/8. Pastas temporárias apagadas; validador do repositório OK; UTF-8 sem BOM.

**README:** `npx playwright install` → `npx playwright install chromium` (pendência 1 da T-005).

Arquivos: `.github/workflows/ci.yml` (novo), `README.md`.

**Pendências:**
1. Critério 4: o George confirma na aba Actions depois do push em `main` (D1).
2. (sugestão) O CI não confere tipos do TypeScript (Vitest não checa tipos; o lint não usa informação de tipos); `npm run build` (que roda `tsc`) pegaria esses erros — ver D2.
3. Simulado no Windows; o Ubuntu (e o `--with-deps` instalando bibliotecas do Linux) só é exercitado no GitHub.

### Ajuste pela decisão D2 (não conta rodada)

**Resultado:** CONCLUIDO — etapa 6 "Build (checagem de tipos)" (`npm run build`) depois do lint e antes de `npm test`, com comentário explicando que o `tsc` pega erros de tipo que lint e Vitest não veem (inclusive a prova `expectTypeOf` do `Projeto` da T-005) e confirma que front e API compilam para produção. Comentário da etapa de testes ajustado ("não dependem da etapa de build"); cabeçalho e numeração (etapas 7 a 10) atualizados. Fora do pedido: o nome do job passou a "Validador, lint, build e testes" (muda o nome do check no GitHub; só importa se houver proteção de branch com o nome antigo).

**Verificação (D2):** `npm run build` local com código 0 (shared `tsc`; api `tsc --noEmit && nest build`; web `tsc -b && vite build`); PyYAML leu as 10 etapas na ordem; actionlint 1.7.12 sem apontamentos; validador OK; UTF-8 sem BOM. Arquivo: `.github/workflows/ci.yml`.

### Ajuste pela decisão D3 (não conta rodada)

**Resultado:** CONCLUIDO — opcionais 2–4 aplicados; actionlint 1.7.12 sem apontamentos, PyYAML leu as 10 etapas e o `concurrency`, validador OK, UTF-8 sem BOM e LF.
- **Validador primeiro:** virou a etapa 2, logo após o checkout e antes também do `setup-node` (um passo além do pedido, para falhar ainda mais cedo); conferido que `validar_estrutura.py` só usa `argparse`, `sys` e `pathlib` e lê `.md` em `docs/`. Cabeçalho (ordem, motivo, lista de reprodução local) e numeração 1–10 atualizados.
- **`concurrency`:** `group: ci-${{ github.ref }}` e `cancel-in-progress: true`, com comentário sobre `github.ref` em push e PR e a economia de minutos.
- **README:** seção "Integração contínua (CI)" depois de "Comandos", apontando para o workflow e para a reprodução local.

Arquivos: `.github/workflows/ci.yml`, `README.md`. SHA fixo nas actions fica para o futuro (D3).

## Log

- 2026-10-10 — tarefa criada
- 2026-10-10 — orquestrador: início — implementador devops (tag `infra`); D1 (delegação): simular CI localmente e deixar a confirmação no GitHub para o George
- 2026-10-10 — orquestrador: **pausada a pedido do George** (ajuste no fluxo dos subagentes); devops interrompido antes de alterar arquivos; agendamento de retomada cancelado. Retomar do passo 1 (devops) com `/executar-tarefa T-006`.
- 2026-10-10 — orquestrador: **retomada** após a T-014 (branch rebaseada sobre a `main` com o fluxo novo: a tarefa termina quando o QA passa e o documentador roda em paralelo); devops chamado do passo 1
- 2026-10-10 — devops: CONCLUIDO — `ci.yml` criado; simulação local verde (lint, 8+3 unitários, e2e 8/8); YAML conferido com PyYAML e actionlint
- 2026-10-10 — orquestrador: D2 (delegação) — acrescentar `npm run build` ao CI; devops volta antes da revisão (não conta rodada)
- 2026-10-10 — devops: CONCLUIDO — etapa de build no CI; build local, actionlint e validador OK
- 2026-10-10 — code-reviewer: APROVADO — critérios 1–3, D1 e D2 atendidos; extras aceitáveis; 4 opcionais
- 2026-10-10 — orquestrador: D3 (delegação) — aceitar extras e aplicar opcionais 2–4 antes do QA
- 2026-10-10 — devops: CONCLUIDO — validador primeiro, `concurrency` e seção do CI no README; actionlint e validador OK
- 2026-10-10 — qa: PASSOU — simulação do workflow num clone limpo com `CI=true`, todas as etapas verdes; critério 4 pendente (D1)
- 2026-10-10 — orquestrador: concluida — verificação verde (`npm test`, `npm run test:e2e` 8/8, validador); critério 4 aguarda a confirmação do George no GitHub; diário de estudo disparado após a integração
