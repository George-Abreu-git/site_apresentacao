// Onde o front encontra a API. O endereço muda por ambiente (desenvolvimento, Render),
// por isso vem de uma variável de ambiente do Vite, nunca escrito no código.
//
// O Vite só entrega ao código do navegador as variáveis com prefixo `VITE_`, e as
// copia para dentro do JavaScript no `npm run build`: o valor fica PÚBLICO.
// Endereço pode; segredo (ex.: token do GitHub) nunca (RNF-05). Modelo em apps/web/.env.example.

/** Endereço da API local (`npm run dev`), usado quando VITE_API_URL não foi definida. */
export const ENDERECO_PADRAO_DA_API = 'http://localhost:3000';

/** Endereço base da API, sem barra no final (ex.: "https://api.exemplo.com"). */
export function enderecoDaApi(): string {
  // Lido a cada chamada (e não no topo do arquivo) para os testes poderem trocar o valor com vi.stubEnv.
  const configurado = import.meta.env.VITE_API_URL?.trim();
  return (configurado || ENDERECO_PADRAO_DA_API).replace(/\/+$/, '');
}
