import Cabecalho from './componentes/Cabecalho/Cabecalho';
import Contato from './componentes/Contato/Contato';
import Inicio from './componentes/Inicio/Inicio';
import Projetos from './componentes/Projetos/Projetos';
import Rodape from './componentes/Rodape/Rodape';
import Servicos from './componentes/Servicos/Servicos';
import Sobre from './componentes/Sobre/Sobre';
import Stacks from './componentes/Stacks/Stacks';

/**
 * Página única: cabeçalho com menu, as seis seções e o rodapé (RF-01, RNF-02).
 * A ordem aqui segue a de `SECOES` (secoes.ts); o teste do App confere as duas.
 * Só Projetos depende da API; as outras seções não esperam por ela (RNF-03).
 */
function App() {
  return (
    <>
      <Cabecalho />
      <main>
        <Inicio />
        <Sobre />
        <Stacks />
        <Projetos />
        <Servicos />
        <Contato />
      </main>
      <Rodape />
    </>
  );
}

export default App;
