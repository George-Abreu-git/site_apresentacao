import { SECOES } from '../../secoes';
import Menu from '../Menu/Menu';
import estilos from './Cabecalho.module.css';

/** Cabeçalho fixo no topo: o menu continua ao alcance enquanto a página rola (RF-01). */
function Cabecalho() {
  return (
    <header className={estilos.cabecalho}>
      <div className={estilos.conteudo}>
        <a href="#inicio" className={estilos.marca}>
          George Siqueira
        </a>
        <Menu itens={SECOES} />
      </div>
    </header>
  );
}

export default Cabecalho;
