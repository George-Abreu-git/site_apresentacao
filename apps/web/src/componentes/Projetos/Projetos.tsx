import { conteudo } from '../../conteudo';
import { idDoTituloDaSecao } from '../../secoes';
import CartaoDeProjeto from '../CartaoDeProjeto/CartaoDeProjeto';
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
  const projetos = estado.situacao === 'carregado' ? estado.projetos : [];

  return (
    <Secao id="projetos" titulo={secoes.projetos}>
      {/*
        role="status" é uma "região viva": quando o texto dentro dela muda, o leitor de tela
        lê a novidade sem mover o foco. Ela fica sempre na página (mesmo vazia) porque o
        leitor de tela só acompanha regiões que já existiam antes da mudança.
      */}
      <p role="status" className={estilos.aviso}>
        {avisoDoEstado(estado)}
      </p>
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
    </Secao>
  );
}

export default Projetos;
