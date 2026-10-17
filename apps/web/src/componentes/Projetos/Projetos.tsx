import { useState } from 'react';
import { conteudo } from '../../conteudo';
import { idDoTituloDaSecao } from '../../secoes';
import CartaoDeProjeto from '../CartaoDeProjeto/CartaoDeProjeto';
import LimiteDeErro from '../LimiteDeErro/LimiteDeErro';
import Secao from '../Secao/Secao';
import estilos from './Projetos.module.css';
import { type EstadoDosProjetos, useProjetos } from './useProjetos';

const { secoes } = conteudo;
const textos = conteudo.projetos;

/** O aviso de cada momento da busca; com os cards na tela, não há aviso. */
function avisoDoEstado(estado: EstadoDosProjetos): string {
  if (estado.situacao === 'carregando') return textos.carregando;
  if (estado.situacao === 'erro') return textos.erro;
  return estado.projetos.length === 0 ? textos.vazio : '';
}

/**
 * Seção Projetos (RF-05): os cards vêm da API (GET /api/projetos).
 * Só esta seção espera a API; o resto da página aparece na hora (RNF-03).
 */
function Projetos() {
  const estado = useProjetos();
  // Liga quando algum card lança erro ao desenhar: os cards saem e fica a mensagem amigável (T-018).
  const [falhouAoMostrarOsCards, setFalhouAoMostrarOsCards] = useState(false);
  const projetos = estado.situacao === 'carregado' ? estado.projetos : [];

  return (
    <Secao id="projetos" titulo={secoes.projetos}>
      {/*
        role="status" é uma "região viva": quando o texto dentro dela muda, o leitor de tela
        lê a novidade sem mover o foco. Ela fica sempre na página (mesmo vazia) porque o
        leitor de tela só acompanha regiões que já existiam antes da mudança.
      */}
      <p role="status" className={estilos.aviso}>
        {falhouAoMostrarOsCards ? textos.erro : avisoDoEstado(estado)}
      </p>
      {/*
        O limite de erro segura um erro de renderização dos cards aqui dentro da seção;
        sem ele, o React apagaria a página inteira (T-018).
      */}
      <LimiteDeErro aoFalhar={() => setFalhouAoMostrarOsCards(true)}>
        {projetos.length > 0 && (
          // A lista recebe o nome do título da seção: o leitor de tela anuncia "lista Projetos, 2 itens".
          <ul aria-labelledby={idDoTituloDaSecao('projetos')} className={estilos.lista}>
            {projetos.map((projeto) => (
              <li key={projeto.titulo}>
                <CartaoDeProjeto projeto={projeto} />
              </li>
            ))}
          </ul>
        )}
      </LimiteDeErro>
    </Secao>
  );
}

export default Projetos;
