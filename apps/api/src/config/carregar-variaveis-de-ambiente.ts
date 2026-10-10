import { existsSync } from 'node:fs';

/**
 * Lê um arquivo .env (formato CHAVE=valor) e coloca as variáveis em `process.env`.
 *
 * Usa `process.loadEnvFile`, que já vem no Node (sem biblioteca extra).
 * Variáveis que já existem no ambiente não são sobrescritas: assim, em produção,
 * valem as cadastradas no painel da hospedagem.
 *
 * @returns `true` se o arquivo existia e foi lido; `false` se não existe.
 */
export function carregarVariaveisDeAmbiente(caminho = '.env'): boolean {
  // Sem esta checagem o Node lança erro; e em produção não há arquivo .env.
  if (!existsSync(caminho)) {
    return false;
  }

  process.loadEnvFile(caminho);
  return true;
}
