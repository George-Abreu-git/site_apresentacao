import { conteudo } from '../../conteudo';
import Atalho from '../Atalho/Atalho';
import Secao from '../Secao/Secao';
import estilos from './Servicos.module.css';

const { secoes, servicos } = conteudo;

/** Seção Serviços (RF-07): o que é oferecido, para quem, como funciona e o caminho até o Contato. */
function Servicos() {
  const { oQueOfereco, paraQuem, comoFunciona } = servicos;

  return (
    <Secao id="servicos" titulo={secoes.servicos}>
      <div className={estilos.blocos}>
        <div>
          <h3 className={estilos.subtitulo}>{oQueOfereco.titulo}</h3>
          <ul className={estilos.lista}>
            {oQueOfereco.itens.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className={estilos.subtitulo}>{paraQuem.titulo}</h3>
          <p className={estilos.texto}>{paraQuem.texto}</p>
        </div>

        <div>
          <h3 className={estilos.subtitulo}>{comoFunciona.titulo}</h3>
          {/* <ol>: a ordem dos passos importa, e o leitor de tela anuncia "lista com 3 itens, 1, 2, 3". */}
          <ol className={estilos.lista}>
            {comoFunciona.itens.map((passo) => (
              <li key={passo}>{passo}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className={estilos.acao}>
        <Atalho href="#contato">{servicos.botaoContato}</Atalho>
      </div>
    </Secao>
  );
}

export default Servicos;
