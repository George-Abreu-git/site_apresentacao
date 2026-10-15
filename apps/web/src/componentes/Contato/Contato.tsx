import { conteudo } from '../../conteudo';
import LinkExterno from '../LinkExterno/LinkExterno';
import Secao from '../Secao/Secao';
import estilos from './Contato.module.css';

const { secoes, contato, links } = conteudo;

/** Seção Contato (RF-08): LinkedIn, e-mail e GitHub. Na v1 não há formulário (só links). */
function Contato() {
  return (
    <Secao id="contato" titulo={secoes.contato}>
      <p className={estilos.texto}>{contato.texto}</p>
      <ul className={estilos.canais}>
        <li>
          <LinkExterno href={links.linkedin} className={estilos.canal}>
            {contato.linkLinkedin}
          </LinkExterno>
        </li>
        <li>
          {/* `mailto:` pede ao navegador para abrir o programa de e-mail com o destinatário preenchido. */}
          <a href={`mailto:${links.email}`} className={estilos.canal}>
            {contato.linkEmail}
          </a>
        </li>
        <li>
          <LinkExterno href={links.github} className={estilos.canal}>
            {contato.linkGithub}
          </LinkExterno>
        </li>
      </ul>
    </Secao>
  );
}

export default Contato;
