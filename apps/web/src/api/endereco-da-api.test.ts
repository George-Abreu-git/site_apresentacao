import { describe, expect, it, vi } from 'vitest';
import { ENDERECO_PADRAO_DA_API, enderecoDaApi } from './endereco-da-api';

// `vi.stubEnv` troca uma variável de `import.meta.env` só durante o teste;
// o `vi.unstubAllEnvs()` em configurar-testes.ts devolve o valor original depois.
describe('endereço da API (variável de ambiente do Vite)', () => {
  it('usa o endereço da variável VITE_API_URL', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.exemplo.com');

    expect(enderecoDaApi()).toBe('https://api.exemplo.com');
  });

  it('tira a barra do final, para não gerar "//api/projetos" ao montar a URL', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.exemplo.com/');

    expect(enderecoDaApi()).toBe('https://api.exemplo.com');
  });

  it('sem a variável (ou com ela vazia), usa a API local de desenvolvimento', () => {
    vi.stubEnv('VITE_API_URL', '');

    expect(enderecoDaApi()).toBe(ENDERECO_PADRAO_DA_API);
    expect(ENDERECO_PADRAO_DA_API).toBe('http://localhost:3000');
  });
});
