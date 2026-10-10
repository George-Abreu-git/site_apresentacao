import estilos from './App.module.css';

// Página provisória: só prova que o front sobe. O layout de verdade chega na T-007.
function App() {
  return (
    <main className={estilos.pagina}>
      <h1 className={estilos.titulo}>George Siqueira</h1>
      <p className={estilos.aviso}>Site em construção.</p>
    </main>
  );
}

export default App;
