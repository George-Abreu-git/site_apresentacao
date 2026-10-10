import Cabecalho from './componentes/Cabecalho/Cabecalho';
import Inicio from './componentes/Inicio/Inicio';
import Rodape from './componentes/Rodape/Rodape';
import Secao from './componentes/Secao/Secao';
import { SECOES } from './secoes';

// Início tem layout próprio (ver Inicio.tsx); as demais seções ainda estão vazias.
const SECOES_COM_TITULO_H2 = SECOES.filter((secao) => secao.id !== 'inicio');

/** Página única: cabeçalho com menu, as seis seções e o rodapé (RF-01, RNF-02). */
function App() {
  return (
    <>
      <Cabecalho />
      <main>
        <Inicio />
        {SECOES_COM_TITULO_H2.map((secao) => (
          <Secao key={secao.id} id={secao.id} titulo={secao.titulo} />
        ))}
      </main>
      <Rodape />
    </>
  );
}

export default App;
