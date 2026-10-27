// Política dos hooks de restrição de escrita por agente (T-001).
//
// Entrada: o JSON que o Claude Code manda ao hook PreToolUse (ver
// https://code.claude.com/docs/en/hooks). Os campos que importam aqui:
//   agent_id   → só existe quando quem chama a ferramenta é um SUBAGENTE.
//                Sem ele, é a sessão principal (o orquestrador): nunca bloqueada.
//   agent_type → o `name` do frontmatter do subagente (dev, qa, devops...).
//   tool_name / tool_input / cwd.
// Saída: { decisao: 'permitir' | 'negar' | 'perguntar', motivo }.
//
// O que fica de fora (limites conhecidos, conferidos pelo orquestrador com
// `git status` e pelo code-reviewer no diff): o que um script executado faz
// por dentro (`node script.mjs`, `npm run x`), e escritas indiretas que só
// aparecem em tempo de execução. O hook é uma grade de proteção contra o
// engano comum, não uma caixa de areia.
import fs from 'node:fs';
import {
  avaliarCaminho, caminhoReal, ehDescarte, relativoAoRepositorio, resolverCaminho,
} from './areas.mjs';
import { alvoDeEscrita, ErroDeAnalise, separarComandos, tokenizar } from './shell.mjs';

const PERMITIR = Object.freeze({ decisao: 'permitir', motivo: '' });
const negar = (motivo) => ({ decisao: 'negar', motivo });

const FERRAMENTAS_DE_ARQUIVO = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const SOMENTE_LEITURA = new Set(['code-reviewer']);
const PROFUNDIDADE_MAXIMA = 4;

// Trechos de caminho protegidos procurados em código inline (`node -e`, `python -c`...).
const TRECHO_PROTEGIDO = /03-tarefas|\.claude[\\/]+agents/i;

export function avaliar(entrada, { raiz }) {
  if (!entrada || typeof entrada !== 'object') return PERMITIR;
  // Sessão principal (orquestrador): nunca bloqueada (decisão D1 da T-001).
  if (!entrada.agent_id) return PERMITIR;

  const ctx = {
    agente: typeof entrada.agent_type === 'string' ? entrada.agent_type : '',
    raiz: caminhoReal(raiz),
    cwd: typeof entrada.cwd === 'string' && entrada.cwd ? entrada.cwd : raiz,
  };
  const ferramenta = entrada.tool_name;
  const dados = entrada.tool_input ?? {};

  if (FERRAMENTAS_DE_ARQUIVO.has(ferramenta)) {
    return avaliarArquivo(ctx, dados.file_path ?? dados.notebook_path);
  }
  if (ferramenta === 'Bash') return combinar(avaliarBash(ctx, dados.command));
  if (ferramenta === 'PowerShell') return combinar(avaliarPowerShell(ctx, dados.command));
  return PERMITIR;
}

// Junta os achados de um comando: negar > perguntar > permitir.
function combinar(achados) {
  const negados = achados.filter((a) => a.decisao === 'negar');
  if (negados.length) {
    const motivos = [...new Set(negados.map((a) => a.motivo))];
    return negar(motivos.slice(0, 3).join('; '));
  }
  const perguntas = achados.filter((a) => a.decisao === 'perguntar');
  if (perguntas.length) return { decisao: 'perguntar', motivo: perguntas[0].motivo };
  return PERMITIR;
}

// ---------------------------------------------------------------------------
// Edit / Write
// ---------------------------------------------------------------------------

function avaliarArquivo(ctx, caminho) {
  if (SOMENTE_LEITURA.has(ctx.agente)) {
    return negar(`o ${ctx.agente} é somente leitura: não usa Edit/Write`);
  }
  if (typeof caminho !== 'string' || !caminho) return negar('caminho do arquivo ausente');
  const absoluto = resolverCaminho(caminho, ctx.cwd);
  if (!absoluto) return negar(`não foi possível resolver o caminho ${caminho}`);
  const rel = relativoAoRepositorio(absoluto, ctx.raiz);
  if (rel === null) return PERMITIR; // fora do repositório: fora do escopo da tabela de áreas
  return avaliarCaminho(ctx.agente, rel);
}

// ---------------------------------------------------------------------------
// Bash
// ---------------------------------------------------------------------------

function avaliarBash(ctx, comando) {
  if (typeof comando !== 'string' || !comando.trim()) return [negar('comando vazio')];
  const estado = { ...ctx, leitura: SOMENTE_LEITURA.has(ctx.agente) };
  return analisarTexto(comando, estado, estado.cwd, 0);
}

function analisarTexto(texto, estado, cwdInicial, profundidade) {
  if (profundidade > PROFUNDIDADE_MAXIMA) return [negar('comando aninhado demais para analisar')];
  let resultado;
  try {
    resultado = tokenizar(texto);
  } catch (erro) {
    if (erro instanceof ErroDeAnalise) return [negar(`comando não pôde ser analisado (${erro.message})`)];
    throw erro;
  }
  const achados = [];
  for (const sub of resultado.substituicoes) {
    achados.push(...analisarTexto(sub, estado, cwdInicial, profundidade + 1));
  }
  let itens;
  try {
    itens = separarComandos(resultado.tokens);
  } catch (erro) {
    if (erro instanceof ErroDeAnalise) return [negar(`comando não pôde ser analisado (${erro.message})`)];
    throw erro;
  }
  // `cd` muda o diretório dos comandos seguintes; dentro de `( ... )` vale só lá.
  const local = { cwd: cwdInicial };
  const pilha = [];
  for (const item of itens) {
    if (item.tipo === 'abre') pilha.push(local.cwd);
    else if (item.tipo === 'fecha') local.cwd = pilha.length ? pilha.pop() : local.cwd;
    else achados.push(...avaliarComandoSimples(item, estado, local, profundidade));
  }
  return achados;
}

// Palavra sintética (ex.: destino/nome-do-arquivo de um `mv`). Herda as marcas da base.
const palavra = (texto, base = {}) => ({
  texto, dinamico: !!base.dinamico, glob: !!base.glob, chaves: !!base.chaves, citada: !!base.citada,
});

const LIMITE_DE_EXPANSOES = 256;

// Expansão de chaves do bash: `a/{b,c}/d` → a/b/d e a/c/d; `f{1..3}` → f1, f2, f3.
// Devolve null se passar do limite. Chave sem `,` nem sequência fica literal.
export function expandirChaves(texto, limite = LIMITE_DE_EXPANSOES) {
  for (let i = 0; i < texto.length; i++) {
    if (texto[i] !== '{') continue;
    let profundidade = 0;
    let fim = -1;
    const virgulas = [];
    for (let j = i; j < texto.length; j++) {
      if (texto[j] === '{') profundidade++;
      else if (texto[j] === '}' && --profundidade === 0) {
        fim = j;
        break;
      } else if (texto[j] === ',' && profundidade === 1) virgulas.push(j);
    }
    if (fim === -1) continue;
    const miolo = texto.slice(i + 1, fim);
    let alternativas;
    if (virgulas.length) {
      alternativas = [];
      let inicio = i + 1;
      for (const v of [...virgulas, fim]) {
        alternativas.push(texto.slice(inicio, v));
        inicio = v + 1;
      }
    } else {
      alternativas = sequencia(miolo, limite);
      if (alternativas === undefined) continue; // `{x}`: literal
      if (alternativas === null) return null;
    }
    const resultado = [];
    for (const alternativa of alternativas) {
      const parcial = expandirChaves(texto.slice(0, i) + alternativa + texto.slice(fim + 1), limite);
      if (!parcial) return null;
      resultado.push(...parcial);
      if (resultado.length > limite) return null;
    }
    return resultado;
  }
  return [texto];
}

// `1..5`, `5..1..2`, `a..e`: undefined se não for sequência; null se grande demais.
function sequencia(miolo, limite) {
  const m = /^(-?\d+|[^.])\.\.(-?\d+|[^.])(?:\.\.(-?\d+))?$/.exec(miolo);
  if (!m) return undefined;
  const numerica = /^-?\d+$/.test(m[1]) && /^-?\d+$/.test(m[2]);
  if (!numerica && (m[1].length !== 1 || m[2].length !== 1)) return undefined;
  const de = numerica ? Number(m[1]) : m[1].codePointAt(0);
  const ate = numerica ? Number(m[2]) : m[2].codePointAt(0);
  const passo = Math.abs(Number(m[3] ?? 1)) || 1;
  if (Math.abs(ate - de) / passo + 1 > limite) return null;
  const valores = [];
  for (let v = de; de <= ate ? v <= ate : v >= ate; v += de <= ate ? passo : -passo) {
    valores.push(numerica ? String(v) : String.fromCodePoint(v));
  }
  return valores;
}

// Junta decisões de vários alvos: negar > perguntar > permitir.
const maisRestritiva = (decisoes) => decisoes.find((d) => d.decisao === 'negar')
  ?? decisoes.find((d) => d.decisao === 'perguntar') ?? PERMITIR;

// Trecho com curinga pode sair da pasta antes do corte? Sim se, a partir do
// nome que tem o curinga, houver um segmento `..` (`apps/web/*/../../docs`) ou
// um nome que começa com `.` ou `[` e tem curinga (`.?` e `[.][.]` casam com `..`).
function curingaPodeSubir(resto) {
  return resto.split('/').some((segmento) => segmento === '..'
    || (/^[.[]/.test(segmento) && /[*?[]/.test(segmento)));
}

// Confere um alvo de escrita. `subarvore` quando a operação atinge o que há dentro.
function conferirAlvo(alvo, estado, cwd, { subarvore = false, seDiretorio = false } = {}) {
  if (alvo.dinamico) return negar(`alvo dinâmico "${alvo.texto || '$…'}" não pode ser verificado`);
  let texto = alvo.texto;
  if (ehDescarte(texto)) return PERMITIR;
  if (!texto) return negar('alvo vazio');
  if (texto.startsWith(':')) return negar(`pathspec especial do git "${texto}" não é verificado`);
  if (alvo.chaves) {
    // Chaves viram vários caminhos: confere cada um. Com aspas no meio, só uma
    // parte das chaves expande; em vez de adivinhar, nega.
    if (alvo.citada) return negar(`chaves com aspas em "${texto}" não são verificadas`);
    const expansoes = expandirChaves(texto);
    if (!expansoes) return negar(`expansão de chaves grande demais em "${texto}"`);
    return maisRestritiva(expansoes.map((e) => conferirAlvo(
      palavra(e, { glob: /[*?[]/.test(e) }), estado, cwd, { subarvore, seDiretorio },
    )));
  }
  let emSubarvore = subarvore;
  if (alvo.glob) {
    // Com curinga, vale a pasta antes dele inteira: nada proibido pode estar lá dentro.
    const antes = texto.slice(0, texto.search(/[*?[{]/));
    const barra = antes.lastIndexOf('/');
    if (curingaPodeSubir(texto.slice(barra + 1))) {
      return negar(`curinga em "${texto}" pode sair da pasta (".." ou nome com ponto inicial): não é verificado`);
    }
    texto = barra === -1 ? '.' : antes.slice(0, barra) || '/';
    emSubarvore = true;
  }
  const absoluto = resolverCaminho(texto, cwd);
  if (!absoluto) return negar(`diretório atual desconhecido para o alvo "${alvo.texto}"`);
  const rel = relativoAoRepositorio(absoluto, estado.raiz);
  if (rel === null) return PERMITIR;
  if (seDiretorio && ehDiretorio(absoluto)) emSubarvore = true;
  return avaliarCaminho(estado.agente, rel, { subarvore: emSubarvore });
}

function ehDiretorio(absoluto) {
  try {
    return fs.statSync(absoluto).isDirectory();
  } catch {
    return false;
  }
}

// Separa opções e argumentos posicionais. `comValor`: opções que consomem o
// próximo argumento (ex.: `-m 755`). Depois de `--`, tudo é posicional.
function separarArgs(args, comValor = new Set()) {
  const opcoes = [];
  const posicionais = [];
  let fimDasOpcoes = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const t = a.texto;
    if (!fimDasOpcoes && t === '--' && !a.dinamico) {
      fimDasOpcoes = true;
      continue;
    }
    if (!fimDasOpcoes && t.length > 1 && t.startsWith('-') && !a.dinamico) {
      const nome = t.includes('=') ? t.slice(0, t.indexOf('=')) : t;
      let valor = t.includes('=') ? palavra(t.slice(t.indexOf('=') + 1), a) : null;
      if (!valor && comValor.has(nome) && i + 1 < args.length) valor = args[++i];
      opcoes.push({ nome, valor });
      continue;
    }
    posicionais.push(a);
  }
  return { opcoes, posicionais };
}

// Alguma opção curta (inclusive agrupada, como `-rf`) ou longa presente?
function temOpcao(opcoes, curtas, longas = []) {
  return opcoes.some(({ nome }) => longas.includes(nome)
    || (/^-[^-]/.test(nome) && [...nome.slice(1)].some((c) => curtas.includes(c))));
}

function valorDe(opcoes, nomes) {
  const achada = opcoes.find((o) => nomes.includes(o.nome) && o.valor);
  return achada ? achada.valor : null;
}

const ATRIBUICAO = /^[A-Za-z_][A-Za-z0-9_]*=/;

// Variáveis de ambiente que o code-reviewer pode definir antes de um comando.
// `IFS` só muda a separação de palavras do próprio shell (`while IFS= read -r l`).
// `E2E_PORTA_FRONT` só escolhe a porta do front no e2e de um worktree (T-035).
const VARIAVEIS_SEGURAS = new Set([
  'PYTHONUTF8', 'PYTHONIOENCODING', 'CI', 'FORCE_COLOR', 'NO_COLOR', 'LANG', 'LC_ALL', 'LC_CTYPE',
  'TZ', 'TERM', 'COLUMNS', 'IFS', 'E2E_PORTA_FRONT',
]);

function atribuicaoSegura(a) {
  const [nome, ...valor] = a.texto.split('=');
  if (VARIAVEIS_SEGURAS.has(nome)) return true;
  // Paginador só se for o `cat` (o valor é um comando que o git executa).
  return (nome === 'GIT_PAGER' || nome === 'PAGER') && !a.dinamico && valor.join('=') === 'cat';
}

// Atribuição solta (`n=0`, sem comando) de variável em minúsculas: fica só no
// shell. As variáveis que mudam o que um programa executa (PATH, GIT_*,
// NODE_OPTIONS, PAGER...) são maiúsculas e algumas já vêm exportadas; essas não.
const VARIAVEL_LOCAL = /^[a-z][a-z0-9_]*=/;

// Variáveis negadas a todo subagente: apontam o git para outro repositório,
// árvore ou índice (como `--git-dir`/`--work-tree`, já negados).
const VARIAVEIS_PROIBIDAS = /^(GIT_DIR|GIT_WORK_TREE|GIT_INDEX_FILE|GIT_NAMESPACE)(=|$)/;
// Qualquer GIT_* ou PAGER antes do comando faz o git executar outro programa
// (diff externo, pager, ssh...). Negadas para todo subagente, menos GIT_PAGER=cat
// e PAGER=cat, tratadas em `atribuicaoSegura`.
const GIT_OU_PAGER = /^(GIT_[A-Z0-9_]*|PAGER)=/;
// HOME, XDG_CONFIG_HOME, CURL_HOME e WGETRC mudam de onde curl, wget e git leem
// a configuração: negadas só quando o comando é um desses (`COMANDOS_SENSIVEIS_HOME`).
const VARIAVEIS_CONFIG_HOME = /^(HOME|XDG_CONFIG_HOME|CURL_HOME|WGETRC)(=|$)/;
const COMANDOS_SENSIVEIS_HOME = new Set(['curl', 'wget', 'git']);
// Comandos que definem ou exportam variáveis do shell.
const DEFINEM_VARIAVEIS = new Set(['export', 'declare', 'typeset', 'local', 'readonly']);

// Embrulhos: comandos que executam o comando seguinte. Cada um tem uma lista
// de opções conhecidas; opção fora da lista é negada para subagentes (o valor
// dela poderia virar o "nome do comando" e esconder um `rm`).
//   curtas: letras sem valor (podem vir agrupadas: `-iv`);
//   comValor: letras que consomem um valor (o resto do grupo ou o próximo argumento);
//   coladas: letras cujo valor opcional só vem colado (`xargs -i{}`);
//   longas / longasComValor: idem para opções longas (`--x=valor` ou `--x valor`);
//   numerica: aceita a forma antiga `-10` (nice);
//   posicionais: argumentos antes do comando (a duração do `timeout`);
//   atribuicoes: aceita `VAR=valor` antes do comando (env);
//   pasta: opções que trocam a pasta do comando (`env -C`, `sudo -D`);
//   saida: opções cujo valor é um arquivo gravado (`time -o`);
//   negadas: opções que o hook não analisa (`env -S` divide um texto em comando);
//   naoExecuta: opções que só mostram algo (`command -v`).
// `--help` e `--version` nunca executam o comando.
const EMBRULHOS = {
  command: { curtas: 'p', naoExecuta: ['-v', '-V'] },
  builtin: {},
  exec: { curtas: 'cl', comValor: 'a' },
  nohup: {},
  time: {
    curtas: 'pvqa',
    comValor: 'of',
    longas: ['--portability', '--verbose', '--quiet', '--append'],
    longasComValor: ['--output', '--format'],
    saida: ['-o', '--output'],
  },
  stdbuf: { comValor: 'ioe', longasComValor: ['--input', '--output', '--error'] },
  nice: { comValor: 'n', longasComValor: ['--adjustment'], numerica: true },
  timeout: {
    curtas: 'v',
    comValor: 'sk',
    longas: ['--verbose', '--preserve-status', '--foreground'],
    longasComValor: ['--signal', '--kill-after'],
    posicionais: 1,
  },
  env: {
    curtas: 'iv0',
    comValor: 'uC',
    longas: ['--ignore-environment', '--null', '--debug', '--block-signal', '--default-signal', '--ignore-signal', '--list-signal-handling'],
    longasComValor: ['--unset', '--chdir'],
    atribuicoes: true,
    pasta: ['-C', '--chdir'],
    negadas: ['-S', '--split-string'],
  },
  sudo: {
    curtas: 'EHnkSb',
    comValor: 'ugpD',
    longas: ['--preserve-env', '--set-home', '--non-interactive', '--reset-timestamp', '--stdin', '--background'],
    longasComValor: ['--user', '--group', '--prompt', '--chdir'],
    pasta: ['-D', '--chdir'],
  },
  doas: { curtas: 'n', comValor: 'u' },
  xargs: {
    curtas: '0rtpxo',
    comValor: 'adEILnPs',
    coladas: 'iel',
    longas: ['--null', '--no-run-if-empty', '--verbose', '--interactive', '--exit', '--open-tty', '--replace', '--eof', '--max-lines'],
    longasComValor: ['--arg-file', '--delimiter', '--max-args', '--max-procs', '--max-chars', '--process-slot-var'],
  },
};
// Embrulhos que o hook não analisa (opções e efeitos variados): negados para subagentes.
// Inclui os executores do Windows/Git Bash (`cmd`, `start`, `winpty`, `wsl`), que
// rodam outro comando com uma sintaxe que o hook não reconstrói.
const EMBRULHOS_NAO_ANALISADOS = new Set([
  'chroot', 'chrt', 'flock', 'ionice', 'ltrace', 'nsenter', 'parallel', 'script', 'setsid',
  'strace', 'taskset', 'unbuffer', 'unshare', 'watch',
  'cmd', 'start', 'winpty', 'wsl',
]);

// Lê as opções de um embrulho. Devolve { resto, executa, negada, atribuicoes, opcoes }
// em que `resto` é o comando embrulhado e `opcoes` as opções com valor.
function lerEmbrulho(spec, args) {
  const r = { resto: [], executa: true, negada: null, atribuicoes: [], opcoes: [], posicionalDinamico: false };
  const curtas = spec.curtas ?? '';
  const comValor = spec.comValor ?? '';
  const coladas = spec.coladas ?? '';
  let i = 0;
  for (; i < args.length; i++) {
    const a = args[i];
    const t = a.texto;
    if (spec.atribuicoes && ATRIBUICAO.test(t)) {
      r.atribuicoes.push(a);
      continue;
    }
    if (a.dinamico) break; // vira o nome do comando (dinâmico → negado)
    if (r.atribuicoes.length || !t.startsWith('-')) break; // depois de `VAR=x`, não há mais opções
    if (t === '--') {
      i++;
      break;
    }
    if (t === '-') {
      if (!spec.atribuicoes) break; // `env -` é o mesmo que `env -i`
      continue;
    }
    if (t.startsWith('--')) {
      const igual = t.indexOf('=');
      const nome = igual === -1 ? t : t.slice(0, igual);
      if (nome === '--help' || nome === '--version') {
        r.executa = false;
        return r;
      }
      if (spec.negadas?.includes(nome)) {
        r.negada = nome;
        return r;
      }
      if (spec.longasComValor?.includes(nome)) {
        r.opcoes.push({ nome, valor: igual === -1 ? (args[++i] ?? null) : palavra(t.slice(igual + 1), a) });
      } else if (!spec.longas?.includes(nome)) {
        r.negada = nome;
        return r;
      }
      continue;
    }
    if (spec.numerica && /^-[-+]?\d+$/.test(t)) continue;
    for (let j = 1; j < t.length; j++) {
      const c = t[j];
      const nome = `-${c}`;
      if (spec.negadas?.includes(nome)) {
        r.negada = nome;
        return r;
      }
      if (spec.naoExecuta?.includes(nome)) {
        r.executa = false;
        return r;
      }
      if (curtas.includes(c)) continue;
      if (coladas.includes(c)) break; // o resto do grupo é o valor
      if (comValor.includes(c)) {
        r.opcoes.push({ nome, valor: j + 1 < t.length ? palavra(t.slice(j + 1), a) : (args[++i] ?? null) });
        break;
      }
      r.negada = nome;
      return r;
    }
  }
  const posic = Math.min(spec.posicionais ?? 0, args.length - i);
  // Posicional dinâmico (ex.: `timeout $(echo --foreground) 5 rm ...`): a palavra
  // dinâmica é consumida como a duração e `5` viraria o "nome do comando". Negado.
  if (spec.posicionais && args.slice(i, i + posic).some((a) => a.dinamico)) r.posicionalDinamico = true;
  i += posic;
  r.resto = args.slice(i);
  return r;
}

// Tira atribuições (`VAR=x cmd`), palavras reservadas que sobram depois de um
// `time` (`time { ...; }`) e embrulhos (`nohup cmd`, `env -C pasta cmd`).
// Devolve { palavras, atribuicoes, cwd, saidas, negacao, embrulhado }:
//   cwd → a pasta em que o comando roda (muda com `env -C`; null = desconhecida);
//   saidas → arquivos gravados pelo embrulho ({ alvo, cwd });
//   negacao → motivo, quando há opção de embrulho que o hook não analisa.
function desembrulhar(entrada, cwdInicial) {
  const r = { palavras: entrada.slice(), atribuicoes: [], cwd: cwdInicial, saidas: [], negacao: null, embrulhado: false };
  for (;;) {
    let p = r.palavras;
    while (p.length && ATRIBUICAO.test(p[0].texto)) r.atribuicoes.push(p.shift());
    while (p.length && !p[0].citada && !p[0].dinamico && (p[0].texto === '{' || p[0].texto === '!')) p.shift();
    if (!p.length || p[0].dinamico) return r;
    const nome = nomeDoComando(p[0]);
    if (EMBRULHOS_NAO_ANALISADOS.has(nome)) {
      r.negacao = `${nome} executa outro comando e não é analisado`;
      return r;
    }
    const spec = EMBRULHOS[nome];
    if (!spec || nome === 'xargs') return r; // o xargs tem análise própria
    r.embrulhado = true;
    const lido = lerEmbrulho(spec, p.slice(1));
    if (lido.negada) {
      r.negacao = `${nome} ${lido.negada}: opção de embrulho fora da lista conhecida não é analisada`;
      return r;
    }
    if (lido.posicionalDinamico) {
      r.negacao = `${nome}: argumento dinâmico antes do comando não pode ser verificado`;
      return r;
    }
    r.atribuicoes.push(...lido.atribuicoes);
    for (const { nome: opcao, valor } of lido.opcoes) {
      if (spec.saida?.includes(opcao) && valor) r.saidas.push({ alvo: valor, cwd: r.cwd });
      if (spec.pasta?.includes(opcao)) {
        r.cwd = !valor || valor.dinamico || valor.glob || valor.chaves ? null : resolverCaminho(valor.texto, r.cwd);
      }
    }
    r.palavras = lido.executa ? lido.resto : [];
  }
}

function nomeDoComando(p) {
  const base = p.texto.replace(/\\/g, '/').split('/').pop();
  return base.replace(/\.exe$/i, '').toLowerCase();
}

function avaliarComandoSimples(item, estado, local, profundidade) {
  const achados = [];

  // 1. Redirecionamentos de saída (`>`, `>>`, `&>`, `2>`...).
  for (const r of item.redirecoes) {
    const alvo = alvoDeEscrita(r);
    if (!alvo) continue;
    if (estado.leitura && !ehDescarte(alvo.texto)) {
      achados.push(negar(`o ${estado.agente} é somente leitura: redirecionamento para arquivo (${alvo.texto})`));
    } else {
      achados.push(conferirAlvo(alvo, estado, local.cwd));
    }
  }

  // 2. O comando em si. Antes, as chaves viram palavras separadas, como no bash
  // (`sed -i {s/a/b/,arquivo}` → `sed -i s/a/b/ arquivo`).
  const expandidas = [];
  for (const p of item.palavras) {
    if (!p.chaves) {
      expandidas.push(p);
      continue;
    }
    if (p.citada) {
      achados.push(negar(`chaves com aspas em "${p.texto}" não são verificadas`));
      return achados;
    }
    const lista = expandirChaves(p.texto);
    if (!lista) {
      achados.push(negar(`expansão de chaves grande demais em "${p.texto}"`));
      return achados;
    }
    for (const e of lista) expandidas.push(palavra(e, { dinamico: p.dinamico, glob: /[*?[]/.test(e) }));
  }
  const { palavras, atribuicoes, cwd, saidas, negacao, embrulhado } = desembrulhar(expandidas, local.cwd);
  if (negacao) {
    achados.push(negar(negacao));
    return achados;
  }
  const nomeDaVariavel = (a) => a.texto.split('=')[0];
  const proibida = atribuicoes.find((a) => VARIAVEIS_PROIBIDAS.test(a.texto));
  if (proibida) {
    achados.push(negar(`variável ${nomeDaVariavel(proibida)} (outro repositório ou árvore do git) não é verificada`));
    return achados;
  }
  // Qualquer GIT_* (ou PAGER) antes do comando muda o que o git executa (diff
  // externo, pager, ssh...): negado para TODO subagente, menos GIT_PAGER=cat e
  // PAGER=cat (D6, bloqueante 4).
  const gitEnv = atribuicoes.find((a) => GIT_OU_PAGER.test(a.texto) && !atribuicaoSegura(a));
  if (gitEnv) {
    achados.push(negar(`variável ${nomeDaVariavel(gitEnv)} muda o que o git ou o pager executa: não é verificada`));
    return achados;
  }
  if (estado.leitura) {
    // Variáveis como GIT_EXTERNAL_DIFF, GIT_PAGER ou NODE_OPTIONS fazem um comando
    // de leitura executar outro programa: o code-reviewer só usa as da lista
    // (e, em atribuição solta, variáveis locais em minúsculas).
    const solta = !palavras.length && !embrulhado;
    const insegura = atribuicoes.find((a) => !atribuicaoSegura(a) && !(solta && VARIAVEL_LOCAL.test(a.texto)));
    if (insegura) {
      achados.push(negar(`o ${estado.agente} é somente leitura: variável "${nomeDaVariavel(insegura)}" não está na lista de variáveis seguras`));
      return achados;
    }
    if (saidas.length) {
      achados.push(negar(`o ${estado.agente} é somente leitura: time -o grava arquivo (${saidas[0].alvo.texto})`));
      return achados;
    }
  } else {
    for (const s of saidas) achados.push(conferirAlvo(s.alvo, estado, s.cwd));
  }
  if (!palavras.length) return achados;
  if (palavras[0].dinamico) {
    achados.push(negar(`nome de comando dinâmico ("${palavras[0].texto || '$…'}") não pode ser verificado`));
    return achados;
  }
  const nome = nomeDoComando(palavras[0]);
  const args = palavras.slice(1);

  if (DEFINEM_VARIAVEIS.has(nome)) {
    const exportada = args.find((a) => VARIAVEIS_PROIBIDAS.test(a.texto)
      || (GIT_OU_PAGER.test(a.texto) && !atribuicaoSegura(a)));
    if (exportada) {
      achados.push(negar(`${nome} ${nomeDaVariavel(exportada)}: variável proibida para subagentes`));
      return achados;
    }
  }
  // HOME/XDG_CONFIG_HOME/CURL_HOME/WGETRC mudam de onde curl, wget e git leem a
  // configuração: negadas só quando o comando é um desses (D6, opcional 6).
  if (COMANDOS_SENSIVEIS_HOME.has(nome)) {
    const configHome = atribuicoes.find((a) => VARIAVEIS_CONFIG_HOME.test(a.texto));
    if (configHome) {
      achados.push(negar(`variável ${nomeDaVariavel(configHome)} muda a configuração de ${nome}: não é verificada`));
      return achados;
    }
  }
  if (embrulhado && ['cd', 'pushd', 'popd'].includes(nome)) {
    // `command cd x` muda a pasta; `env cd x` não roda. Na dúvida, desconhecida.
    local.cwd = null;
    return achados;
  }
  if (nome === 'cd' || nome === 'pushd') {
    const destino = args.find((a) => !a.texto.startsWith('-') || a.texto === '-');
    if (!destino) local.cwd = process.env.HOME || process.env.USERPROFILE || null;
    else if (destino.dinamico || destino.glob || destino.texto === '-') local.cwd = null;
    else local.cwd = local.cwd ? resolverCaminho(destino.texto, local.cwd) : resolverCaminho(destino.texto, null);
    return achados;
  }
  if (nome === 'popd') {
    local.cwd = null;
    return achados;
  }

  const contexto = { estado, cwd, profundidade, atribuicoes };
  if (estado.leitura) achados.push(...avaliarLeitura(nome, args, contexto));
  else achados.push(...avaliarEscrita(nome, args, contexto));
  return achados;
}

// ---------------------------------------------------------------------------
// Agentes que escrevem (dev, qa, devops, instrutor, documentador, outros):
// procura comandos que escrevem e confere cada alvo contra a área.
// ---------------------------------------------------------------------------

// Comandos que escrevem em arquivos e cujos alvos o hook sabe extrair.
const ESCRITORES = new Set([
  'rm', 'rmdir', 'unlink', 'shred', 'touch', 'mkdir', 'truncate', 'mv', 'cp', 'install',
  'ln', 'tee', 'sed', 'perl', 'dd', 'chmod', 'chown', 'chgrp', 'git', 'patch', 'rsync',
]);
const AWKS = new Set(['awk', 'gawk', 'mawk', 'nawk']);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh']);

// Trechos protegidos da rede de segurança (opcional 5 da D6). Além dos de
// TRECHO_PROTEGIDO, inclui `.git/` (interno do git). Procurado em argumentos de
// comandos sem análise específica.
const TRECHO_PROTEGIDO_REDE = /03-tarefas|\.claude[\\/]+agents|\.git[\\/]/i;
// Leituras conhecidas que a rede de segurança não bloqueia (não escrevem).
// `sort` e `uniq` ficam de fora de propósito: gravam com `-o`/arquivo de saída.
// `[`/`[[` só testam; `read` só lê a entrada para variáveis; `for`/`case`/`select`
// são cabeçalhos (normalmente já pulados pelo `separarComandos`; aqui, reforço).
// Os comandos dentro de um laço continuam analisados um a um (`do rm "$f"` é negado).
const LEITURA_CONHECIDA = new Set([
  'cat', 'head', 'tail', 'less', 'more', 'grep', 'egrep', 'fgrep', 'rg', 'wc', 'diff', 'cmp',
  'ls', 'dir', 'echo', 'printf', 'pwd', 'cut', 'tr', 'jq', 'file', 'stat', 'nl', 'column',
  'comm', 'od', 'basename', 'dirname', 'realpath', 'readlink', 'which', 'type', 'date', 'tree',
  'du', 'df', 'sha256sum', 'sha1sum', 'md5sum', 'true', 'false', 'test',
  '[', '[[', 'for', 'case', 'select', 'read',
]);

function avaliarEscrita(nome, args, contexto) {
  const { estado, cwd } = contexto;
  const alvo = (p, opcoes) => conferirAlvo(p, estado, cwd, opcoes);

  switch (nome) {
    case 'rm':
    case 'rmdir':
    case 'unlink':
    case 'shred':
    case 'touch':
    case 'mkdir':
    case 'truncate': {
      const comValor = {
        mkdir: ['-m', '--mode'],
        truncate: ['-s', '--size', '-r', '--reference'],
        shred: ['-n', '--iterations', '-s', '--size'],
      }[nome] ?? [];
      const { opcoes, posicionais } = separarArgs(args, new Set(comValor));
      const recursivo = nome === 'rm' && temOpcao(opcoes, 'rR', ['--recursive']);
      return posicionais.map((p) => alvo(p, { subarvore: recursivo, seDiretorio: nome === 'rm' || nome === 'rmdir' }));
    }
    case 'mv':
      return moverOuCopiar(args, contexto, { moveOrigem: true });
    case 'cp':
    case 'install':
    case 'ln': {
      const { opcoes } = separarArgs(args, new Set(['-t', '--target-directory', '-S', '--suffix', '-m', '--mode', '-o', '--owner', '-g', '--group']));
      if (nome === 'install' && temOpcao(opcoes, 'd', ['--directory'])) {
        return separarArgs(args, new Set(['-m', '--mode', '-o', '--owner', '-g', '--group'])).posicionais.map((p) => alvo(p));
      }
      return moverOuCopiar(args, contexto, { moveOrigem: false, link: nome === 'ln' });
    }
    case 'tee': {
      return separarArgs(args).posicionais.map((p) => alvo(p));
    }
    case 'sort':
    case 'shuf': {
      // `-o`/`--output ARQUIVO` grava num arquivo (mesma família de `sort -o`,
      // já negado para o code-reviewer): confere o destino contra a área.
      const { opcoes } = separarOpcoesGnu(args, 'o', new Set(['--output']));
      const saida = valoresDe(opcoes, ['-o', '--output'])[0];
      return saida && !ehSaidaPadrao(saida) ? [alvo(saida)] : [];
    }
    case 'ex':
    case 'ed':
    case 'red':
      return [negar(`${nome}: editor de linha grava arquivos por comando e não é verificado; use Edit/Write`)];
    case 'vi':
    case 'vim':
    case 'nvim':
    case 'view':
      // Sempre negados (D7, opcional 4): o Bash da ferramenta não tem terminal,
      // então o único uso possível é o modo ex/script (`-c`, `+cmd`, `-e -s`,
      // `-s arquivo`, `-S`, `-y`...), que grava arquivos por comando.
      return [negar(`${nome}: sem terminal, o editor só roda em modo ex/script, que grava arquivos e não é verificado; use Edit/Write`)];
    case 'sed': {
      const perigo = sedPerigoso(args);
      return [...(perigo ? [negar(perigo)] : []), ...sedNoLugar(args, contexto)];
    }
    case 'perl':
      return perl(args, contexto);
    case 'dd':
      return args.filter((a) => a.texto.startsWith('of=')).map((a) => alvo(palavra(a.texto.slice(3), a)));
    case 'chmod':
    case 'chown':
    case 'chgrp': {
      const { opcoes, posicionais } = separarArgs(args);
      const recursivo = temOpcao(opcoes, 'R', ['--recursive']);
      const alvos = valorDe(opcoes, ['--reference']) ? posicionais : posicionais.slice(1);
      return alvos.map((p) => alvo(p, { subarvore: recursivo, seDiretorio: recursivo }));
    }
    case 'patch':
      return [negar('patch: os arquivos alterados vêm do diff e não podem ser verificados; use Edit/Write')];
    case 'curl':
      return curl(args, contexto);
    case 'wget':
      return wget(args, contexto);
    case 'rsync':
      return rsync(args, contexto);
    case 'tar':
    case 'bsdtar':
      return tar(args, contexto);
    case 'unzip':
      return unzip(args, contexto);
    case 'git':
      return git(args, contexto);
    case 'find':
      return find(args, contexto);
    case 'xargs':
      return xargs(args, contexto);
    case 'eval':
      return reanalisar(args, contexto, 'eval');
    case 'powershell':
    case 'pwsh':
      return powershellViaBash(nome, args, contexto);
    default:
      break;
  }
  if (SHELLS.has(nome)) return shellComC(args, contexto);
  if (AWKS.has(nome)) return awkEscrita(args, contexto);
  const inline = codigoInline(nome, args);
  if (inline.length) return inline;
  return redeDeSeguranca(nome, args, contexto);
}

// `powershell`/`pwsh` chamados pelo Bash: PowerShell de subagente é só leitura
// (D3(7)). Os argumentos são juntados e passados ao mesmo analisador do tool
// PowerShell (procura verbos/apelidos que escrevem, redirecionamento e git).
// Como a checagem por verbos não pega tudo (`(gi x).Delete()`, apelidos como
// `clc`), texto que cita caminho protegido é negado (D7, opcional 1), e também o
// comando lido da entrada (`-Command -`, `-File -` ou nenhum comando), que o hook não vê.
function powershellViaBash(nome, args, contexto) {
  const { estado } = contexto;
  if (args.some((a) => a.dinamico)) {
    return [negar(`${nome} via Bash com argumento dinâmico não pode ser verificado`)];
  }
  const lido = lerParametrosPowerShell(args);
  if (lido.codificado) return [negar(`${nome} com comando codificado não pode ser verificado`)];
  if (lido.ajuda) return [];
  if (lido.daEntrada) return [negar(`${nome} lendo o comando da entrada (-Command -, -File - ou sem comando) não pode ser verificado`)];
  const texto = args.map((a) => a.texto).join(' ');
  if (TRECHO_PROTEGIDO_REDE.test(texto)) {
    return [negar(`${nome} via Bash cita um caminho protegido (docs/03-tarefas, .claude/agents ou .git): negado por segurança`)];
  }
  return avaliarPowerShell({ agente: estado.agente }, texto);
}

// Parâmetros do powershell/pwsh que consomem um valor (aceitam abreviação por prefixo).
const PS_PARAMETROS_COM_VALOR = [
  'executionpolicy', 'windowstyle', 'workingdirectory', 'inputformat', 'outputformat', 'version',
  'configurationname', 'custompipename', 'psconsolefile', 'settingsfile', 'encodedarguments',
];
const PS_APELIDOS_COM_VALOR = new Set(['ep', 'ex', 'w', 'wd', 'if', 'of', 'o', 'v', 'ea']);

// Lê os parâmetros do powershell/pwsh até o comando. Devolve
// { codificado, daEntrada, ajuda }: `-EncodedCommand` (e abreviações como `-enc`);
// comando vindo da entrada; `-?`/`-h`/`-help` (só mostra a ajuda).
function lerParametrosPowerShell(args) {
  for (let i = 0; i < args.length; i++) {
    const t = args[i].texto;
    if (t === '-') return { daEntrada: true };
    if (t.length < 2 || !t.startsWith('-')) return {}; // posicional: é o comando (ou o script)
    const n = t.slice(1).toLowerCase();
    if (n === 'e' || n === 'ec' || (n.startsWith('en') && 'encodedcommand'.startsWith(n))) return { codificado: true };
    if (n === '?' || n === 'h' || n === 'help') return { ajuda: true };
    if ('command'.startsWith(n) || n === 'cwa' || 'commandwithargs'.startsWith(n) || 'file'.startsWith(n)) {
      const seguinte = args[i + 1];
      return seguinte && seguinte.texto !== '-' ? {} : { daEntrada: true };
    }
    if (PS_APELIDOS_COM_VALOR.has(n) || PS_PARAMETROS_COM_VALOR.some((p) => n.length > 1 && p.startsWith(n))) i++;
    // Demais parâmetros são chaves sem valor (-NoProfile, -NonInteractive...).
  }
  return { daEntrada: true }; // sem comando: com a entrada redirecionada, o PowerShell a executa
}

// Rede de segurança (opcional 5 da D6): comando sem análise específica (fora das
// listas de escritores, embrulhos, shells e código inline) que cita um caminho
// protegido num argumento ou numa atribuição → negado. Leituras conhecidas
// (`cat`, `grep`, `head`...) ficam de fora, para não travar fluxos legítimos.
function redeDeSeguranca(nome, args, contexto) {
  if (LEITURA_CONHECIDA.has(nome)) return [];
  const extras = contexto.atribuicoes ?? [];
  if ([...args, ...extras].some((a) => TRECHO_PROTEGIDO_REDE.test(a.texto))) {
    return [negar(`"${nome}" não é analisado e cita um caminho protegido (docs/03-tarefas, .claude/agents ou .git): negado por segurança`)];
  }
  return [];
}

// mv/cp/install/ln: destino = último argumento ou `-t DIR`.
function moverOuCopiar(args, contexto, { moveOrigem, link = false }) {
  const { estado, cwd } = contexto;
  const { opcoes, posicionais } = separarArgs(args, new Set(['-t', '--target-directory', '-S', '--suffix', '-m', '--mode', '-o', '--owner', '-g', '--group']));
  const achados = [];
  const dirDestino = valorDe(opcoes, ['-t', '--target-directory']);
  let origens;
  let destino;
  if (dirDestino) {
    origens = posicionais;
    destino = dirDestino;
  } else if (link && posicionais.length === 1) {
    // `ln -s alvo` cria o link no diretório atual, com o nome do alvo.
    origens = posicionais;
    destino = palavra('.');
  } else {
    origens = posicionais.slice(0, -1);
    destino = posicionais[posicionais.length - 1];
  }
  if (!destino) return [negar('destino ausente')];
  if (moveOrigem) {
    for (const o of origens) achados.push(conferirAlvo(o, estado, cwd, { seDiretorio: true }));
  }
  const destinoAbs = destino.dinamico ? null : resolverCaminho(destino.texto, cwd);
  const destinoEhPasta = !!dirDestino || destino.texto.endsWith('/') || (destinoAbs && ehDiretorio(destinoAbs));
  if (destinoEhPasta && origens.length) {
    for (const o of origens) {
      const nomeBase = o.texto.replace(/\/+$/, '').split('/').pop();
      const texto = `${destino.texto.replace(/\/+$/, '')}/${nomeBase}`;
      const marcas = {
        dinamico: destino.dinamico || o.dinamico,
        glob: destino.glob || o.glob,
        chaves: destino.chaves || o.chaves,
        citada: destino.citada || o.citada,
      };
      achados.push(conferirAlvo(palavra(texto, marcas), estado, cwd));
    }
  } else {
    achados.push(conferirAlvo(destino, estado, cwd));
  }
  return achados;
}

// Lê as opções do sed: `-i` (edita no lugar), `-e`/`--expression` e o 1º
// posicional (scripts visíveis), `-f`/`--file` (script de arquivo, invisível).
// `arquivos` são os posicionais de entrada (depois do script, quando ele é posicional).
function separarSed(args) {
  let noLugar = false;
  let temArquivo = false;
  let scriptEmOpcao = false;
  let fimDasOpcoes = false;
  const scripts = [];
  const posicionais = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const t = a.texto;
    if (fimDasOpcoes || a.dinamico || t === '-' || !t.startsWith('-')) {
      posicionais.push(a);
    } else if (t === '--') {
      fimDasOpcoes = true;
    } else if (t.startsWith('--')) {
      if (t.startsWith('--in-place')) noLugar = true;
      else if (t === '--expression') { scriptEmOpcao = true; if (args[i + 1]) scripts.push(args[++i]); }
      else if (t.startsWith('--expression=')) { scriptEmOpcao = true; scripts.push(palavra(t.slice('--expression='.length), a)); }
      else if (t === '--file') { temArquivo = true; scriptEmOpcao = true; i++; }
      else if (t.startsWith('--file=')) { temArquivo = true; scriptEmOpcao = true; }
    } else {
      for (let j = 1; j < t.length; j++) {
        const c = t[j];
        if (c === 'i') { noLugar = true; break; } // o resto é o sufixo do backup (-i.bak)
        if (c === 'e') {
          scriptEmOpcao = true;
          if (j === t.length - 1) { if (args[i + 1]) scripts.push(args[++i]); } else scripts.push(palavra(t.slice(j + 1), a));
          break;
        }
        if (c === 'f') { temArquivo = true; scriptEmOpcao = true; if (j === t.length - 1) i++; break; }
        if (c === 'l') { if (j === t.length - 1) i++; break; } // -l N (quebra de linha)
      }
    }
  }
  if (!scriptEmOpcao && posicionais.length) scripts.push(posicionais[0]);
  const arquivos = scriptEmOpcao ? posicionais : posicionais.slice(1);
  return { noLugar, temArquivo, scripts, arquivos };
}

// `sed -i` edita no lugar: os arquivos são os posicionais depois do script.
function sedNoLugar(args, contexto) {
  const { noLugar, arquivos } = separarSed(args);
  if (!noLugar) return [];
  if (!arquivos.length) return [negar('sed -i sem arquivo identificável')];
  return arquivos.map((p) => conferirAlvo(p, contexto.estado, contexto.cwd));
}

// Um script de sed pode executar (`e`) ou gravar em arquivo (`w`/`W`, flag `w`/`e`
// do `s///`), além de `-f`/`--file` (script invisível). Vale para TODO subagente
// (D6, bloqueante 2). Devolve um motivo ou null.
function sedPerigoso(args) {
  const { temArquivo, scripts } = separarSed(args);
  if (temArquivo) return 'sed -f/--file: o script vem de um arquivo e não é verificado';
  for (const s of scripts) {
    if (!s.dinamico && scriptSedPerigoso(s.texto)) {
      return 'sed com comando e/w/W (executa ou grava em arquivo) não é permitido';
    }
  }
  return null;
}

// Pula um `/regex/` (ou `\cregexc`) a partir do delimitador em `i`, respeitando
// escapes; descarta as flags do endereço (I, M) depois do fechamento.
function pularRegexSed(s, i, delim) {
  i++;
  while (i < s.length && s[i] !== delim) i += s[i] === '\\' ? 2 : 1;
  if (i < s.length) i++;
  while (i < s.length && /[IM]/.test(s[i])) i++;
  return i;
}

// Pula o(s) endereço(s) de um comando sed (número, `$`, `/re/`, `\cREc`, `first~step`,
// faixas `a,b`, `a,+N`, `a,~N`) para chegar ao caractere do comando.
function pularEnderecoSed(s, i) {
  const n = s.length;
  let partes = 0;
  while (partes < 2 && i < n) {
    while (i < n && /\s/.test(s[i])) i++;
    const c = s[i];
    if (c === '$') i++;
    else if (/\d/.test(c)) {
      while (i < n && /\d/.test(s[i])) i++;
      if (s[i] === '~') { i++; while (i < n && /\d/.test(s[i])) i++; }
    } else if (c === '/') i = pularRegexSed(s, i, '/');
    else if (c === '\\' && s[i + 1] !== undefined) i = pularRegexSed(s, i + 1, s[i + 1]);
    else if ((c === '+' || c === '~') && partes === 1) { i++; while (i < n && /\d/.test(s[i])) i++; }
    else break;
    partes++;
    while (i < n && /\s/.test(s[i])) i++;
    if (s[i] === ',') { i++; continue; }
    break;
  }
  return i;
}

// Pula um comando `s<sep>re<sep>rep<sep>flags` ou `y<sep>a<sep>b<sep>`. Devolve
// { fim, flags } (as flags só do `s`; o `y` não tem).
function pularSubstituicaoSed(s, i) {
  const sep = s[i + 1];
  let j = i + 2;
  let partes = 0;
  while (j < s.length && partes < 2) {
    if (s[j] === '\\') { j += 2; continue; }
    if (s[j] === sep) partes++;
    j++;
  }
  let flags = '';
  while (j < s.length && /[a-zA-Z0-9]/.test(s[j])) flags += s[j++];
  return { fim: j, flags };
}

function scriptSedPerigoso(script) {
  const s = script;
  const n = s.length;
  let i = 0;
  while (i < n) {
    const c = s[i];
    if (/[\s;{}]/.test(c)) { i++; continue; }
    if (c === '#') { while (i < n && s[i] !== '\n') i++; continue; }
    i = pularEnderecoSed(s, i);
    while (i < n && (s[i] === '!' || /\s/.test(s[i]))) i++;
    if (i >= n) break;
    const cmd = s[i];
    if (cmd === 'w' || cmd === 'W' || cmd === 'e') return true;
    if (cmd === 's' || cmd === 'y') {
      const { fim, flags } = pularSubstituicaoSed(s, i);
      if (cmd === 's' && /[we]/.test(flags)) return true;
      i = fim;
      continue;
    }
    // Comandos que consomem o resto da linha (texto, nome de arquivo, rótulo).
    if ('aicrRbtT:'.includes(cmd)) {
      if (':btT'.includes(cmd)) { i++; while (i < n && !/[;\n}]/.test(s[i])) i++; } else { while (i < n && s[i] !== '\n') i++; }
      continue;
    }
    i++; // comando de uma letra (d, g, p, n, x, =, z...)
  }
  return false;
}

function perl(args, contexto) {
  const achados = codigoInline('perl', args);
  const { opcoes, posicionais } = separarArgs(args, new Set(['-e', '-E', '-I', '-M', '-m']));
  const noLugar = opcoes.some(({ nome }) => /^-[^-]*i/.test(nome));
  if (!noLugar) return achados;
  const temScript = opcoes.some(({ nome }) => nome === '-e' || nome === '-E' || /^-[^-]*[eE]$/.test(nome));
  const arquivos = temScript ? posicionais : posicionais.slice(1);
  if (!arquivos.length) return [...achados, negar('perl -i sem arquivo identificável')];
  return [...achados, ...arquivos.map((p) => conferirAlvo(p, contexto.estado, contexto.cwd))];
}

// ---------------------------------------------------------------------------
// Downloads, sincronização, pacotes e awk: comandos que escrevem por opção.
// ---------------------------------------------------------------------------

// Separa opções no estilo GNU, abrindo grupos de opções curtas (`-sSLo saida` →
// -s, -S, -L e -o saida). `curtasComValor`: letras que consomem um valor (o resto
// do grupo ou o próximo argumento); `longasComValor`: opções longas que consomem
// o próximo argumento quando não vêm com `=`.
function separarOpcoesGnu(args, curtasComValor = '', longasComValor = new Set()) {
  const opcoes = [];
  const posicionais = [];
  let fimDasOpcoes = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const t = a.texto;
    if (fimDasOpcoes || a.dinamico || t === '-' || !t.startsWith('-')) {
      posicionais.push(a);
    } else if (t === '--') {
      fimDasOpcoes = true;
    } else if (t.startsWith('--')) {
      const igual = t.indexOf('=');
      const nome = igual === -1 ? t : t.slice(0, igual);
      let valor = igual === -1 ? null : palavra(t.slice(igual + 1), a);
      if (!valor && longasComValor.has(nome) && i + 1 < args.length) valor = args[++i];
      opcoes.push({ nome, valor });
    } else {
      for (let j = 1; j < t.length; j++) {
        if (!curtasComValor.includes(t[j])) {
          opcoes.push({ nome: `-${t[j]}`, valor: null });
          continue;
        }
        const valor = j + 1 < t.length ? palavra(t.slice(j + 1), a) : (args[++i] ?? null);
        opcoes.push({ nome: `-${t[j]}`, valor });
        break;
      }
    }
  }
  return { opcoes, posicionais };
}

const valoresDe = (opcoes, nomes) => opcoes.filter((o) => nomes.includes(o.nome) && o.valor).map((o) => o.valor);
const temAlguma = (opcoes, nomes) => opcoes.some((o) => nomes.includes(o.nome));
const ehSaidaPadrao = (p) => !p.dinamico && p.texto === '-';
const ehAbsoluto = (texto) => /^([\\/]|[A-Za-z]:)/.test(texto);

// Caminho `relativo` dentro de `base` (ex.: `-o` dentro de `--output-dir`).
function dentroDe(base, relativo) {
  const texto = ehAbsoluto(relativo.texto) ? relativo.texto : `${base.texto.replace(/\/+$/, '')}/${relativo.texto}`;
  return palavra(texto, {
    dinamico: base.dinamico || relativo.dinamico,
    glob: base.glob || relativo.glob,
    chaves: base.chaves || relativo.chaves,
    citada: base.citada || relativo.citada,
  });
}

// curl: `-o/--output ARQUIVO` (e cabeçalhos, cookies, rastros) gravam arquivos;
// `-O` grava na pasta atual (ou em `--output-dir`) com o nome que vem da URL.
const CURL_CURTAS_COM_VALOR = 'AbcCdDeEFHKmoPQrtTuUwxXyYz';
const CURL_ARQUIVOS = [
  '-o', '--output', '-D', '--dump-header', '-c', '--cookie-jar', '--trace', '--trace-ascii',
  '--stderr', '--libcurl', '--etag-save', '--hsts', '--alt-svc',
];
const CURL_LONGAS_COM_VALOR = new Set([
  ...CURL_ARQUIVOS.filter((n) => n.startsWith('--')), '--output-dir', '--data', '--data-raw',
  '--data-binary', '--header', '--request', '--user', '--user-agent', '--url', '--config', '--cookie',
  '--form', '--upload-file', '--write-out', '--referer', '--proxy', '--max-time', '--range',
]);

function curl(args, contexto) {
  const { estado, cwd } = contexto;
  const { opcoes } = separarOpcoesGnu(args, CURL_CURTAS_COM_VALOR, CURL_LONGAS_COM_VALOR);
  // O arquivo de configuração pode trazer `output = ...`: não é lido pelo hook.
  if (temAlguma(opcoes, ['-K', '--config'])) return [negar('curl -K/--config: as opções do arquivo de configuração não são verificadas')];
  const pasta = valoresDe(opcoes, ['--output-dir'])[0];
  const achados = [];
  for (const { nome, valor } of opcoes) {
    if (!valor || !CURL_ARQUIVOS.includes(nome) || ehSaidaPadrao(valor)) continue;
    const ehSaida = nome === '-o' || nome === '--output';
    achados.push(conferirAlvo(pasta && ehSaida ? dentroDe(pasta, valor) : valor, estado, cwd));
  }
  if (temAlguma(opcoes, ['-O', '--remote-name', '--remote-name-all'])) {
    achados.push(conferirAlvo(pasta ?? palavra('.'), estado, cwd, { subarvore: true }));
  }
  return achados;
}

// wget: grava na pasta atual (ou em `-P PASTA`) com o nome da URL; `-O ARQUIVO`
// grava num arquivo só; `-o`/`-a` gravam o log. `-e` roda comandos do wgetrc
// e `--config` lê um wgetrc: ambos negados.
const WGET_CURTAS_COM_VALOR = 'OoaPeitTwQlARDIXUB';
const WGET_LONGAS_COM_VALOR = new Set([
  '--output-document', '--output-file', '--append-output', '--directory-prefix', '--execute',
  '--input-file', '--tries', '--timeout', '--wait', '--quota', '--level', '--accept', '--reject',
  '--domains', '--include-directories', '--exclude-directories', '--user-agent', '--base', '--header',
  '--user', '--password', '--post-data', '--config',
]);

function wget(args, contexto) {
  const { estado, cwd } = contexto;
  const { opcoes } = separarOpcoesGnu(args, WGET_CURTAS_COM_VALOR, WGET_LONGAS_COM_VALOR);
  if (temAlguma(opcoes, ['-e', '--execute'])) return [negar('wget -e/--execute: comandos do wgetrc não são verificados')];
  if (temAlguma(opcoes, ['--config'])) return [negar('wget --config: as opções do arquivo de configuração não são verificadas')];
  const achados = valoresDe(opcoes, ['-o', '--output-file', '-a', '--append-output'])
    .filter((v) => !ehSaidaPadrao(v))
    .map((v) => conferirAlvo(v, estado, cwd));
  const documento = valoresDe(opcoes, ['-O', '--output-document'])[0];
  if (documento) {
    if (!ehSaidaPadrao(documento)) achados.push(conferirAlvo(documento, estado, cwd));
  } else if (!temAlguma(opcoes, ['--spider'])) {
    const pasta = valoresDe(opcoes, ['-P', '--directory-prefix'])[0] ?? palavra('.');
    achados.push(conferirAlvo(pasta, estado, cwd, { subarvore: true }));
  }
  return achados;
}

// rsync: o destino (último argumento) recebe a origem inteira, com subpastas, e
// `--delete` apaga lá dentro: confere o destino como pasta inteira.
const RSYNC_CURTAS_COM_VALOR = 'efTBM';
const RSYNC_LONGAS_COM_VALOR = new Set([
  '--rsh', '--filter', '--exclude', '--include', '--exclude-from', '--include-from', '--files-from',
  '--temp-dir', '--partial-dir', '--backup-dir', '--log-file', '--log-file-format', '--chmod',
  '--chown', '--suffix', '--compare-dest', '--copy-dest', '--link-dest', '--block-size', '--max-size',
  '--min-size', '--bwlimit', '--timeout', '--password-file', '--out-format', '--port', '--iconv',
  '--remote-option', '--usermap', '--groupmap', '--write-batch', '--only-write-batch', '--read-batch',
  '--info', '--debug', '--modify-window',
]);
// `host:caminho`, `usuario@host:caminho`, `host::modulo` ou `rsync://` (não é disco local).
const ehRemoto = (p) => !p.dinamico && (/^rsync:\/\//.test(p.texto)
  || (/^[^/\\:]+:/.test(p.texto) && !/^[A-Za-z]:([\\/]|$)/.test(p.texto)));

function rsync(args, contexto) {
  const { estado, cwd } = contexto;
  const { opcoes, posicionais } = separarOpcoesGnu(args, RSYNC_CURTAS_COM_VALOR, RSYNC_LONGAS_COM_VALOR);
  const achados = valoresDe(opcoes, ['--log-file', '--write-batch', '--only-write-batch'])
    .map((v) => conferirAlvo(v, estado, cwd));
  if (posicionais.length < 2) return achados; // só a origem: lista os arquivos
  const destino = posicionais[posicionais.length - 1];
  if (!ehRemoto(destino)) {
    achados.push(conferirAlvo(destino, estado, cwd, { subarvore: true }));
    // Pastas de backup, parciais e temporárias são relativas ao destino.
    for (const v of valoresDe(opcoes, ['--backup-dir', '--partial-dir', '--temp-dir', '-T'])) {
      achados.push(conferirAlvo(dentroDe(destino, v), estado, cwd, { subarvore: true }));
    }
  }
  if (temAlguma(opcoes, ['--remove-source-files'])) {
    for (const o of posicionais.slice(0, -1).filter((p) => !ehRemoto(p))) {
      achados.push(conferirAlvo(o, estado, cwd, { subarvore: true }));
    }
  }
  return achados;
}

// tar: extrair (`-x`) grava na pasta atual ou em `-C PASTA`; criar ou alterar
// um pacote (`-c`, `-r`, `-u`, `-A`, `--delete`) grava o arquivo de `-f`;
// `--remove-files` apaga as origens depois de empacotar.
const TAR_CURTAS_COM_VALOR = 'fCTXbLgNKVHI';
const TAR_LONGAS_COM_VALOR = new Set([
  '--file', '--directory', '--files-from', '--exclude-from', '--listed-incremental', '--newer',
  '--label', '--format', '--use-compress-program', '--to-command', '--blocking-factor',
  '--tape-length', '--starting-file', '--exclude', '--transform', '--xform', '--owner', '--group',
  '--mode', '--mtime', '--suffix', '--strip-components',
]);

function tar(args, contexto) {
  const { estado, cwd } = contexto;
  // Forma antiga, sem traço (`tar xzf pacote.tar`): cada letra que tem valor
  // consome o próximo argumento, na ordem.
  let lista = args;
  if (args.length && !args[0].dinamico && /^[A-Za-z]+$/.test(args[0].texto)) {
    lista = [];
    let proximo = 1;
    for (const letra of args[0].texto) {
      lista.push(palavra(`-${letra}`));
      if (TAR_CURTAS_COM_VALOR.includes(letra) && proximo < args.length) lista.push(args[proximo++]);
    }
    lista.push(...args.slice(proximo));
  }
  const { opcoes, posicionais } = separarOpcoesGnu(lista, TAR_CURTAS_COM_VALOR, TAR_LONGAS_COM_VALOR);
  const tem = (...nomes) => temAlguma(opcoes, nomes);
  const achados = valoresDe(opcoes, ['-g', '--listed-incremental']).map((v) => conferirAlvo(v, estado, cwd));
  if (tem('-x', '--extract', '--get')) {
    if (tem('-O', '--to-stdout')) return achados;
    if (tem('-P', '--absolute-names', '--transform', '--xform', '--to-command')) {
      return [...achados, negar('tar com --absolute-names, --transform ou --to-command: os caminhos extraídos não são verificados')];
    }
    // Cada `-C` relativo vale a partir do anterior.
    const pastas = [];
    for (const v of valoresDe(opcoes, ['-C', '--directory'])) {
      pastas.push(pastas.length ? dentroDe(pastas[pastas.length - 1], v) : v);
    }
    if (!pastas.length) pastas.push(palavra('.'));
    return [...achados, ...pastas.map((p) => conferirAlvo(p, estado, cwd, { subarvore: true }))];
  }
  if (tem('-c', '--create', '-r', '--append', '-u', '--update', '-A', '--catenate', '--concatenate', '--delete')) {
    const pacote = valoresDe(opcoes, ['-f', '--file'])[0];
    if (pacote && !ehSaidaPadrao(pacote)) achados.push(conferirAlvo(pacote, estado, cwd));
  }
  if (tem('--remove-files')) {
    // Com `-C` (cada um relativo ao anterior, intercalado com as origens) ou
    // lista de origens num arquivo, não dá para saber o que é apagado.
    if (tem('-C', '--directory', '-T', '--files-from')) {
      return [...achados, negar('tar --remove-files com -C ou -T: as origens apagadas não são verificadas')];
    }
    if (!posicionais.length) return [...achados, negar('tar --remove-files sem origem identificável')];
    for (const o of posicionais) achados.push(conferirAlvo(o, estado, cwd, { subarvore: true }));
  }
  return achados;
}

// unzip: extrai na pasta atual ou em `-d PASTA`; `-l`, `-v`, `-t`, `-p`, `-z` e
// `-Z` só leem. `-:` aceita "../" nos nomes extraídos.
function unzip(args, contexto) {
  let destino = null;
  let soLe = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const t = a.texto;
    if (a.dinamico || t.length < 2 || !t.startsWith('-')) continue;
    for (let j = 1; j < t.length; j++) {
      const c = t[j];
      if (c === 'd' || c === 'P') {
        const valor = j + 1 < t.length ? palavra(t.slice(j + 1), a) : (args[++i] ?? null);
        if (c === 'd') destino = valor;
        break;
      }
      if (c === ':') return [negar('unzip -: aceita "../" nos nomes extraídos: não é verificado')];
      if ('lvtpzZ'.includes(c)) soLe = true;
    }
  }
  if (soLe) return [];
  return [conferirAlvo(destino ?? palavra('.'), contexto.estado, contexto.cwd, { subarvore: true })];
}

// awk: lê as opções até o programa. O programa pode vir de `-f ARQUIVO` (não
// visível), de `-e TEXTO` (gawk) ou do primeiro argumento.
const AWK_CURTAS_COM_VALOR = new Set(['-f', '-v', '-F', '-i', '-e', '-E', '-l', '-W']);
const AWK_LONGAS_COM_VALOR = new Set(['--file', '--assign', '--field-separator', '--include', '--source', '--exec', '--load']);

function separarAwk(args) {
  const opcoes = [];
  let i = 0;
  for (; i < args.length; i++) {
    const a = args[i];
    const t = a.texto;
    if (a.dinamico || t === '-' || !t.startsWith('-')) break;
    if (t === '--') {
      i++;
      break;
    }
    if (t.startsWith('--')) {
      const igual = t.indexOf('=');
      const nome = igual === -1 ? t : t.slice(0, igual);
      let valor = igual === -1 ? null : palavra(t.slice(igual + 1), a);
      if (!valor && AWK_LONGAS_COM_VALOR.has(nome)) valor = args[++i] ?? null;
      opcoes.push({ nome, valor });
      continue;
    }
    const nome = t.slice(0, 2);
    let valor = null;
    if (AWK_CURTAS_COM_VALOR.has(nome)) valor = t.length > 2 ? palavra(t.slice(2), a) : (args[++i] ?? null);
    opcoes.push({ nome, valor });
  }
  const resto = args.slice(i);
  const programaEmOpcao = temAlguma(opcoes, ['-f', '--file', '-e', '--source', '-E', '--exec']);
  const programas = [...(programaEmOpcao || !resto.length ? [] : [resto[0]]), ...valoresDe(opcoes, ['-e', '--source'])];
  // Entradas: sem `var=valor` (atribuição do awk) nem `-` (entrada padrão).
  const arquivos = (programaEmOpcao ? resto : resto.slice(1))
    .filter((p) => p.dinamico || (p.texto !== '-' && !ATRIBUICAO.test(p.texto)));
  return { opcoes, programas, arquivos };
}

// `awk -i inplace` edita no lugar: os arquivos de entrada são os alvos.
// `@include`/`@load` no programa e `-l` (extensão) são negados: carregam o
// `inplace` (ou outra coisa) sem aparecer nas opções. Programa ou inclusão em
// arquivo (`-f`, `-E`, `-i outro.awk`) não é visível e pode incluir o `inplace`:
// os arquivos de entrada também são conferidos como alvos.
function awkEscrita(args, contexto) {
  const { opcoes, programas, arquivos } = separarAwk(args);
  const achados = [];
  if (programas.some((p) => TRECHO_PROTEGIDO.test(p.texto))) {
    achados.push(negar('awk: o programa cita um caminho protegido (docs/03-tarefas ou .claude/agents)'));
  }
  if (programas.some((p) => p.dinamico || /@\s*(include|load)\b/.test(p.texto))) {
    return [...achados, negar('awk: programa dinâmico ou com @include/@load não é verificado')];
  }
  if (temAlguma(opcoes, ['-l', '--load'])) return [...achados, negar('awk -l/--load: extensões não são verificadas')];
  const inclusoes = valoresDe(opcoes, ['-i', '--include']);
  if (inclusoes.some((v) => v.dinamico)) return [...achados, negar('awk -i com valor dinâmico não pode ser verificado')];
  const noLugar = inclusoes.some((v) => /^inplace(\.awk)?$/.test(v.texto));
  const invisivel = inclusoes.length > 0 || temAlguma(opcoes, ['-f', '--file', '-E', '--exec']);
  if (!noLugar && !invisivel) return achados;
  if (!arquivos.length) return noLugar ? [...achados, negar('awk -i inplace sem arquivo identificável')] : achados;
  return [...achados, ...arquivos.map((p) => conferirAlvo(p, contexto.estado, contexto.cwd))];
}

// `bash -c "..."`: analisa o texto do -c como um comando.
function shellComC(args, contexto) {
  for (let i = 0; i < args.length; i++) {
    const t = args[i].texto;
    if (/^-[a-zA-Z]*c[a-zA-Z]*$/.test(t)) {
      const codigo = args[i + 1];
      if (!codigo) return [negar('-c sem comando')];
      if (codigo.dinamico) return [negar('comando dinâmico no -c não pode ser verificado')];
      return analisarTexto(codigo.texto, contexto.estado, contexto.cwd, contexto.profundidade + 1);
    }
    if (!t.startsWith('-')) break; // `bash script.sh`: script não é analisado
  }
  return [];
}

function reanalisar(args, contexto, nome) {
  if (args.some((a) => a.dinamico)) return [negar(`${nome} com conteúdo dinâmico não pode ser verificado`)];
  return analisarTexto(args.map((a) => a.texto).join(' '), contexto.estado, contexto.cwd, contexto.profundidade + 1);
}

// Código inline (`node -e`, `python -c`, `powershell -Command`, `cmd /c`):
// não dá para analisar a linguagem; bloqueia se citar um caminho protegido.
const OPCAO_INLINE = {
  node: ['-e', '--eval', '-p', '--print'],
  python: ['-c'],
  python3: ['-c'],
  py: ['-c'],
  perl: ['-e', '-E'],
  ruby: ['-e'],
  deno: ['eval'],
  pwsh: ['-c', '-command', '-encodedcommand', '-e', '-ec'],
  powershell: ['-c', '-command', '-encodedcommand', '-e', '-ec'],
  cmd: ['/c', '/k'],
};

function codigoInline(nome, args) {
  const opcoesInline = OPCAO_INLINE[nome];
  if (!opcoesInline) return [];
  const indice = args.findIndex((a) => opcoesInline.includes(a.texto.toLowerCase()));
  if (indice === -1) return [];
  const ehPowerShell = nome === 'pwsh' || nome === 'powershell';
  if (ehPowerShell && /^-(encodedcommand|ec?)$/.test(args[indice].texto.toLowerCase())) {
    return [negar(`${nome} com comando codificado não pode ser verificado`)];
  }
  const codigo = args.slice(indice + 1).map((a) => a.texto).join(' ');
  if (TRECHO_PROTEGIDO.test(codigo)) {
    return [negar(`${nome}: código inline cita um caminho protegido (docs/03-tarefas ou .claude/agents)`)];
  }
  return [];
}

// find: `-delete` e `-exec <comando que escreve>` atingem as pastas de partida.
const FIND_EXEC = new Set(['-exec', '-execdir', '-ok', '-okdir']);
const FIND_ARQUIVO = new Set(['-fprint', '-fprint0', '-fprintf', '-fls']);

function find(args, contexto) {
  const { estado, cwd } = contexto;
  const raizes = [];
  let i = 0;
  for (; i < args.length; i++) {
    const t = args[i].texto;
    if (t.startsWith('-') || t === '(' || t === '!') break;
    raizes.push(args[i]);
  }
  if (!raizes.length) raizes.push(palavra('.'));
  const achados = [];
  let atingeRaizes = false;
  for (; i < args.length; i++) {
    const t = args[i].texto;
    if (t === '-delete') atingeRaizes = true;
    if (FIND_ARQUIVO.has(t) && args[i + 1]) achados.push(conferirAlvo(args[i + 1], estado, cwd));
    if (FIND_EXEC.has(t)) {
      const interno = [];
      for (i++; i < args.length && args[i].texto !== ';' && args[i].texto !== '+'; i++) interno.push(args[i]);
      if (!interno.length) continue;
      if (ESCRITORES.has(nomeDoComando(interno[0]))) {
        atingeRaizes = true;
      } else {
        // Outros comandos (`curl -o`, `tar -x`, `sh -c`...) são analisados com
        // `{}` como caminho desconhecido; no `-execdir` a pasta atual muda.
        const palavras = interno.map((p) => (p.texto.includes('{}') ? palavra(p.texto, { ...p, dinamico: true }) : p));
        const cwdInterno = t === '-execdir' || t === '-okdir' ? null : cwd;
        const item = { tipo: 'comando', palavras, redirecoes: [] };
        achados.push(...avaliarComandoSimples(item, estado, { cwd: cwdInterno }, contexto.profundidade + 1));
      }
    }
  }
  if (atingeRaizes) {
    for (const r of raizes) achados.push(conferirAlvo(r, estado, cwd, { subarvore: true }));
  }
  return achados;
}

// xargs: os alvos vêm da entrada padrão; se o comando escreve, não dá para
// verificar. As opções seguem a lista do embrulho `xargs` (desconhecida = negada),
// e o comando é visto depois de tirar outros embrulhos (`xargs env rm`).
function xargs(args, contexto) {
  const lido = lerEmbrulho(EMBRULHOS.xargs, args);
  if (lido.negada) return [negar(`xargs ${lido.negada}: opção fora da lista conhecida não é analisada`)];
  const interno = lido.executa ? lido.resto : [];
  if (!interno.length) return [];
  const { palavras, negacao } = desembrulhar(interno, contexto.cwd);
  if (negacao) return [negar(negacao)];
  const nome = palavras.length && !palavras[0].dinamico ? nomeDoComando(palavras[0]) : '';
  if (ESCRITORES.has(nome) && nome !== 'git') {
    return [negar(`xargs ${nome}: os alvos vêm da entrada e não podem ser verificados`)];
  }
  const item = { tipo: 'comando', palavras: interno, redirecoes: [] };
  return avaliarComandoSimples(item, contexto.estado, { cwd: contexto.cwd }, contexto.profundidade + 1);
}

// ---------------------------------------------------------------------------
// git
// ---------------------------------------------------------------------------

// Subcomandos que só leem.
const GIT_LEITURA = new Set([
  'status', 'diff', 'log', 'show', 'blame', 'annotate', 'rev-parse', 'rev-list', 'ls-files',
  'ls-tree', 'ls-remote', 'cat-file', 'describe', 'shortlog', 'grep', 'merge-base', 'name-rev',
  'for-each-ref', 'show-ref', 'check-ignore', 'check-attr', 'count-objects', 'version', 'help',
  'whatchanged', 'range-diff', 'diff-tree', 'diff-files', 'diff-index', 'var', 'cherry',
]);
// Subcomandos que alteram só os arquivos indicados (conferidos contra a área).
const GIT_COM_CAMINHOS = new Set(['add', 'rm', 'mv', 'restore', 'checkout', 'reset']);

function separarGit(args, cwd) {
  let i = 0;
  let gitCwd = cwd;
  let configuracao = null; // `-c`, `--config-env` ou `--exec-path` na linha de comando
  while (i < args.length && args[i].texto.startsWith('-')) {
    const t = args[i].texto;
    if (/^--(config-env|exec-path)/.test(t)) configuracao = configuracao ?? t.split('=')[0];
    if (t === '-C') {
      const dir = args[i + 1];
      gitCwd = !dir || dir.dinamico || dir.glob || !gitCwd ? null : resolverCaminho(dir.texto, gitCwd);
      i += 2;
    } else if (t === '-c') {
      configuracao = configuracao ?? '-c';
      i += 2;
    } else if (/^--(git-dir|work-tree|namespace)/.test(t)) {
      return { erro: `git ${t}: repositório/árvore alternativos não são verificados` };
    } else {
      i++;
    }
  }
  const sub = args[i] ? args[i].texto : '';
  return { sub, resto: args.slice(i + 1), gitCwd, dinamico: args[i]?.dinamico, configuracao };
}

// Formas de leitura de subcomandos que também escrevem (branch, tag, config...).
function gitLeituraCondicional(sub, resto) {
  const { opcoes, posicionais } = separarArgs(resto);
  const tem = (...nomes) => opcoes.some((o) => nomes.includes(o.nome));
  const primeiro = posicionais[0]?.texto;
  switch (sub) {
    case 'branch':
      if (tem('-d', '-D', '-m', '-M', '-c', '-C', '--delete', '--move', '--copy', '-u', '--set-upstream-to', '--unset-upstream', '--edit-description', '-f', '--force')) return false;
      return posicionais.length === 0 || tem('-l', '--list', '--contains', '--no-contains', '--merged', '--no-merged', '--points-at', '--format', '--sort');
    case 'tag':
      if (tem('-d', '--delete', '-a', '--annotate', '-s', '--sign', '-u', '-f', '--force', '-m', '-F')) return false;
      return posicionais.length === 0 || tem('-l', '--list', '--contains', '--no-contains', '--points-at', '--merged', '--no-merged');
    case 'remote':
      return primeiro === undefined || primeiro === 'show' || primeiro === 'get-url';
    case 'stash':
      return primeiro === 'list' || primeiro === 'show';
    case 'worktree':
      return primeiro === 'list';
    case 'reflog':
      return primeiro !== 'expire' && primeiro !== 'delete';
    case 'config':
      if (tem('--unset', '--unset-all', '--add', '--replace-all', '--remove-section', '--rename-section', '-e', '--edit')) return false;
      if (tem('--get', '--get-all', '--get-regexp', '--get-urlmatch', '-l', '--list')) return true;
      if (primeiro === 'get' || primeiro === 'list') return true;
      return posicionais.length <= 1;
    default:
      return false;
  }
}

function git(args, contexto) {
  const { estado } = contexto;
  const { sub, resto, gitCwd, erro, dinamico, configuracao } = separarGit(args, contexto.cwd);
  if (erro) return [negar(erro)];
  // Configuração na linha de comando (`-c diff.external=...`, `-c core.pager=...`,
  // `--config-env`, `--exec-path`) faz o git executar outro programa: negada para
  // TODO subagente (D6, bloqueante 4).
  if (configuracao) {
    return [negar(`git ${configuracao} (configuração na linha de comando) executa programas: não é permitido`)];
  }
  // `git grep -O<programa>` abre os arquivos num programa qualquer.
  if (sub === 'grep' && resto.some((a) => /^(-O|--open-files-in-pager)/.test(a.texto))) {
    return [negar('git grep -O executa um programa: não é permitido')];
  }
  if (!sub || sub === '--version') return [];
  if (dinamico) return [negar('subcomando git dinâmico não pode ser verificado')];
  const alvo = (p, opcoes) => conferirAlvo(p, estado, gitCwd, opcoes);

  if (GIT_LEITURA.has(sub)) {
    // `git diff --output=arquivo` escreve um arquivo.
    const { opcoes } = separarArgs(resto, new Set(['--output']));
    const saida = valorDe(opcoes, ['--output']);
    if (!saida) return [];
    return estado.leitura ? [negar(`o ${estado.agente} é somente leitura: git ${sub} --output`)] : [alvo(saida)];
  }
  if (gitLeituraCondicional(sub, resto)) return [];
  if (!estado.leitura && sub === 'fetch') return []; // só atualiza referências remotas
  if (estado.leitura || !GIT_COM_CAMINHOS.has(sub)) {
    return [negar(`git ${sub} altera o repositório ou a árvore de trabalho: é do orquestrador`)];
  }

  // add, rm, mv, restore, checkout, reset: só com caminhos explícitos, dentro da área.
  if (sub === 'mv') return moverOuCopiar(resto, { ...contexto, cwd: gitCwd }, { moveOrigem: true });
  const indiceSeparador = resto.findIndex((a) => a.texto === '--' && !a.dinamico);
  let caminhos;
  if (sub === 'checkout' || sub === 'reset') {
    if (indiceSeparador === -1) {
      return [negar(`git ${sub} sem "-- <caminhos>" troca de branch ou mexe na árvore inteira: é do orquestrador`)];
    }
    const antes = separarArgs(resto.slice(0, indiceSeparador)).opcoes;
    if (sub === 'reset' && antes.some((o) => ['--hard', '--soft', '--merge', '--keep'].includes(o.nome))) {
      return [negar('git reset --hard/--soft/--merge/--keep: é do orquestrador')];
    }
    caminhos = resto.slice(indiceSeparador + 1);
  } else {
    caminhos = separarArgs(resto, new Set(['-s', '--source', '--pathspec-from-file', '--chmod'])).posicionais;
    if (separarArgs(resto).opcoes.some((o) => o.nome === '--pathspec-from-file')) {
      return [negar(`git ${sub} --pathspec-from-file não é verificado`)];
    }
  }
  if (!caminhos.length) return [negar(`git ${sub} sem caminhos explícitos atinge a árvore inteira: é do orquestrador`)];
  return caminhos.map((p) => alvo(p, { seDiretorio: true }));
}

// ---------------------------------------------------------------------------
// code-reviewer (somente leitura): só comandos de uma lista de leitura,
// testes, lint, build e o validador.
// ---------------------------------------------------------------------------

const LEITURA_LIVRE = new Set([
  'cat', 'head', 'tail', 'wc', 'grep', 'egrep', 'fgrep', 'rg', 'ls', 'dir', 'pwd', 'echo',
  'printf', 'diff', 'cmp', 'cut', 'tr', 'jq', 'file', 'stat', 'du', 'df', 'tree', 'which',
  'type', 'basename', 'dirname', 'realpath', 'readlink', 'date', 'true', 'false', 'test', '[',
  'nl', 'column', 'comm', 'od', 'sha256sum', 'sha1sum', 'md5sum', 'env', 'exit', 'uniq', 'sort',
  'read', '[[',
]);
const SCRIPT_NPM_LEITURA = /^(test|lint|build)(:[\w:-]+)?$/;
// Opções que fazem testes e lint gravarem arquivos (snapshots, relatórios).
const OPCAO_QUE_GRAVA = /^(-u|--update[\w-]*|--outputFile|--test-reporter-destination)(=|$)/;
// Opções do node que executam código além dos testes (inclui qualquer opção curta, como `-e` e `-pe`).
const NODE_EXECUTA = /^(--import|--require|--loader|--experimental-loader|--eval|--print)(=|$)|^-[^-]/;

function avaliarLeitura(nome, args, contexto) {
  const { estado } = contexto;
  const recusa = (detalhe) => [negar(`o ${estado.agente} é somente leitura: ${detalhe}`)];
  const textos = args.map((a) => a.texto);

  // `--fix` (eslint e afins) corrige arquivos, mesmo passado por `npm run lint -- --fix`.
  const fix = textos.find((t) => /^--fix(=|$)/.test(t));
  if (fix) return recusa(`${nome} ${fix} altera arquivos`);
  if (['npm', 'npx', 'node'].includes(nome)) {
    const grava = textos.find((t) => OPCAO_QUE_GRAVA.test(t));
    if (grava) return recusa(`${nome} ${grava} grava arquivos (snapshots ou relatórios)`);
  }

  if (LEITURA_LIVRE.has(nome)) {
    if (nome === 'sort' && textos.some((t) => t === '-o' || t.startsWith('--output') || /^-[^-]*o/.test(t))) {
      return recusa('sort -o escreve arquivo');
    }
    if (nome === 'uniq' && separarArgs(args).posicionais.length > 1) return recusa('uniq com arquivo de saída');
    return [];
  }
  switch (nome) {
    case 'git':
      return git(args, contexto);
    case 'sed': {
      if (separarSed(args).noLugar) return recusa('sed -i edita arquivos');
      const perigo = sedPerigoso(args);
      return perigo ? recusa(perigo) : [];
    }
    case 'find': {
      const proibido = textos.find((t) => t === '-delete' || FIND_EXEC.has(t) || FIND_ARQUIVO.has(t));
      return proibido ? recusa(`find ${proibido}`) : [];
    }
    case 'npm': {
      const { posicionais } = separarArgs(args, new Set(['-w', '--workspace', '--prefix']));
      const [sub, script] = posicionais.map((p) => p.texto);
      if (textos.includes('--version') || textos.includes('-v')) return [];
      if (['test', 't', 'ls', 'outdated'].includes(sub)) return [];
      if (sub === 'audit' && !posicionais.some((p) => p.texto === 'fix')) return [];
      if ((sub === 'run' || sub === 'run-script') && script && SCRIPT_NPM_LEITURA.test(script)) return [];
      return recusa(`npm ${posicionais.map((p) => p.texto).join(' ')} não é teste, lint ou build`);
    }
    case 'npx': {
      const { opcoes, posicionais } = separarArgs(args);
      const [ferramenta, sub] = posicionais.map((p) => p.texto);
      const tem = (n) => opcoes.some((o) => o.nome === n);
      if (ferramenta === 'vitest') return [];
      if (ferramenta === 'playwright' && (sub === 'test' || sub === 'show-report')) return [];
      if (ferramenta === 'eslint' && !tem('--fix')) return [];
      if (ferramenta === 'tsc' && (tem('--noEmit') || tem('-b') || tem('--build'))) return [];
      return recusa(`npx ${posicionais.map((p) => p.texto).join(' ')} não é teste, lint ou checagem de tipos`);
    }
    case 'node': {
      if (textos.every((t) => t === '--version' || t === '-v')) return [];
      if (textos[0] !== '--test') return recusa('node só para --version ou --test');
      const executa = textos.find((t) => NODE_EXECUTA.test(t));
      return executa ? recusa(`node --test com ${executa} executa código além dos testes`) : [];
    }
    case 'python':
    case 'python3':
    case 'py':
      return pythonLeitura(args, recusa);
    case 'xargs':
      return xargs(args, contexto);
    default:
      if (SHELLS.has(nome)) {
        const achados = shellComC(args, contexto);
        const temC = args.some((a) => /^-[a-zA-Z]*c[a-zA-Z]*$/.test(a.texto));
        return temC ? achados : recusa(`${nome} sem -c (script) não é verificado`);
      }
      if (nome === 'eval') return reanalisar(args, contexto, 'eval');
      if (AWKS.has(nome)) return awkLeitura(args, recusa);
      return recusa(`"${nome}" não está na lista de leitura (git de leitura, testes, lint, build, validador e utilitários de leitura)`);
  }
}

// python: só o validador. `-X utf8` e `-W ignore` têm valor; `-c` e `-m`
// executariam outro código no lugar do script.
function pythonLeitura(args, recusa) {
  const textos = args.map((a) => a.texto);
  if (textos.length && textos.every((t) => t === '--version' || t === '-V')) return [];
  let i = 0;
  while (i < args.length && args[i].texto.startsWith('-') && !args[i].dinamico) {
    const t = args[i].texto;
    if (t === '-X' || t === '-W') {
      i += 2;
      continue;
    }
    if (/^-[^-]*[cm]/.test(t)) return recusa(`python ${t} executa outro código no lugar do validador`);
    i++;
  }
  const script = args[i];
  if (script && !script.dinamico && script.texto.replace(/\\/g, '/').endsWith('scripts/validar_estrutura.py')) return [];
  return recusa('python só para o validador (scripts/validar_estrutura.py)');
}

// awk de leitura: só `-F` e `-v`; o programa não pode gravar (`>`), abrir
// processos (`|`, `system`) nem carregar extensões (`@load`, `@include`).
function awkLeitura(args, recusa) {
  const { opcoes, programas } = separarAwk(args);
  const proibida = opcoes.find((o) => !['-F', '--field-separator', '-v', '--assign'].includes(o.nome));
  if (proibida) return recusa(`awk ${proibida.nome} (na leitura, só -F e -v)`);
  const [programa] = programas;
  if (!programa || programa.dinamico) return recusa('awk sem programa visível');
  if (/system|@|>|(^|[^|])\|(?!\|)/.test(programa.texto)) {
    return recusa('programa do awk com system, @, > ou | pode gravar ou executar');
  }
  return [];
}

// ---------------------------------------------------------------------------
// PowerShell (nenhum subagente do projeto tem esta ferramenta; vale como reforço):
// só leitura, por uma checagem de verbos que escrevem.
// ---------------------------------------------------------------------------

const PS_ESCRITA = /\b(Set-Content|Add-Content|Out-File|New-Item|Remove-Item|Move-Item|Copy-Item|Rename-Item|Clear-Content|Clear-Item|Set-Item|Tee-Object|Export-[A-Za-z]+|Invoke-Expression|Invoke-Item|Invoke-Command|Start-Process|Expand-Archive|Compress-Archive|Invoke-WebRequest|Invoke-RestMethod)\b/i;
const PS_APELIDOS = /(^|[;|&({\n]\s*)(rm|del|erase|rd|rmdir|mv|move|cp|copy|cpi|mi|ri|ni|sc|ac|tee|iex|ii|icm|saps|start|md|mkdir|ren|rni|bash|sh|cmd|wsl)(\.exe)?(\s|$)/i;
const PS_DOTNET = /\[(System\.)?IO\.(File|Directory|FileInfo|DirectoryInfo|StreamWriter)\]|::(Write|Append|Create|Delete|Move|Copy|Replace)\w*\(/i;
const PS_REDIRECIONAMENTO = /[*\d]?>>?(?!\s*\$null)(?!&\d)/;
const PS_GIT = /\bgit(?:\.exe)?(?:\s+-\S+)*\s+([a-z][a-z-]*)([^;|&\n]*)/gi;

function avaliarPowerShell(ctx, comando) {
  if (SOMENTE_LEITURA.has(ctx.agente)) return [negar(`o ${ctx.agente} usa só o Bash, com a lista de leitura`)];
  if (typeof comando !== 'string' || !comando.trim()) return [negar('comando vazio')];
  // Tira o conteúdo entre aspas (textos), para olhar só os comandos.
  const semTextos = comando.replace(/'[^']*'|"(?:`.|[^"`])*"/g, "''");
  const achados = [];
  if (PS_ESCRITA.test(semTextos) || PS_APELIDOS.test(semTextos) || PS_DOTNET.test(comando)) {
    achados.push(negar('PowerShell: comandos que escrevem não são analisados para subagentes; use Edit/Write ou o Bash'));
  }
  if (PS_REDIRECIONAMENTO.test(semTextos)) achados.push(negar('PowerShell: redirecionamento para arquivo não é analisado para subagentes'));
  for (const m of semTextos.matchAll(PS_GIT)) {
    const sub = m[1].toLowerCase();
    const resto = m[2].trim().split(/\s+/).filter(Boolean).map((t) => palavra(t));
    if (!GIT_LEITURA.has(sub) && sub !== 'fetch' && !gitLeituraCondicional(sub, resto)) {
      achados.push(negar(`PowerShell: git ${sub} altera o repositório ou a árvore de trabalho: é do orquestrador`));
    }
  }
  return achados;
}
