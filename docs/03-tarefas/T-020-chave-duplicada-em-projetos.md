---
id: T-020
titulo: Projetos com o mesmo título não geram chave duplicada no React
status: em-revisao
modo: agente-faz
tags: [front-end, back-end]
rodadas: 0
criada: 2026-10-16
---

# T-020 — Projetos com o mesmo título não geram chave duplicada no React

## Descrição

BUG-3 da T-016, funcionalidades 5 e 6. `Projetos.tsx` usa `key={projeto.titulo}` e a validação do arquivo curado não recusa títulos repetidos; o React avisa "Encountered two children with the same key" e pode trocar ou repetir cards. Onde corrigir (chave única no front ou recusar títulos repetidos na API) é decisão do George, a apresentar na execução.

Severidade: baixa.

## Critérios de aceite

- [ ] Dois projetos com o mesmo título não geram aviso de chave duplicada nem cards trocados
- [ ] A validação do arquivo curado (`validar-projetos-curados.ts`) recusa títulos repetidos, com mensagem clara que identifica os projetos (decisão do George: corrigir na API)
- [ ] O `it.fails` do BUG-3 em `Projetos.test.tsx` continua como bug conhecido do front, com o comentário apontando para a validação na API que impede títulos repetidos (decisão do George, 2026-10-17)
- [ ] 5 cenários de teste para a mudança (unitário, rota e/ou e2e, conforme a área), seguindo o padrão do George
- [ ] Suíte inteira e validador verdes

## Contexto relevante

- Origem: [[docs/03-tarefas/T-016-pente-fino-de-testes|T-016]] (pente-fino de testes)
- [[docs/01-requisitos/requisitos|Requisitos]]

## Decisões

- 2026-10-16 — George: bugs e erros do pente-fino viram tarefas, em modo `agente-faz` (pedido de 2026-10-15).
- 2026-10-17 — George: corrigir **na API** — a validação do arquivo curado recusa títulos repetidos (a API não sobe com erro claro); o front segue usando o título como `key`.
- 2026-10-17 — George (critério 3): opção A — manter o `it.fails` do front, com o comentário apontando para a validação na API; critério 3 reescrito. Opções avaliadas: A) manter o `it.fails` e reescrever o critério; B) mudar também a `key` no front; C) apagar o `it.fails` e cobrir só na API.

## Dev

### Rodada 1

Resultado: CONCLUIDO
Resumo: A validação do arquivo curado recusa títulos repetidos com `problemasDeTitulosRepetidos`, que compara a forma normalizada (`tituloParaComparar`: sem espaços nas pontas, espaços do meio juntados, minúsculas pt-BR) e gera, na mesma mensagem dos outros problemas, uma linha por repetição: `projeto N ("título"): título repetido — o mesmo do projeto M ("título"); cada projeto precisa de um título único`. Itens sem título válido ou que não são objeto ficam fora da comparação. 9 testes unitários novos e 1 de leitura de arquivo; o teste antigo de numeração passou a usar títulos distintos, com as mesmas asserções. README do conteúdo documenta a regra; o `projetos.json` real é válido. Complemento (critério 3, opção A do George): só o comentário do `it.fails` do BUG-3 em `Projetos.test.tsx` mudou, apontando para o contrato da API. API 260 + 3 esperadas; web 186 + 1 esperada + 3 falhas do `pt-BR.ts` do George; lint verde.
Arquivos alterados:
- apps/api/src/projetos/validar-projetos-curados.ts
- apps/api/src/projetos/validar-projetos-curados.spec.ts
- apps/api/src/projetos/ler-projetos-curados.spec.ts
- apps/api/conteudo/README.md
- apps/web/src/componentes/Projetos/Projetos.test.tsx (só o comentário)
Pendências:
1. Teste de rota para título repetido, se o qa achar útil (área do qa).
2. A comparação ignora espaços e maiúsculas/minúsculas (escolha do dev, justificada: para o visitante seriam cards com o mesmo nome); comparar só textos idênticos é mudança de uma linha em `tituloParaComparar`.
Decisão pendente: nenhuma
Conceitos para estudo: validação em tempo de execução de dados `unknown`; normalização de texto (`trim`, `\s+`, `toLocaleLowerCase`); `Map` para achar duplicatas numa passada; `key` de listas no React; fail fast na inicialização; contrato entre front e API; `it.fails` como registro de bug conhecido.

## Revisão

## QA

## Estudo

## DevOps

## Log

- 2026-10-16 — tarefa criada
- 2026-10-17 — orquestrador: em-andamento — início no modo agente-faz; dev chamado (parte da API; critério 3 levado ao George)
- 2026-10-17 — George: critério 3 decidido (opção A, manter o `it.fails` do front)
- 2026-10-17 — dev: CONCLUIDO — API recusa títulos repetidos; comentário do BUG-3 aponta para a API
