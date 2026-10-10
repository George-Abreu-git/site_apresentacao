---
tipo: visao
status: aprovado
data: 2026-10-10
---

# Visão — Site de apresentação do George

## Propósito

Um site pessoal, navegável e responsivo, que apresenta o George — quem ele é, suas stacks, seus projetos e como contatá-lo.
O site tem **dois papéis**: ser a vitrine profissional do George e ser o **projeto de aprendizado** dele em front-end, back-end, API e integração entre front e back, desenvolvido com orquestração de agentes.

## Público

| Público | O que procura | O que queremos que faça |
|---|---|---|
| Recrutadores e tech leads | Competência técnica, stacks, projetos reais | Entrar em contato pelo LinkedIn ou e-mail |
| Clientes de freelance | O que o George oferece e se ele resolve o problema deles | Entrar em contato para propor um trabalho |

## Objetivos

1. Apresentar o George de forma clara e profissional para os dois públicos.
2. Mostrar projetos com texto curado e dados vivos do GitHub — o próprio site é prova de habilidade técnica.
3. Facilitar o contato (LinkedIn e e-mail).
4. Servir de trilha de aprendizado: cada parte do site é uma etapa de estudo registrada em `docs/04-estudos/`.

## Critérios de sucesso (v1)

- O site está publicado em hospedagem gratuita e acessível por link público.
- Um visitante entende em poucos segundos quem é o George, o que ele faz e como contatá-lo — no celular e no desktop.
- A lista de projetos vem da API própria, que combina o arquivo curado com dados do GitHub, e continua funcionando quando o GitHub está indisponível.
- Cada etapa passou pelo fluxo de agentes (implementação, revisão, QA, nota de estudo).

## Fases

### v1 — página única, API leve
- Página única com seções e navegação por âncoras: Início, Sobre, Stacks, Projetos, Serviços, Contato.
- API própria apenas para **projetos** (arquivo curado + dados vivos do GitHub).
- Contato por links (LinkedIn e e-mail).
- Tema escuro; textos em português, separados do código (pronto para inglês).
- Hospedagem com custo zero.

### v2 — site navegável completo (evolução planejada)
- Várias páginas com rotas, incluindo uma página por projeto (estudo de caso).
- Tema claro + escuro com alternância.
- Formulário de contato com API, banco de dados e notificação por e-mail.
- Banco de dados e painel admin com login para atualizar conteúdo.
- Hospedagem paga e domínio próprio.
- Candidatos: versão em inglês; metas formais de acessibilidade (WCAG) e desempenho (Lighthouse) com verificação no CI; página de experiência; depoimentos.

## Fora de escopo da v1

Formulário de contato, banco de dados, autenticação/painel admin, blog, analytics, cookies, currículo em PDF (o LinkedIn cumpre esse papel), versão em inglês, tema claro, domínio próprio.

## Aprendizado esperado

| Área | v1 | v2 |
|---|---|---|
| Front-end | Layout responsivo, componentes, consumo de API, estados de carregamento e erro, tema via variáveis de CSS | Roteamento, temas alternáveis, formulários |
| Back-end / API | Endpoint REST, integração com API externa (GitHub), cache, tratamento de falhas, segredos em variáveis de ambiente | Banco de dados, CRUD, autenticação, envio de e-mail |
| DevOps | Deploy gratuito, variáveis de ambiente, CI básico | Domínio e DNS, hospedagem paga, verificações automáticas de qualidade |
| Qualidade | Testes unitários e de aceitação, boas práticas de acessibilidade | Metas WCAG/Lighthouse mensuráveis |

Relacionados: [[docs/01-requisitos/requisitos|Requisitos]]
