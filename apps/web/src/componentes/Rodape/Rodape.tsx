import { conteudo } from '../../conteudo';
import estilos from './Rodape.module.css';

function Rodape() {
  const anoAtual = new Date().getFullYear();

  return (
    <footer className={estilos.rodape}>
      <p className={estilos.texto}>© {anoAtual} {conteudo.pessoa.nome}</p>
    </footer>
  );
}

export default Rodape;
