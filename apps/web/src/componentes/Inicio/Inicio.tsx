import { conteudo } from '../../conteudo';
import Atalho from '../Atalho/Atalho';
import estilos from './Inicio.module.css';

const { pessoa, inicio } = conteudo;

/**
 * Seção Início (RF-02). Diferente das outras, o título é o <h1> da página (o nome do George),
 * por isso não usa o componente Secao (que gera um <h2>). Ocupa a primeira tela, para que
 * nome, título, frase e atalhos apareçam sem rolar.
 */
function Inicio() {
  return (
    <section id="inicio" aria-labelledby="inicio-titulo" className={estilos.inicio}>
      <h1 id="inicio-titulo" className={estilos.titulo}>
        {pessoa.nome}
      </h1>
      <p className={estilos.tituloProfissional}>{inicio.tituloProfissional}</p>
      <p className={estilos.frase}>{inicio.frase}</p>
      <div className={estilos.atalhos}>
        <Atalho href="#projetos">{inicio.atalhoProjetos}</Atalho>
        <Atalho href="#contato" variante="secundario">
          {inicio.atalhoContato}
        </Atalho>
      </div>
    </section>
  );
}

export default Inicio;
