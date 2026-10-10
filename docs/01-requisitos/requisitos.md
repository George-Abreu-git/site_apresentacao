---
tipo: requisitos
status: aprovado
data: 2026-10-10
versao-alvo: v1
---

# Requisitos — v1

Base: [[docs/00-visao/visao|Visão]]. Requisitos da v2 estão listados ao final apenas como referência; serão detalhados quando a v2 começar.

## Requisitos funcionais

### RF-01 — Página única com navegação por seções
A página tem as seções Início, Sobre, Stacks, Projetos, Serviços e Contato, com um menu que leva a cada seção.
- **Aceite:** clicar em cada item do menu leva à seção correspondente; o menu fica acessível ao rolar a página; no celular o menu é compacto (ex.: botão que abre a lista).

### RF-02 — Início
Mostra nome, título profissional, uma frase de apresentação e atalhos para Projetos e Contato.
- **Aceite:** os quatro elementos aparecem sem rolar a página no desktop e no celular; os atalhos levam às seções certas.

### RF-03 — Sobre
Resumo profissional do George, com links para LinkedIn e GitHub.
- **Aceite:** texto e links visíveis; links abrem os perfis corretos em nova aba.

### RF-04 — Stacks
Lista das tecnologias agrupadas por categoria (ex.: front-end, back-end, ferramentas), vinda de um arquivo de conteúdo (não escrita direto no código da página).
- **Aceite:** adicionar uma tecnologia no arquivo de conteúdo faz ela aparecer na seção, sem alterar código de tela.

### RF-05 — Projetos (front)
Lista de projetos em cards com título, descrição, stacks, links (repositório e demo, quando houver) e dados vivos do GitHub (linguagem principal, estrelas, última atualização).
- **Aceite:** os cards são montados a partir da resposta da API (RF-06); enquanto a API responde aparece um estado de carregamento; se a API falhar aparece uma mensagem amigável, sem quebrar a página.

### RF-06 — API de projetos
Endpoint REST que devolve a lista de projetos combinando:
1. um **arquivo curado** no repositório (define quais projetos aparecem, ordem, título, descrição, stacks, links, imagem);
2. **dados vivos da API do GitHub** para os projetos que têm repositório (linguagem, estrelas, última atualização).
- **Aceite:**
  - responde JSON com todos os projetos do arquivo curado, na ordem definida;
  - projetos sem repositório no GitHub aparecem só com os dados curados;
  - resultados do GitHub ficam em cache por um tempo definido, para não estourar o limite da API do GitHub;
  - se o GitHub estiver indisponível, a API responde com os dados curados e indica que os dados vivos estão ausentes (não retorna erro).

### RF-07 — Serviços
Seção para clientes de freelance: o que o George oferece, para quem e como funciona, com botão que leva ao Contato.
- **Aceite:** seção visível no menu; o botão leva à seção Contato.

### RF-08 — Contato
Links para LinkedIn e e-mail (`mailto:`), e GitHub.
- **Aceite:** o link de e-mail abre o cliente de e-mail com o endereço preenchido; LinkedIn e GitHub abrem em nova aba.

### RF-09 — Textos separados do código
Todos os textos visíveis ficam em arquivo(s) de conteúdo/tradução em português, prontos para receber outro idioma.
- **Aceite:** nenhum texto visível escrito direto nos componentes; trocar uma frase no arquivo muda o site.

## Requisitos não funcionais

### RNF-01 — Responsividade
Funciona do celular (largura a partir de 360px) ao desktop (1280px ou mais), com abordagem mobile-first.
- **Aceite:** nenhuma rolagem horizontal e nenhum conteúdo cortado nessas larguras.

### RNF-02 — Acessibilidade (boas práticas)
HTML semântico, texto alternativo em imagens, navegação completa por teclado, foco visível e contraste legível no tema escuro.
Sem metas numéricas na v1 — metas WCAG/Lighthouse entram na v2, depois que o George estudar esses conceitos (sugestão de `/estudar`).
- **Aceite:** é possível navegar por todas as seções e links só com o teclado; toda imagem tem `alt`.

### RNF-03 — Desempenho (boas práticas)
Imagens otimizadas, carregamento rápido do conteúdo principal; a página aparece mesmo se a API demorar (a hospedagem gratuita pode ter "partida a frio").
- **Aceite:** o conteúdo estático (Início, Sobre, Stacks, Serviços, Contato) aparece sem esperar a API.

### RNF-04 — Tema
Tema escuro único na v1, com cores definidas em variáveis (facilita o tema claro da v2).
- **Aceite:** nenhuma cor escrita direto nos componentes fora das variáveis do tema.

### RNF-05 — Segurança
Qualquer token (ex.: GitHub) fica só no back-end, em variável de ambiente; nunca no front nem no repositório. A API aceita requisições apenas da origem do site (CORS).
- **Aceite:** busca por tokens no repositório e no código do front não encontra nada; requisição de outra origem é recusada pelo navegador.

### RNF-06 — Privacidade
Sem cookies, sem analytics e sem coleta de dados pessoais na v1.
- **Aceite:** o site não grava cookies.

### RNF-07 — SEO básico
Título, meta descrição e metadados de compartilhamento (Open Graph) da página.
- **Aceite:** ao compartilhar o link (ex.: no LinkedIn) aparecem título, descrição e imagem.

### RNF-08 — Hospedagem
Custo zero na v1 (front e API em planos gratuitos); deploy a partir do repositório.
- **Aceite:** o site e a API estão publicados sem custo mensal.

### RNF-09 — Qualidade e testes
Segue a `definition-of-done`: testes unitários (dev) e de aceitação (qa) para cada requisito.
- **Aceite:** cada RF tem ao menos um teste de aceitação.

## Referência — v2 (não detalhado)

Várias páginas com rotas e página por projeto · tema claro + alternância · formulário de contato com API, banco e e-mail · painel admin com login · hospedagem paga e domínio próprio · inglês · metas WCAG/Lighthouse no CI · página de experiência · depoimentos.
