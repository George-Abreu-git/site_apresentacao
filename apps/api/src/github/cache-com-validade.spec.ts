import { describe, expect, it } from 'vitest';
import { CacheComValidade } from './cache-com-validade.js';

/** Relógio controlado pelo teste: o cache pergunta a hora a ele, e o teste a adianta. */
function criarRelogio() {
  let agora = 1_000;
  return {
    agora: () => agora,
    adiantar: (ms: number) => {
      agora += ms;
    },
  };
}

describe('CacheComValidade', () => {
  it('devolve undefined para uma chave que nunca foi guardada', () => {
    const cache = new CacheComValidade<number>(1000);

    expect(cache.obter('nada')).toBeUndefined();
  });

  it('devolve o valor guardado enquanto ele está dentro da validade', () => {
    const relogio = criarRelogio();
    const cache = new CacheComValidade<string>(1000, relogio.agora);

    cache.guardar('chave', 'valor');
    relogio.adiantar(999);

    expect(cache.obter('chave')).toBe('valor');
  });

  it('deixa de devolver o valor quando a validade termina', () => {
    const relogio = criarRelogio();
    const cache = new CacheComValidade<string>(1000, relogio.agora);

    cache.guardar('chave', 'valor');
    relogio.adiantar(1000);

    expect(cache.obter('chave')).toBeUndefined();
  });

  it('guardar de novo renova o valor e a validade', () => {
    const relogio = criarRelogio();
    const cache = new CacheComValidade<string>(1000, relogio.agora);

    cache.guardar('chave', 'antigo');
    relogio.adiantar(800);
    cache.guardar('chave', 'novo');
    relogio.adiantar(800);

    expect(cache.obter('chave')).toBe('novo');
  });

  it('cada chave tem a sua própria validade', () => {
    const relogio = criarRelogio();
    const cache = new CacheComValidade<string>(1000, relogio.agora);

    cache.guardar('a', 'A');
    relogio.adiantar(600);
    cache.guardar('b', 'B');
    relogio.adiantar(600);

    expect(cache.obter('a')).toBeUndefined();
    expect(cache.obter('b')).toBe('B');
  });
});
