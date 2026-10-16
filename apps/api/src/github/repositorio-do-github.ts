/** Identificação de um repositório na API do GitHub: `GET /repos/{dono}/{nome}`. */
export interface RepositorioNoGithub {
  dono: string;
  nome: string;
}

const HOSPEDEIROS_DO_GITHUB = new Set(['github.com', 'www.github.com']);

/**
 * Lê o endereço do campo `repositorio` do arquivo curado e diz qual repositório do GitHub ele é.
 *
 * @returns `{ dono, nome }`, ou `null` quando o endereço não é de um repositório do GitHub
 *   (ex.: GitLab). Nesse caso o projeto aparece só com os dados curados (RF-06).
 */
export function extrairRepositorioDoGithub(endereco: string): RepositorioNoGithub | null {
  // `URL.canParse` evita o try/catch: `new URL` lança erro para textos que não são endereço.
  if (!URL.canParse(endereco)) {
    return null;
  }

  const url = new URL(endereco);
  // `hostname` já vem em minúsculas; comparar o nome inteiro barra imitações como github.com.exemplo.com.
  if (!HOSPEDEIROS_DO_GITHUB.has(url.hostname)) {
    return null;
  }

  // "/dono/repo/tree/main" → ["dono", "repo", "tree", "main"]: só as duas primeiras partes importam.
  const [dono, nomeComSufixo] = url.pathname.split('/').filter((parte) => parte !== '');
  if (!dono || !nomeComSufixo) {
    return null;
  }

  return { dono, nome: nomeComSufixo.replace(/\.git$/, '') };
}
