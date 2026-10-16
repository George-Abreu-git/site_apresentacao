import { describe, expect, it } from 'vitest';
import { SECOES, idDoTituloDaSecao } from './secoes';

describe('lista de seções da página (RF-01)', () => {
  it('tem as seis seções, na ordem em que aparecem na página', () => {
    expect(SECOES.map((secao) => secao.titulo)).toEqual([
      'Início',
      'Sobre',
      'Stacks',
      'Projetos',
      'Serviços',
      'Contato',
    ]);
  });

  it('usa ids sem acento nem espaço, que funcionam bem como âncora na URL (#sobre)', () => {
    for (const secao of SECOES) {
      expect(secao.id).toMatch(/^[a-z]+$/);
    }
  });

  it('o id do título da seção é o id da seção com o sufixo "-titulo"', () => {
    expect(idDoTituloDaSecao('projetos')).toBe('projetos-titulo');
  });
});
