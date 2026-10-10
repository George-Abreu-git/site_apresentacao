import react from '@vitejs/plugin-react';
// `defineConfig` do Vitest é o mesmo do Vite, com o bloco `test` tipado.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom simula o navegador (document, window) dentro do Node.
    environment: 'jsdom',
    setupFiles: ['./src/configurar-testes.ts'],
    // Por padrão o Vitest ignora o CSS (todo import de .css chega vazio, para os testes
    // ficarem rápidos). Liberamos só os imports com `?raw`, usados em src/tema.test.ts
    // para ler o texto dos arquivos e conferir que não há cor fixa fora do tema (RNF-04).
    // Os imports normais seguem ignorados: o jsdom não aplica o CSS e não esconde
    // elementos dos testes por causa de regras como `display: none`.
    css: { include: [/\.css\?raw$/] },
  },
});
