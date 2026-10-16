import type { DadosVivosDoGithub, Projeto } from '@site-apresentacao/shared';
import { useId } from 'react';
import { conteudo } from '../../conteudo';
import LinkExterno from '../LinkExterno/LinkExterno';
import estilos from './CartaoDeProjeto.module.css';

const textos = conteudo.projetos;
const { localidade } = conteudo.geral;

// `Intl` formata no padrão do idioma do conteúdo: em pt-BR, "1.234" e "01/10/2026".
const formatoDeNumero = new Intl.NumberFormat(localidade);
const formatoDeData = new Intl.DateTimeFormat(localidade, { dateStyle: 'short' });

interface CartaoDeProjetoProps {
  projeto: Projeto;
}

/** Um card da seção Projetos (RF-05): dados curados e, quando houver, os dados vivos do GitHub. */
function CartaoDeProjeto({ projeto }: CartaoDeProjetoProps) {
  // useId gera um id único na página: dois cards nunca disputam o mesmo id.
  const idDoTitulo = useId();

  return (
    // aria-labelledby dá ao <article> o nome do projeto: o leitor de tela anuncia "artigo Site de apresentação".
    <article aria-labelledby={idDoTitulo} className={estilos.cartao}>
      <h3 id={idDoTitulo} className={estilos.titulo}>
        {projeto.titulo}
      </h3>
      <p className={estilos.descricao}>{projeto.descricao}</p>
      <ul aria-label={textos.rotuloStacks} className={estilos.stacks}>
        {projeto.stacks.map((stack) => (
          <li key={stack} className={estilos.stack}>
            {stack}
          </li>
        ))}
      </ul>
      <DadosVivos github={projeto.github} />
      <Links repositorio={projeto.repositorio} demo={projeto.demo} />
    </article>
  );
}

/** Linguagem, estrelas e última atualização. Some quando o GitHub não respondeu (ou o projeto não é do GitHub). */
function DadosVivos({ github }: { github?: DadosVivosDoGithub }) {
  if (!github?.disponivel) return null;

  return (
    // <dl> (lista de descrições) é o HTML para pares "rótulo: valor".
    <dl className={estilos.dados}>
      {github.linguagem && (
        <div className={estilos.dado}>
          <dt>{textos.linguagem}</dt>
          <dd>{github.linguagem}</dd>
        </div>
      )}
      <div className={estilos.dado}>
        <dt>{textos.estrelas}</dt>
        <dd>{formatoDeNumero.format(github.estrelas)}</dd>
      </div>
      <div className={estilos.dado}>
        <dt>{textos.ultimaAtualizacao}</dt>
        <dd>
          {/* <time dateTime> guarda a data original para máquinas (buscadores, leitores); a tela mostra a formatada. */}
          <time dateTime={github.ultimaAtualizacao}>{formatoDeData.format(new Date(github.ultimaAtualizacao))}</time>
        </dd>
      </div>
    </dl>
  );
}

/** Links do repositório e da demo; cada um só aparece se o projeto tiver o endereço. */
function Links({ repositorio, demo }: Pick<Projeto, 'repositorio' | 'demo'>) {
  if (!repositorio && !demo) return null;

  return (
    <ul className={estilos.links}>
      {repositorio && (
        <li>
          <LinkExterno href={repositorio} className={estilos.link}>
            {textos.linkRepositorio}
          </LinkExterno>
        </li>
      )}
      {demo && (
        <li>
          <LinkExterno href={demo} className={estilos.link}>
            {textos.linkDemo}
          </LinkExterno>
        </li>
      )}
    </ul>
  );
}

export default CartaoDeProjeto;
