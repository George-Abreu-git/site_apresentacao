// Tipos das variáveis de ambiente do front (import.meta.env), para o TypeScript
// conhecer o nome e o tipo de cada uma. Os tipos básicos do Vite vêm de "vite/client" (tsconfig.json).
interface ImportMetaEnv {
  /** Endereço base da API (ver src/api/endereco-da-api.ts e apps/web/.env.example). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
