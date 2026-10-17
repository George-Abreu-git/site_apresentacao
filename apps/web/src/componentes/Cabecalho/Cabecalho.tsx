import { useRef } from 'react';
import { conteudo } from '../../conteudo';
import { SECOES } from '../../secoes';
import Menu from '../Menu/Menu';
import estilos from './Cabecalho.module.css';
import { useAlturaDoCabecalho } from './useAlturaDoCabecalho';

/** Cabeçalho preso ao topo (sticky): o menu continua ao alcance enquanto a página rola (RF-01). */
function Cabecalho() {
  const cabecalhoRef = useRef<HTMLElement>(null);
  // Ao seguir uma âncora, a página para abaixo do cabeçalho, qualquer que seja a altura dele (T-030).
  useAlturaDoCabecalho(cabecalhoRef);

  return (
    <header ref={cabecalhoRef} className={estilos.cabecalho}>
      <div className={estilos.conteudo}>
        <a href="#inicio" className={estilos.marca}>
          {conteudo.pessoa.nome}
        </a>
        <Menu itens={SECOES} />
      </div>
    </header>
  );
}

export default Cabecalho;
