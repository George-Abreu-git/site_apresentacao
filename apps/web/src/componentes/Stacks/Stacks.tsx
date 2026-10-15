import { conteudo } from '../../conteudo';
import type { CategoriaDeStack } from '../../conteudo';
import Secao from '../Secao/Secao';
import estilos from './Stacks.module.css';

interface StacksProps {
  /** Por padrão vem do arquivo de conteúdo; o teste passa outra lista para provar que a tela só repete o que recebe. */
  categorias?: CategoriaDeStack[];
}

/** Seção Stacks (RF-04): as tecnologias agrupadas por categoria, montadas a partir do arquivo de conteúdo. */
function Stacks({ categorias = conteudo.stacks.categorias }: StacksProps) {
  return (
    <Secao id="stacks" titulo={conteudo.secoes.stacks}>
      <div className={estilos.categorias}>
        {categorias.map((categoria, indice) => {
          const idDoTitulo = `stacks-categoria-${indice}`;

          return (
            <div key={categoria.titulo}>
              <h3 id={idDoTitulo} className={estilos.subtitulo}>
                {categoria.titulo}
              </h3>
              {/* aria-labelledby dá à lista o nome da categoria: o leitor de tela anuncia "lista Front-end, 4 itens". */}
              <ul aria-labelledby={idDoTitulo} className={estilos.tecnologias}>
                {categoria.tecnologias.map((tecnologia) => (
                  <li key={tecnologia} className={estilos.tecnologia}>
                    {tecnologia}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Secao>
  );
}

export default Stacks;
