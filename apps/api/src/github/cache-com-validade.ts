interface Entrada<T> {
  valor: T;
  /** Instante (em ms, como `Date.now()`) a partir do qual o valor deixa de valer. */
  expiraEm: number;
}

/**
 * Cache em memória em que cada valor vale por um tempo fixo (TTL, "time to live").
 *
 * Serve para não perguntar ao GitHub a cada requisição e não estourar o limite da API dele
 * (RF-06). Fica na memória do processo: some quando a API reinicia, o que é aceitável
 * aqui (a primeira requisição depois disso só busca os dados de novo).
 *
 * Valores vencidos não são apagados ativamente; são trocados na próxima vez que forem
 * guardados. Com poucos repositórios, a memória gasta é desprezível.
 */
export class CacheComValidade<T> {
  private readonly entradas = new Map<string, Entrada<T>>();

  /**
   * @param validadeEmMs por quanto tempo cada valor guardado vale.
   * @param agora relógio usado pelo cache. Os testes passam um relógio controlado,
   *   para simular a passagem do tempo sem esperar de verdade.
   */
  constructor(
    private readonly validadeEmMs: number,
    private readonly agora: () => number = () => Date.now(),
  ) {}

  /** O valor da chave, ou `undefined` se nunca foi guardado ou se já venceu. */
  obter(chave: string): T | undefined {
    const entrada = this.entradas.get(chave);
    if (entrada === undefined || this.agora() >= entrada.expiraEm) {
      return undefined;
    }
    return entrada.valor;
  }

  /** Guarda (ou troca) o valor da chave, com a validade contada a partir de agora. */
  guardar(chave: string, valor: T): void {
    this.entradas.set(chave, { valor, expiraEm: this.agora() + this.validadeEmMs });
  }
}
