/**
 * Configuração do módulo github, lida das variáveis de ambiente na inicialização.
 *
 * - `GITHUB_TOKEN` (opcional): token de acesso à API do GitHub. Sem ele a API do GitHub
 *   aceita menos requisições por hora. Fica só no ambiente (RNF-05): nunca no código,
 *   nunca no log, nunca na resposta.
 * - `GITHUB_CACHE_TTL_SEGUNDOS` (opcional): por quanto tempo os dados de um repositório
 *   ficam guardados antes de perguntar de novo ao GitHub. Padrão: 1 hora.
 */
export interface ConfiguracaoDoGithub {
  token?: string;
  validadeDoCacheEmMs: number;
  /** Tempo máximo de espera por uma resposta do GitHub antes de desistir. */
  tempoLimiteDaRequisicaoEmMs: number;
}

/**
 * Token de injeção da configuração. É um objeto, não uma classe, por isso precisa
 * de um token próprio (o mesmo padrão do PROJETOS_CURADOS, da T-010).
 */
export const GITHUB_CONFIGURACAO = Symbol('GITHUB_CONFIGURACAO');

/**
 * 1 hora: os dados (estrelas, linguagem, último push) mudam pouco, e com, por exemplo,
 * 10 projetos são só 10 consultas por hora — bem abaixo do limite do GitHub sem token (60/h).
 */
export const VALIDADE_PADRAO_DO_CACHE_EM_SEGUNDOS = 3600;

/** Sem este limite, um GitHub lento seguraria a resposta de /api/projetos indefinidamente. */
const TEMPO_LIMITE_DA_REQUISICAO_EM_MS = 5000;

export class ConfiguracaoDoGithubInvalidaError extends Error {
  override name = 'ConfiguracaoDoGithubInvalidaError';
}

/**
 * Monta a configuração a partir das variáveis de ambiente.
 *
 * Recebe o ambiente como parâmetro (padrão: `process.env`) para os testes passarem
 * valores sem mexer no ambiente real do processo.
 *
 * @throws ConfiguracaoDoGithubInvalidaError se a validade do cache não for um inteiro positivo.
 */
export function lerConfiguracaoDoGithub(
  ambiente: NodeJS.ProcessEnv = process.env,
): ConfiguracaoDoGithub {
  return {
    token: valorPreenchido(ambiente.GITHUB_TOKEN),
    validadeDoCacheEmMs: lerValidadeDoCacheEmSegundos(ambiente.GITHUB_CACHE_TTL_SEGUNDOS) * 1000,
    tempoLimiteDaRequisicaoEmMs: TEMPO_LIMITE_DA_REQUISICAO_EM_MS,
  };
}

function lerValidadeDoCacheEmSegundos(valor: string | undefined): number {
  const texto = valorPreenchido(valor);
  if (texto === undefined) {
    return VALIDADE_PADRAO_DO_CACHE_EM_SEGUNDOS;
  }

  // Só dígitos: recusa "1.5", "-5" e "10s", que o Number() ou o parseInt() aceitariam em parte.
  const segundos = /^\d+$/.test(texto) ? Number(texto) : NaN;
  if (!(segundos > 0)) {
    throw new ConfiguracaoDoGithubInvalidaError(
      `GITHUB_CACHE_TTL_SEGUNDOS deve ser um número inteiro de segundos maior que zero (recebido: "${texto}")`,
    );
  }
  return segundos;
}

/** Variável vazia ou só com espaços (ex.: `GITHUB_TOKEN=` no .env) conta como ausente. */
function valorPreenchido(valor: string | undefined): string | undefined {
  const texto = valor?.trim();
  return texto ? texto : undefined;
}
