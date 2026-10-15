import { conteudo } from '../../conteudo';
import LinkExterno from '../LinkExterno/LinkExterno';
import Secao from '../Secao/Secao';
import estilos from './Sobre.module.css';

const { secoes, sobre, links } = conteudo;

/** Seção Sobre (RF-03): resumo profissional e links para os perfis. */
function Sobre() {
  return (
    <Secao id="sobre" titulo={secoes.sobre}>
      {sobre.paragrafos.map((paragrafo) => (
        <p key={paragrafo} className={estilos.paragrafo}>
          {paragrafo}
        </p>
      ))}
      <ul className={estilos.links}>
        <li>
          <LinkExterno href={links.linkedin}>{sobre.linkLinkedin}</LinkExterno>
        </li>
        <li>
          <LinkExterno href={links.github}>{sobre.linkGithub}</LinkExterno>
        </li>
      </ul>
    </Secao>
  );
}

export default Sobre;
