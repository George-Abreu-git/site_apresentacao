import type { ReactNode } from 'react';
import estilos from './Secao.module.css';

interface SecaoProps {
  id: string;
  titulo: string;
  children?: ReactNode;
}

/** Uma seção da página, alvo de um link do menu (ex.: `#sobre`). */
function Secao({ id, titulo, children }: SecaoProps) {
  const idDoTitulo = `${id}-titulo`;

  return (
    // aria-labelledby dá ao <section> o nome do próprio título: o leitor de tela anuncia "região Sobre".
    <section id={id} aria-labelledby={idDoTitulo} className={estilos.secao}>
      <h2 id={idDoTitulo} className={estilos.titulo}>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export default Secao;
