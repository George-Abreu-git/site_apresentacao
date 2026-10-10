import estilos from './Rodape.module.css';

function Rodape() {
  const anoAtual = new Date().getFullYear();

  return (
    <footer className={estilos.rodape}>
      <p className={estilos.texto}>© {anoAtual} George Siqueira</p>
    </footer>
  );
}

export default Rodape;
