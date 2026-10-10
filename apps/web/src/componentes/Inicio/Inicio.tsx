import estilos from './Inicio.module.css';

/**
 * Seção Início. Diferente das outras, o título é o <h1> da página (o nome do George),
 * por isso não usa o componente Secao (que gera um <h2>). O conteúdo de verdade
 * (título profissional, frase e atalhos, RF-02) chega numa próxima tarefa.
 */
function Inicio() {
  return (
    <section id="inicio" aria-labelledby="inicio-titulo" className={estilos.inicio}>
      <h1 id="inicio-titulo" className={estilos.titulo}>
        George Siqueira
      </h1>
      <p className={estilos.aviso}>Site em construção.</p>
    </section>
  );
}

export default Inicio;
