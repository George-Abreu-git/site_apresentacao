import { useRef, useState } from 'react';
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

  // O estado da lista do menu mora aqui, e não no Menu, porque a marca também navega e precisa
  // fechá-la; senão, no celular, a lista aberta cobriria o começo da página (T-022).
  const [menuAberto, setMenuAberto] = useState(false);

  function alternarMenu() {
    setMenuAberto((estavaAberto) => !estavaAberto);
  }

  function fecharMenu() {
    setMenuAberto(false);
  }

  return (
    <header ref={cabecalhoRef} className={estilos.cabecalho}>
      <div className={estilos.conteudo}>
        <a href="#inicio" className={estilos.marca} onClick={fecharMenu}>
          {conteudo.pessoa.nome}
        </a>
        <Menu itens={SECOES} aberto={menuAberto} aoAlternar={alternarMenu} aoFechar={fecharMenu} />
      </div>
    </header>
  );
}

export default Cabecalho;
