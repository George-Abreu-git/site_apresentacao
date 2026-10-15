// Formato do arquivo de conteúdo (RF-09). Cada idioma é um objeto com ESTE formato:
// se faltar um texto na tradução (ex.: um futuro `en.ts`), o TypeScript acusa no build.
import type { IdDeSecao } from '../secoes';

/** Título e texto corrido de um bloco da seção Serviços. */
interface BlocoDeTexto {
  titulo: string;
  texto: string;
}

/** Título e lista de itens de um bloco da seção Serviços. */
interface BlocoDeLista {
  titulo: string;
  itens: string[];
}

/** Um grupo da seção Stacks (ex.: "Front-end") e as tecnologias dele, na ordem em que aparecem. */
export interface CategoriaDeStack {
  titulo: string;
  tecnologias: string[];
}

export interface Conteudo {
  /** Endereços dos perfis e o e-mail: não são traduzidos, mas ficam junto dos textos para mudar num lugar só. */
  links: {
    linkedin: string;
    github: string;
    email: string;
  };
  pessoa: {
    nome: string;
  };
  /** Textos de apoio usados em mais de um lugar. */
  geral: {
    /** Avisa o leitor de tela que o link abre em outra aba (o texto fica escondido na tela). */
    abreEmNovaAba: string;
  };
  navegacao: {
    /** Nome da navegação principal, anunciado pelo leitor de tela. */
    rotulo: string;
    /** Texto do botão que abre o menu no celular. */
    botaoMenu: string;
  };
  /** Título de cada seção: aparece no menu e no <h2> da seção. */
  secoes: Record<IdDeSecao, string>;
  inicio: {
    tituloProfissional: string;
    frase: string;
    atalhoProjetos: string;
    atalhoContato: string;
  };
  sobre: {
    paragrafos: string[];
    linkLinkedin: string;
    linkGithub: string;
  };
  stacks: {
    /** Para mostrar uma tecnologia nova, basta incluí-la aqui (RF-04): a tela não muda. */
    categorias: CategoriaDeStack[];
  };
  servicos: {
    oQueOfereco: BlocoDeLista;
    paraQuem: BlocoDeTexto;
    comoFunciona: BlocoDeLista;
    botaoContato: string;
  };
  contato: {
    texto: string;
    linkLinkedin: string;
    linkEmail: string;
    linkGithub: string;
  };
}
