import type { Projeto } from '@site-apresentacao/shared';
import { describe, expect, it, vi } from 'vitest';
import { buscarProjetos } from './projetos';

const PROJETOS: Projeto[] = [
  { titulo: 'Projeto A', descricao: 'Descrição A', stacks: ['React'] },
  { titulo: 'Projeto B', descricao: 'Descrição B', stacks: ['NestJS'], github: { disponivel: false } },
];

/** Uma resposta HTTP de mentira, como a que o `fetch` devolveria. */
function respostaJson(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Troca o `fetch` do navegador por um dublê que sempre devolve `resposta`. */
function simularFetch(resposta: Response) {
  const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(resposta);
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

describe('buscarProjetos (GET /api/projetos)', () => {
  it('chama GET /api/projetos no endereço configurado', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.exemplo.com');
    const fetchFalso = simularFetch(respostaJson(PROJETOS));

    await buscarProjetos();

    expect(fetchFalso).toHaveBeenCalledWith('https://api.exemplo.com/api/projetos', expect.anything());
  });

  it('devolve a lista de projetos que a API respondeu', async () => {
    simularFetch(respostaJson(PROJETOS));

    await expect(buscarProjetos()).resolves.toEqual(PROJETOS);
  });

  it('repassa o sinal de cancelamento para o fetch', async () => {
    const fetchFalso = simularFetch(respostaJson(PROJETOS));
    const controlador = new AbortController();

    await buscarProjetos(controlador.signal);

    expect(fetchFalso).toHaveBeenCalledWith(expect.any(String), { signal: controlador.signal });
  });

  it('falha quando a API responde com erro (status fora de 200-299)', async () => {
    simularFetch(respostaJson({ message: 'Internal Server Error' }, 500));

    await expect(buscarProjetos()).rejects.toThrow('500');
  });

  it('falha quando a resposta não é uma lista', async () => {
    simularFetch(respostaJson({ projetos: PROJETOS }));

    await expect(buscarProjetos()).rejects.toThrow('lista');
  });

  it('falha quando a API responde 404 (ex.: endereço da API configurado errado)', async () => {
    simularFetch(respostaJson({ message: 'Not Found' }, 404));

    await expect(buscarProjetos()).rejects.toThrow('404');
  });

  it('falha quando o corpo não é JSON (ex.: página HTML de erro de um proxy, com status 200)', async () => {
    simularFetch(new Response('<html>Bad Gateway</html>', { status: 200 }));

    await expect(buscarProjetos()).rejects.toThrow();
  });

  it('falha quando a API responde null', async () => {
    simularFetch(respostaJson(null));

    await expect(buscarProjetos()).rejects.toThrow('lista');
  });

  it('falha quando algum projeto da lista está fora do formato (ex.: sem stacks), mesmo com os outros certos', async () => {
    simularFetch(respostaJson([...PROJETOS, { titulo: 'Sem stacks', descricao: 'Item fora do formato' }]));

    await expect(buscarProjetos()).rejects.toThrow('fora do formato');
  });

  it('devolve a lista vazia quando a API não tem projetos', async () => {
    simularFetch(respostaJson([]));

    await expect(buscarProjetos()).resolves.toEqual([]);
  });

  it('falha quando a rede falha (ex.: API fora do ar)', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(buscarProjetos()).rejects.toThrow('Failed to fetch');
  });
});
