import type { ReactNode } from 'react';
import { conteudo } from '../../conteudo';
import estilos from './LinkExterno.module.css';

interface LinkExternoProps {
  href: string;
  className?: string;
  children: ReactNode;
}

/** Link para outro site, aberto em nova aba (RF-03, RF-08). */
function LinkExterno({ href, className, children }: LinkExternoProps) {
  return (
    // `noopener noreferrer`: a página aberta não ganha acesso a esta (window.opener)
    // nem recebe o endereço de origem. É o par obrigatório de `target="_blank"`.
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {/*
        Quem enxerga percebe a nova aba abrindo; quem usa leitor de tela precisa ser avisado antes.
        O espaço {' '} fica fora do <span> para separar as palavras no nome lido em voz alta.
      */}
      {children}{' '}
      <span className={estilos.visualmenteOculto}>{conteudo.geral.abreEmNovaAba}</span>
    </a>
  );
}

export default LinkExterno;
