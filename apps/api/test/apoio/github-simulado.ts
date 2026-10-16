// Apoio dos testes de rota: GitHub simulado e log em memória.
//
// Os testes de rota sobem a API inteira, inclusive o GithubCliente de verdade. O que é
// simulado é só o `fetch` global (a "internet"): assim o caminho completo é exercitado
// (montagem do endereço, cabeçalhos, tradução da resposta, cache e plano B) sem ir ao GitHub.
import type { LoggerService } from '@nestjs/common';
import type { Projeto } from '@site-apresentacao/shared';
import { vi, type MockInstance } from 'vitest';

/** Trecho da resposta real de GET https://api.github.com/repos/{dono}/{nome}. */
export interface CorpoDoRepositorio {
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  [outros: string]: unknown;
}

export function repositorioNoGithub(dados: Partial<CorpoDoRepositorio> = {}): CorpoDoRepositorio {
  return {
    full_name: 'George-Abreu-git/site_apresentacao',
    language: 'TypeScript',
    stargazers_count: 7,
    pushed_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-05T08:00:00Z',
    ...dados,
  };
}

/** Cria uma resposta HTTP nova a cada chamada (o corpo de uma Response só pode ser lido uma vez). */
export function respostaJson(
  corpo: unknown,
  status = 200,
  cabecalhos: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'content-type': 'application/json', ...cabecalhos },
  });
}

export type Responder = (endereco: string, opcoes?: RequestInit) => Response | Promise<Response>;

/**
 * Troca o `fetch` global pelo GitHub simulado. O `responder` recebe o endereço pedido
 * e decide a resposta (ou lança erro, como uma falha de rede).
 */
export function simularGithub(responder: Responder): MockInstance<typeof fetch> {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (entrada, opcoes) => responder(String(entrada), opcoes));
}

/** Cabeçalhos enviados na chamada `indice` do fetch simulado. */
export function cabecalhosDaChamada(
  fetchSimulado: MockInstance<typeof fetch>,
  indice = 0,
): Record<string, string> {
  const opcoes = fetchSimulado.mock.calls[indice]?.[1];
  return (opcoes?.headers ?? {}) as Record<string, string>;
}

/** Logger do Nest que guarda tudo o que a API registraria, para os testes procurarem vazamentos. */
export class LogEmMemoria implements LoggerService {
  readonly linhas: string[] = [];

  log(...partes: unknown[]): void {
    this.guardar('log', partes);
  }
  error(...partes: unknown[]): void {
    this.guardar('error', partes);
  }
  warn(...partes: unknown[]): void {
    this.guardar('warn', partes);
  }
  debug(...partes: unknown[]): void {
    this.guardar('debug', partes);
  }
  verbose(...partes: unknown[]): void {
    this.guardar('verbose', partes);
  }
  fatal(...partes: unknown[]): void {
    this.guardar('fatal', partes);
  }

  get texto(): string {
    return this.linhas.join('\n');
  }

  private guardar(nivel: string, partes: unknown[]): void {
    const texto = partes
      .map((parte) => {
        if (parte instanceof Error) return `${parte.message}\n${parte.stack}`;
        if (typeof parte === 'object' && parte !== null) return JSON.stringify(parte);
        return String(parte);
      })
      .join(' ');
    this.linhas.push(`[${nivel}] ${texto}`);
  }
}

/** O projeto sem o campo `github` (preenchido pela API): o que veio do arquivo curado. */
export function semGithub(projeto: Projeto): Omit<Projeto, 'github'> {
  const copia = { ...projeto };
  delete copia.github;
  return copia;
}
