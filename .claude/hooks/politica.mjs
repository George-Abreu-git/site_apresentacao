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

// Palavra sintética (ex.: destino/nome-do-arquivo de um `mv`).
const palavra = (texto, base = {}) => ({ texto, dinamico: !!base.dinamico, glob: !!base.glob });

// Confere um alvo de escrita. `subarvore` quando a operação atinge o que há dentro.
function conferirAlvo(alvo, estado, cwd, { subarvore = false, seDiretorio = false } = {}) {
  if (alvo.dinamico) return negar(`alvo dinâmico "${alvo.texto || '$…'}" não pode ser verificado`);
  let texto = alvo.texto;
  if (ehDescarte(texto)) return PERMITIR;
  if (!texto) return negar('alvo vazio');
  if (texto.startsWith(':')) return negar(`pathspec especial do git "${texto}" não é verificado`);
  let emSubarvore = subarvore;
  if (alvo.glob) {
    // Com curinga, vale a pasta antes dele inteira: nada proibido pode estar lá dentro.
    const antes = texto.slice(0, texto.search(/[*?[]/));
    const barra = antes.lastIndexOf('/');
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

// Tira atribuições (`VAR=x cmd`) e "embrulhos" (`nohup cmd`, `timeout 5 cmd`).
function desembrulhar(palavras) {
  let p = palavras.slice();
  for (;;) {
    while (p.length && ATRIBUICAO.test(p[0].texto)) p = p.slice(1);
    if (!p.length) return p;
    const nome = nomeDoComando(p[0]);
    if (['command', 'builtin', 'exec', 'nohup', 'time', 'stdbuf', 'sudo'].includes(nome)) {
      p = p.slice(1);
      while (p.length && p[0].texto.startsWith('-')) p = p.slice(1);
    } else if (nome === 'nice' || nome === 'timeout') {
      p = p.slice(1);
      while (p.length && p[0].texto.startsWith('-')) p = p.slice(p[0].texto === '-n' ? 2 : 1);
      if (nome === 'timeout' && p.length) p = p.slice(1); // a duração
    } else if (nome === 'env') {
      p = p.slice(1);
      while (p.length && (p[0].texto.startsWith('-') || ATRIBUICAO.test(p[0].texto))) p = p.slice(1);
      if (!p.length) return [palavra('env')];
    } else {
      return p;
    }
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

  // 2. O comando em si.
  const palavras = desembrulhar(item.palavras);
  if (!palavras.length) return achados;
  if (palavras[0].dinamico) {
    achados.push(negar(`nome de comando dinâmico ("${palavras[0].texto || '$…'}") não pode ser verificado`));
    return achados;
  }
  const nome = nomeDoComando(palavras[0]);
  const args = palavras.slice(1);

  if (nome === 'cd' || nome === 'pushd') {
    const destino = args.find((a) => !a.texto.startsWith('-') || a.texto === '-');
    if (!destino) local.cwd = process.env.HOME || process.env.USERPROFILE || null;
    else if (destino.dinamico || destino.texto === '-') local.cwd = null;
    else local.cwd = local.cwd ? resolverCaminho(destino.texto, local.cwd) : resolverCaminho(destino.texto, null);
    return achados;
  }
  if (nome === 'popd') {
    local.cwd = null;
    return achados;
  }

  const contexto = { estado, cwd: local.cwd, profundidade };
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
  'ln', 'tee', 'sed', 'perl', 'dd', 'chmod', 'chown', 'chgrp', 'git', 'patch',
]);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh']);

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
    case 'sed':
      return sedNoLugar(args, contexto);
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
    case 'git':
      return git(args, contexto);
    case 'find':
      return find(args, contexto);
    case 'xargs':
      return xargs(args, contexto);
    case 'eval':
      return reanalisar(args, contexto, 'eval');
    default:
      break;
  }
  if (SHELLS.has(nome)) return shellComC(args, contexto);
  return codigoInline(nome, args);
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
      achados.push(conferirAlvo(palavra(texto, { dinamico: destino.dinamico || o.dinamico, glob: destino.glob || o.glob }), estado, cwd));
    }
  } else {
    achados.push(conferirAlvo(destino, estado, cwd));
  }
  return achados;
}

// `sed -i` edita no lugar: os arquivos são os posicionais depois do script.
function sedNoLugar(args, contexto) {
  let noLugar = false;
  let temScript = false;
  const posicionais = [];
  let fimDasOpcoes = false;
  for (let i = 0; i < args.length; i++) {
    const t = args[i].texto;
    if (!fimDasOpcoes && t === '--') {
      fimDasOpcoes = true;
    } else if (!fimDasOpcoes && t.startsWith('--')) {
      if (t.startsWith('--in-place')) noLugar = true;
      if (t === '--expression' || t === '--file') {
        temScript = true;
        i++;
      } else if (t.startsWith('--expression=') || t.startsWith('--file=')) {
        temScript = true;
      }
    } else if (!fimDasOpcoes && t.length > 1 && t.startsWith('-')) {
      for (let j = 1; j < t.length; j++) {
        const c = t[j];
        if (c === 'i') {
          noLugar = true;
          break; // o resto é o sufixo do backup (ex.: -i.bak)
        }
        if (c === 'e' || c === 'f') {
          temScript = true;
          if (j === t.length - 1) i++; // o script/arquivo é o próximo argumento
          break;
        }
        if (c === 'l') {
          if (j === t.length - 1) i++;
          break;
        }
      }
    } else {
      posicionais.push(args[i]);
    }
  }
  if (!noLugar) return [];
  const arquivos = temScript ? posicionais : posicionais.slice(1);
  if (!arquivos.length) return [negar('sed -i sem arquivo identificável')];
  return arquivos.map((p) => conferirAlvo(p, contexto.estado, contexto.cwd));
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
      if (interno.length && ESCRITORES.has(nomeDoComando(interno[0]))) atingeRaizes = true;
    }
  }
  if (atingeRaizes) {
    for (const r of raizes) achados.push(conferirAlvo(r, estado, cwd, { subarvore: true }));
  }
  return achados;
}

// xargs: os alvos vêm da entrada padrão; se o comando escreve, não dá para verificar.
const XARGS_COM_VALOR = new Set(['-n', '-I', '-P', '-d', '-L', '-s', '-a', '-E', '--max-args', '--max-procs', '--delimiter', '--arg-file']);

function xargs(args, contexto) {
  let i = 0;
  while (i < args.length && args[i].texto.startsWith('-')) {
    i += XARGS_COM_VALOR.has(args[i].texto) ? 2 : 1;
  }
  const interno = args.slice(i);
  if (!interno.length) return [];
  const nome = nomeDoComando(interno[0]);
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
  while (i < args.length && args[i].texto.startsWith('-')) {
    const t = args[i].texto;
    if (t === '-C') {
      const dir = args[i + 1];
      gitCwd = !dir || dir.dinamico || !gitCwd ? null : resolverCaminho(dir.texto, gitCwd);
      i += 2;
    } else if (t === '-c') {
      i += 2;
    } else if (/^--(git-dir|work-tree|namespace)/.test(t)) {
      return { erro: `git ${t}: repositório/árvore alternativos não são verificados` };
    } else {
      i++;
    }
  }
  const sub = args[i] ? args[i].texto : '';
  return { sub, resto: args.slice(i + 1), gitCwd, dinamico: args[i]?.dinamico };
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
  const { sub, resto, gitCwd, erro, dinamico } = separarGit(args, contexto.cwd);
  if (erro) return [negar(erro)];
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
]);
const SCRIPT_NPM_LEITURA = /^(test|lint|build)(:[\w:-]+)?$/;

function avaliarLeitura(nome, args, contexto) {
  const { estado } = contexto;
  const recusa = (detalhe) => [negar(`o ${estado.agente} é somente leitura: ${detalhe}`)];
  const textos = args.map((a) => a.texto);

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
      if (sedNoLugar(args, contexto).length || textos.some((t) => /^-[^-]*i|^--in-place/.test(t))) {
        return recusa('sed -i edita arquivos');
      }
      // Comandos `w`/`W` (gravar em arquivo) e `e` (executar) do sed.
      if (textos.some((t) => /(^|[;{}\s/])[wWe]\s+\S/.test(t))) return recusa('script do sed com w/e');
      return [];
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
    case 'node':
      if (textos.every((t) => t === '--version' || t === '-v')) return [];
      if (textos[0] === '--test') return [];
      return recusa('node só para --version ou --test');
    case 'python':
    case 'python3':
    case 'py': {
      const posicionais = separarArgs(args).posicionais.map((p) => p.texto.replace(/\\/g, '/'));
      if (textos.every((t) => t === '--version' || t === '-V')) return [];
      if (posicionais[0] && posicionais[0].endsWith('scripts/validar_estrutura.py')) return [];
      return recusa('python só para o validador (scripts/validar_estrutura.py)');
    }
    case 'xargs':
      return xargs(args, contexto);
    default:
      if (SHELLS.has(nome)) {
        const achados = shellComC(args, contexto);
        const temC = args.some((a) => /^-[a-zA-Z]*c[a-zA-Z]*$/.test(a.texto));
        return temC ? achados : recusa(`${nome} sem -c (script) não é verificado`);
      }
      if (nome === 'eval') return reanalisar(args, contexto, 'eval');
      return recusa(`"${nome}" não está na lista de leitura (git de leitura, testes, lint, build, validador e utilitários de leitura)`);
  }
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
