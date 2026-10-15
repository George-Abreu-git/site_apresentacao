import Cabecalho from './componentes/Cabecalho/Cabecalho';
import Contato from './componentes/Contato/Contato';
import Inicio from './componentes/Inicio/Inicio';
import Rodape from './componentes/Rodape/Rodape';
import Secao from './componentes/Secao/Secao';
import Servicos from './componentes/Servicos/Servicos';
import Sobre from './componentes/Sobre/Sobre';
import Stacks from './componentes/Stacks/Stacks';
import { conteudo } from './conteudo';

/**
 * Página única: cabeçalho com menu, as seis seções e o rodapé (RF-01, RNF-02).
 * A ordem aqui segue a de `SECOES` (secoes.ts); o teste do App confere as duas.
 * Projetos ainda está vazia: o conteúdo dela chega em outra tarefa.
 */
function App() {
  return (
    <>
      <Cabecalho />
      <main>
        <Inicio />
        <Sobre />
        <Stacks />
        <Secao id="projetos" titulo={conteudo.secoes.projetos} />
        <Servicos />
        <Contato />
      </main>
      <Rodape />
    </>
  );
}

export default App;
