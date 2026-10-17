import { Component, type ReactNode } from 'react';

interface LimiteDeErroProps {
  children: ReactNode;
  /** Chamada uma vez, com o erro, quando algum filho lança erro ao renderizar. */
  aoFalhar: (erro: unknown) => void;
}

interface LimiteDeErroEstado {
  falhou: boolean;
}

/**
 * "Error boundary" (limite de erro): segura o erro lançado por um filho ao renderizar.
 *
 * Sem um limite, o React desmonta a árvore INTEIRA quando um componente lança erro
 * (a página fica em branco). Com ele, só o que está dentro do limite sai da tela, e
 * quem o usa decide o que mostrar no lugar (via `aoFalhar`).
 *
 * Precisa ser um componente de classe: o React ainda não tem hook para capturar erros
 * de renderização (os métodos `getDerivedStateFromError` e `componentDidCatch` só
 * existem em classes).
 *
 * Não captura erros de eventos (onClick) nem de código assíncrono (fetch, setTimeout):
 * esses não acontecem durante a renderização e são tratados onde ocorrem.
 */
class LimiteDeErro extends Component<LimiteDeErroProps, LimiteDeErroEstado> {
  state: LimiteDeErroEstado = { falhou: false };

  // Fase de renderização: só calcula o novo estado (sem efeitos colaterais).
  static getDerivedStateFromError(): LimiteDeErroEstado {
    return { falhou: true };
  }

  // Fase de commit: aqui pode haver efeito colateral, como avisar o componente pai.
  componentDidCatch(erro: unknown) {
    this.props.aoFalhar(erro);
  }

  render() {
    return this.state.falhou ? null : this.props.children;
  }
}

export default LimiteDeErro;
