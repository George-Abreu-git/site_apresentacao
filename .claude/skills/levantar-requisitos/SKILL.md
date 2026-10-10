---
name: levantar-requisitos
description: Use na sessão principal para conduzir o levantamento de requisitos do site com o George e gerar a visão e os requisitos (RF/RNF) em docs/.
---

# Levantar requisitos

Entrevista em **rodadas** (estilo grilling): pergunte numa rodada tudo o que já pode ser respondido; perguntas que dependem de respostas abertas ficam para a próxima. Quando houver escolha, use `apresentar-decisao` (3 opções × 3 prós × 3 contras).

## Temas a cobrir
1. **Público e objetivo**: quem visita (recrutadores, clientes, colegas), o que o George quer que façam.
2. **Seções/páginas**: apresentação, sobre, stacks, projetos, experiência, contato, blog?
3. **Conteúdo**: de onde vem (estático, CMS, API própria, GitHub), quem atualiza e como.
4. **Contato**: formulário, e-mail, redes; armazenamento e notificação das mensagens.
5. **Back-end e API**: o que o back-end faz de verdade (o projeto é de aprendizado de API e integração).
6. **Não funcionais**: responsividade, desempenho, acessibilidade, SEO, idiomas, tema claro/escuro, hospedagem e custo, analytics.
7. **Aprendizado**: o que o George mais quer praticar em cada área.

## Saídas
- `docs/00-visao/visao.md`: problema, público, objetivos, critérios de sucesso, fora de escopo.
- `docs/01-requisitos/requisitos.md`: `RF-01..` (com critério de aceite em cada) e `RNF-01..`.
- Mostre ao George para aprovação antes de commitar.
- Termine propondo a **ADR de stack** (rodada de `apresentar-decisao`) e uma lista inicial de tarefas para o backlog.
