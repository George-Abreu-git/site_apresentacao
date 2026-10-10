---
tipo: estudo
tarefa: T-002
tags: [orquestracao, back-end, front-end]
data: 2026-10-09
---

# Ordem entre requisitos e ADR de stack

## Conceito

- **Requisitos** descrevem **o quê** o sistema precisa fazer (funcionais, RF-XX) e **com que qualidade** (não funcionais, RNF-XX: desempenho, acessibilidade, responsividade).
- Uma **ADR** (Architecture Decision Record) registra **uma decisão de arquitetura**, com contexto, opções e consequências. A "ADR de stack" decide as tecnologias (linguagem, framework, hospedagem).

A ordem natural é **requisitos primeiro, ADR depois**: a stack é a *resposta* aos requisitos. Escolher tecnologia antes de saber o que se precisa construir é arriscado: você pode escolher algo que não atende, ou complicar demais.

## Por que importa

Exemplo: se o site precisa ser apenas estático (portfólio, sem login), uma stack simples basta. Se um requisito pedir formulário de contato com envio de e-mail, aparece a necessidade de back-end. Sem os requisitos, a comparação "3 opções, 3 prós, 3 contras" da ADR não tem critério para dizer qual opção é melhor.

Além disso, o projeto é uma **trilha de aprendizado** de front, back, API e integração: os requisitos mostram quais desses conteúdos o George vai de fato praticar.

## Como aparece no projeto

Achado **M1** da T-002:

- Existem só os READMEs-esqueleto em `docs/00-visao/` e `docs/01-requisitos/`; faltam `visao.md` e `requisitos.md`.
- O `AGENTS.md` fala em "visão completa: `docs/00-visao/`", que não existe ainda.
- A spec de orquestração define a ordem requisitos -> ADR de stack, mas a descrição da T-002 fala só em "antes da ADR" e o backlog liga T-001 apenas à ADR.
- Os agentes `qa` e `dev` são instruídos a ler RF/RNF; sem eles, o QA não tem de onde tirar critérios de aceite.
- Sugestão do QA: rodar a skill `levantar-requisitos` **antes** da ADR de stack e tornar a dependência explícita: **T-001 depende da ADR, que depende dos requisitos**.

Esta é uma decisão de sequência do George (o orquestrador não decide por ele).

## Exemplo

Cadeia de dependências sugerida:

```
levantar-requisitos  ->  visao.md + requisitos.md (RF/RNF)
        |
        v
ADR-0001 (stack)     ->  cria src/, define pastas de testes e infra
        |
        v
T-001 (hooks)        ->  usa as pastas para bloquear escrita por agente
```

Exemplo de requisito que influencia a stack: "RNF: carregar em menos de 2 s no celular" -> favorece páginas estáticas/SSG; "RF: formulário de contato" -> exige algum back-end ou serviço externo.

## Para aprofundar

- Exercício: escreva 3 RF e 2 RNF candidatos para o site e diga qual impacto cada um teria na escolha da stack.
- Pergunta: qual a diferença entre um requisito e uma decisão de arquitetura? ("o quê" vs. "como")
- Pergunta: o que acontece com a ADR se um requisito mudar depois? (Dica: ADR substituída, não apagada.)

## Links

- Tarefa: [[docs/03-tarefas/T-002-qa-revisa-arquivos-antes-adr]]
- Relacionadas: [[areas-por-caminho-de-escrita]], [[revisao-de-consistencia-documental]]
