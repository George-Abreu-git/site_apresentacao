// Áreas de escrita por agente e resolução de caminhos (T-001).
//
// Fonte da verdade: a tabela "Áreas por caminho" do AGENTS.md. Se a tabela
// mudar, este arquivo muda junto (e os testes em .claude/hooks/tests/).
//
// Os padrões são relativos à raiz do repositório e usam um glob mínimo:
//   `pasta/**` → a pasta e tudo dentro dela; `*` → qualquer trecho sem `/`.
// No Windows a comparação ignora maiúsculas/minúsculas, como o próprio NTFS.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const WINDOWS = process.platform === 'win32';

// Áreas de cada agente: `permitidos` menos `excecoes`.
// Agente sem entrada aqui (ex.: Explore, general-purpose) não tem área:
// não escreve em nenhum caminho do repositório.
// Área do dev, compartilhada com as réplicas dev-2 e dev-3 (T-035), que
// implementam outras tarefas em paralelo, cada uma no seu worktree.
const AREA_DEV = {
  permitidos: ['apps/**', 'packages/**'],
  excecoes: ['apps/api/test/**'], // testes de rotas: área do qa
};

export const AREAS = {
  dev: AREA_DEV,
  'dev-2': AREA_DEV,
  'dev-3': AREA_DEV,
  qa: {
    permitidos: ['e2e/**', 'apps/api/test/**'],
    excecoes: [],
  },
  instrutor: {
    permitidos: ['docs/04-estudos/**'],
    excecoes: [],
  },
  documentador: {
    permitidos: ['docs/04-estudos/**'],
    excecoes: [],
  },
  devops: {
    permitidos: [
      '.claude/**', 'AGENTS.md', 'CLAUDE.md', 'scripts/**', 'docs/**',
      '.github/**', 'infra/**', 'Dockerfile*', 'docker-compose*',
      // Qualquer arquivo solto na raiz: configs como .gitignore, .gitattributes,
      // package.json, .env.example, eslint.config.mjs, render.yaml, wrangler.toml.
      '*',
      '.obsidian/**',
    ],
    excecoes: [
      'docs/03-tarefas/**', // do orquestrador
      'docs/04-estudos/**', // do instrutor e do documentador
      'docs/02-arquitetura/ADR-*', // ADRs são criadas pelo orquestrador (registrar-decisao)
    ],
  },
  'code-reviewer': {
    permitidos: [], // somente leitura
    excecoes: [],
  },
};

// Regras que valem para todo subagente, antes da área de cada um.
// `decisao: 'perguntar'` mostra a confirmação ao George em vez de negar.
export const PROTEGIDOS = [
  {
    padrao: 'docs/03-tarefas/**',
    decisao: 'negar',
    motivo: 'docs/03-tarefas/ (notas de tarefa e backlog) é só do orquestrador',
  },
  {
    padrao: '.claude/agents/**',
    // O devops é o dono da plataforma, mas mudar a definição de um agente exige
    // aprovação do George (AGENTS.md): o hook pede a confirmação dele.
    decisao: { devops: 'perguntar', outros: 'negar' },
    motivo: '.claude/agents/ (definição dos agentes) só muda com aprovação explícita do George',
  },
  {
    padrao: 'package-lock.json',
    decisao: 'negar',
    motivo: 'package-lock.json é gerado pelo npm install e ninguém o edita à mão',
  },
  {
    padrao: '.git/**',
    decisao: 'negar',
    motivo: '.git/ é interno do git; use os comandos git (do orquestrador)',
  },
];

// Converte o glob mínimo em expressão regular ancorada.
function globParaRegex(padrao) {
  let fonte = '';
  for (let i = 0; i < padrao.length; i++) {
    const c = padrao[i];
    if (c === '*' && padrao[i + 1] === '*') {
      fonte += '.*';
      i++;
    } else if (c === '*') {
      fonte += '[^/]*';
    } else if (c === '?') {
      fonte += '[^/]';
    } else {
      fonte += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${fonte}$`, WINDOWS ? 'i' : '');
}

const cacheRegex = new Map();

// `rel` casa com o padrão? `pasta/**` também casa com a própria `pasta`.
export function casa(rel, padrao) {
  if (padrao.endsWith('/**')) {
    const base = padrao.slice(0, -3);
    if (igual(rel, base)) return true;
  }
  if (!cacheRegex.has(padrao)) cacheRegex.set(padrao, globParaRegex(padrao));
  return cacheRegex.get(padrao).test(rel);
}

function igual(a, b) {
  return WINDOWS ? a.toLowerCase() === b.toLowerCase() : a === b;
}

function comecaCom(texto, prefixo) {
  return WINDOWS
    ? texto.toLowerCase().startsWith(prefixo.toLowerCase())
    : texto.startsWith(prefixo);
}

// Parte literal de um padrão, antes do primeiro curinga, cortada na última `/`.
// Ex.: `apps/api/test/**` → `apps/api/test`; `docs/02-arquitetura/ADR-*` → `docs/02-arquitetura`.
function baseLiteral(padrao) {
  const corte = padrao.search(/[*?]/);
  if (corte === -1) return padrao;
  const antes = padrao.slice(0, corte);
  const barra = antes.lastIndexOf('/');
  return barra === -1 ? '' : antes.slice(0, barra);
}

// Algum caminho que casa com `padrao` pode estar dentro da pasta `rel`?
function padraoDentroDe(padrao, rel) {
  if (rel === '') return true;
  const base = baseLiteral(padrao);
  return igual(base, rel) || comecaCom(base, `${rel}/`) || casa(rel, padrao);
}

function decisaoProtegido(regra, agente) {
  if (typeof regra.decisao === 'string') return regra.decisao;
  return regra.decisao[agente] ?? regra.decisao.outros;
}

// Avalia a escrita de um subagente num caminho relativo à raiz do repositório.
// `subarvore: true` quando a operação atinge tudo o que está dentro do caminho
// (ex.: `rm -r pasta`, um glob): aí nenhuma pasta proibida pode estar lá dentro.
// Retorna { decisao: 'permitir' | 'negar' | 'perguntar', motivo }.
export function avaliarCaminho(agente, rel, { subarvore = false } = {}) {
  let perguntar = null;
  for (const regra of PROTEGIDOS) {
    const atinge = casa(rel, regra.padrao) || (subarvore && padraoDentroDe(regra.padrao, rel));
    if (!atinge) continue;
    const decisao = decisaoProtegido(regra, agente);
    // Numa subárvore inteira (ex.: `rm -r .claude`), nunca só "perguntar".
    if (decisao === 'negar' || (subarvore && !casa(rel, regra.padrao))) {
      return { decisao: 'negar', motivo: `${regra.motivo} (caminho: ${rel || '.'})` };
    }
    perguntar = { decisao: 'perguntar', motivo: `${regra.motivo} (caminho: ${rel}). Confirme só se a mudança foi aprovada.` };
  }
  if (perguntar) return perguntar;

  const area = AREAS[agente];
  const nome = area ? agente : `${agente || 'desconhecido'} (sem área no AGENTS.md)`;
  if (!area || area.permitidos.length === 0) {
    return { decisao: 'negar', motivo: `o agente ${nome} não escreve no repositório (caminho: ${rel || '.'})` };
  }
  const foraDaArea = { decisao: 'negar', motivo: `${rel || '.'} está fora da área do ${agente} (AGENTS.md, "Áreas por caminho")` };
  if (!area.permitidos.some((p) => casa(rel, p))) return foraDaArea;
  if (area.excecoes.some((p) => casa(rel, p))) return foraDaArea;
  const dentroDaPasta = subarvore && area.excecoes.find((p) => padraoDentroDe(p, rel));
  if (dentroDaPasta) {
    return {
      decisao: 'negar',
      motivo: `a operação atinge tudo dentro de ${rel || '.'}, inclusive ${dentroDaPasta}, que está fora da área do ${agente}`,
    };
  }
  return { decisao: 'permitir', motivo: '' };
}

// ---------------------------------------------------------------------------
// Resolução de caminhos
// ---------------------------------------------------------------------------

// Normaliza separadores e acentos (NFC), para comparar textos de caminho.
function padronizar(p) {
  return p.normalize('NFC').replace(/\\/g, '/');
}

// Resolve links, junções e nomes curtos do Windows (ex.: GEORGE~1.SIQ) pela
// parte do caminho que já existe; o resto (arquivo ainda não criado) é anexado.
export function caminhoReal(absoluto) {
  let atual = path.resolve(absoluto);
  const resto = [];
  for (;;) {
    try {
      const real = fs.realpathSync.native(atual);
      return padronizar(path.join(real, ...resto));
    } catch {
      const pai = path.dirname(atual);
      if (pai === atual) return padronizar(path.resolve(absoluto));
      resto.unshift(path.basename(atual));
      atual = pai;
    }
  }
}

// Caminho absoluto a partir do texto que aparece num comando ou num tool_input.
// Entende a grafia do Git Bash no Windows (/c/Users/..., /tmp) e o `~`.
// Retorna null quando não dá para resolver (ex.: diretório atual desconhecido).
export function resolverCaminho(texto, cwd) {
  let p = texto;
  if (p === '~' || p.startsWith('~/')) p = path.join(os.homedir(), p.slice(1));
  if (WINDOWS) {
    const drive = /^\/([a-zA-Z])(\/|$)/.exec(p);
    if (drive) p = `${drive[1].toUpperCase()}:/${p.slice(3)}`;
    else if (p === '/tmp' || p.startsWith('/tmp/')) p = path.join(os.tmpdir(), p.slice(4));
  }
  if (!path.isAbsolute(p)) {
    if (!cwd) return null;
    p = path.resolve(cwd, p);
  }
  return caminhoReal(p);
}

// Caminho relativo à raiz do repositório, ou null se estiver fora dele.
// Um worktree de subagente (.claude/worktrees/<nome>/) é uma cópia do
// repositório: o caminho é avaliado relativo à raiz desse worktree.
export function relativoAoRepositorio(absoluto, raiz) {
  const abs = padronizar(absoluto).replace(/\/+$/, '');
  const base = padronizar(raiz).replace(/\/+$/, '');
  let rel;
  if (igual(abs, base)) rel = '';
  else if (comecaCom(abs, `${base}/`)) rel = abs.slice(base.length + 1);
  else return null;
  const worktree = new RegExp('^\\.claude/worktrees/[^/]+(?:/|$)', WINDOWS ? 'i' : '');
  return rel.replace(worktree, '');
}

// Caminho especial que não é arquivo (descarta a saída).
export function ehDescarte(texto) {
  return /^(\/dev\/null|nul|\$null)$/i.test(texto);
}
