import { useId, useRef, useState, type KeyboardEvent } from 'react';
import type { ItemDeSecao } from '../../secoes';
import estilos from './Menu.module.css';

interface MenuProps {
  itens: readonly ItemDeSecao[];
}

/**
 * Navegação principal (RF-01). No celular, a lista fica escondida atrás do botão "Menu";
 * a partir de 48rem (tablet/desktop) o CSS esconde o botão e mostra a lista sempre.
 */
function Menu({ itens }: MenuProps) {
  const [aberto, setAberto] = useState(false);
  // `useId` gera um id único por instância, para ligar o botão à lista (aria-controls).
  const idDaLista = useId();
  const botaoRef = useRef<HTMLButtonElement>(null);

  function alternar() {
    setAberto((estavaAberto) => !estavaAberto);
  }

  function fechar() {
    setAberto(false);
  }

  // Esc fecha a lista e devolve o foco ao botão: sem isso, quem usa teclado
  // ficaria com o foco "perdido" num link que acabou de sumir da tela.
  function aoTeclar(evento: KeyboardEvent<HTMLElement>) {
    if (evento.key === 'Escape' && aberto) {
      fechar();
      botaoRef.current?.focus();
    }
  }

  return (
    <nav aria-label="Navegação principal" onKeyDown={aoTeclar}>
      <button
        ref={botaoRef}
        type="button"
        className={estilos.botao}
        aria-expanded={aberto}
        aria-controls={idDaLista}
        onClick={alternar}
      >
        Menu
      </button>

      <ul id={idDaLista} className={aberto ? `${estilos.lista} ${estilos.aberta}` : estilos.lista}>
        {itens.map((item) => (
          <li key={item.id}>
            {/* Link comum com âncora: funciona até sem JavaScript, e o navegador cuida da rolagem. */}
            <a href={`#${item.id}`} className={estilos.link} onClick={fechar}>
              {item.titulo}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Menu;
