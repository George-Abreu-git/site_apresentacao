// Prova de que o front enxerga os tipos de packages/shared (critério da T-005).
// `expectTypeOf` não faz nada ao rodar: quem confere é o TypeScript, no `npm run build`
// (`tsc -b` checa também os testes). Se o import ou o tipo quebrar, o build falha.
// Quando a T-012 usar `Projeto` nos cards, este teste pode sair.
import type { Projeto } from '@site-apresentacao/shared';
import { describe, expectTypeOf, it } from 'vitest';

describe('pacote compartilhado no front', () => {
  it('importa o tipo Projeto de @site-apresentacao/shared', () => {
    expectTypeOf<Projeto>().toHaveProperty('titulo').toEqualTypeOf<string>();
    expectTypeOf<Projeto>().toHaveProperty('stacks').toEqualTypeOf<string[]>();
  });
});
