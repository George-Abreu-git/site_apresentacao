// Todos os textos visíveis do site em português (RF-09).
// Para mudar uma frase do site, mude aqui: nenhum componente tem texto próprio.
import type { Conteudo } from './tipos';

export const ptBR: Conteudo = {
  links: {
    // PROVISÓRIO: o George precisa informar o endereço real do LinkedIn e o e-mail de contato.
    linkedin: 'https://www.linkedin.com/in/PREENCHER',
    github: 'https://github.com/George-Abreu-git',
    email: 'PREENCHER@exemplo.com',
  },
  pessoa: {
    nome: 'George Siqueira',
  },
  geral: {
    abreEmNovaAba: '(abre em nova aba)',
    localidade: 'pt-BR',
  },
  navegacao: {
    rotulo: 'Navegação principal',
    botaoMenu: 'Menu',
  },
  secoes: {
    inicio: 'Início',
    sobre: 'Sobre',
    stacks: 'Stacks',
    projetos: 'Projetos',
    servicos: 'Serviços',
    contato: 'Contato',
  },
  inicio: {
    tituloProfissional: 'Desenvolvedor de software',
    frase: 'Crio aplicações web do front-end à API, com código claro e testado.',
    atalhoProjetos: 'Ver projetos',
    atalhoContato: 'Entrar em contato',
  },
  sobre: {
    paragrafos: [
      'Sou desenvolvedor de software e gosto de transformar problemas em aplicações simples de usar e fáceis de manter.',
      'Trabalho com front-end, back-end e APIs, sempre com testes e atenção à acessibilidade. Este site é, ao mesmo tempo, minha vitrine e meu projeto de estudo.',
    ],
    linkLinkedin: 'LinkedIn',
    linkGithub: 'GitHub',
  },
  stacks: {
    // PROVISÓRIO: lista inicial com as tecnologias usadas neste site (ADR-0001); o George revisa e completa.
    categorias: [
      { titulo: 'Front-end', tecnologias: ['React', 'TypeScript', 'Vite', 'CSS Modules'] },
      { titulo: 'Back-end', tecnologias: ['Node.js', 'NestJS', 'APIs REST'] },
      { titulo: 'Testes', tecnologias: ['Vitest', 'Testing Library', 'Supertest', 'Playwright'] },
      { titulo: 'Ferramentas', tecnologias: ['Git', 'GitHub', 'npm', 'ESLint'] },
    ],
  },
  projetos: {
    carregando: 'Carregando projetos… Na primeira visita do dia isso pode levar até um minuto.',
    erro: 'Não foi possível carregar os projetos agora. Tente novamente mais tarde.',
    vazio: 'Nenhum projeto publicado por enquanto.',
    rotuloStacks: 'Tecnologias',
    linkRepositorio: 'Repositório',
    linkDemo: 'Ver demo',
    linguagem: 'Linguagem',
    estrelas: 'Estrelas',
    ultimaAtualizacao: 'Atualizado em',
  },
  servicos: {
    oQueOfereco: {
      titulo: 'O que eu ofereço',
      itens: [
        'Sites e páginas responsivas, que funcionam bem no celular e no computador',
        'APIs e integrações entre sistemas',
        'Manutenção e melhorias em aplicações web existentes',
      ],
    },
    paraQuem: {
      titulo: 'Para quem',
      texto: 'Pessoas, pequenos negócios e equipes que precisam tirar uma ideia do papel ou evoluir um sistema que já existe.',
    },
    comoFunciona: {
      titulo: 'Como funciona',
      itens: [
        'Conversamos sobre o seu problema e o resultado esperado.',
        'Envio uma proposta com escopo, prazo e valor.',
        'Desenvolvo em etapas curtas, mostrando o andamento a cada entrega.',
      ],
    },
    botaoContato: 'Fale comigo',
  },
  contato: {
    texto: 'Quer conversar sobre uma vaga ou um projeto? Escolha o canal que preferir.',
    linkLinkedin: 'LinkedIn',
    linkEmail: 'E-mail',
    linkGithub: 'GitHub',
  },
};
