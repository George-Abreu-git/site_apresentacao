import type { ReactNode } from 'react';
import estilos from './Atalho.module.css';

interface AtalhoProps {
  /** Âncora da seção de destino, ex.: "#contato". */
  href: string;
  /** `principal` é a ação mais importante (preenchido); `secundario` só tem contorno. */
  variante?: 'principal' | 'secundario';
  children: ReactNode;
}

/**
 * Link com cara de botão que leva a outra seção (RF-02, RF-07).
 * É um <a> e não um <button> porque ele navega (muda a âncora da URL), não executa uma ação.
 */
function Atalho({ href, variante = 'principal', children }: AtalhoProps) {
  return (
    <a href={href} className={`${estilos.atalho} ${estilos[variante]}`}>
      {children}
    </a>
  );
}

export default Atalho;
