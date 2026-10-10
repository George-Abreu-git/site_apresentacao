// Analisador mínimo de comandos Bash para os hooks de restrição de escrita (T-001).
//
// Não é um interpretador de shell completo: ele separa um comando em comandos
// simples (por `&&`, `||`, `;`, `|`, `&`, quebras de linha e parênteses),
// entende aspas, escapes, redirecionamentos, heredocs e substituições de
// comando (`$(...)` e crases, analisadas também). Cada palavra sabe se é
// "dinâmica" (tem `$VAR`, `$(...)`, `$'...'`...) ou tem curinga (`*`, `?`, `[`,
// chaves como `{a,b}` e `{1..3}`), porque aí o hook não consegue saber o caminho
// final e trata com mais cuidado.

const OPERADORES_SEPARADORES = ['&&', '||', ';;', '|&', ';', '|', '&'];

// Uma palavra em construção: texto já sem aspas + marcas.
//   glob   → curinga ou expansão de chaves fora de aspas
//   chaves → expansão de chaves (`{a,b}`, `{1..3}`) fora de aspas
//   citada → usou aspas ou `\` em alguma parte
function novaPalavra() {
  return { texto: '', dinamico: false, glob: false, chaves: false, citada: false, iniciada: false, abriuChave: false };
}

export class ErroDeAnalise extends Error {}

// Lê de `inicio` (logo depois de `$(`, `<(`, `>(` ou de uma crase) até o
// fechamento correspondente, respeitando aspas. Retorna [conteudo, proximoIndice].
function lerAteFechar(texto, inicio, fechamento) {
  if (fechamento === '`') {
    let i = inicio;
    let conteudo = '';
    while (i < texto.length) {
      const c = texto[i];
      if (c === '\\' && i + 1 < texto.length) {
        conteudo += texto[i + 1];
        i += 2;
        continue;
      }
      if (c === '`') return [conteudo, i + 1];
      conteudo += c;
      i++;
    }
    throw new ErroDeAnalise('crase sem fechamento');
  }
  let profundidade = 1;
  let i = inicio;
  while (i < texto.length) {
    const c = texto[i];
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (c === "'") {
      const fim = texto.indexOf("'", i + 1);
      if (fim === -1) throw new ErroDeAnalise('aspas simples sem fechamento');
      i = fim + 1;
      continue;
    }
    if (c === '"') {
      i++;
      while (i < texto.length && texto[i] !== '"') i += texto[i] === '\\' ? 2 : 1;
      if (i >= texto.length) throw new ErroDeAnalise('aspas duplas sem fechamento');
      i++;
      continue;
    }
    if (c === '(') profundidade++;
    if (c === ')') {
      profundidade--;
      if (profundidade === 0) return [texto.slice(inicio, i), i + 1];
    }
    i++;
  }
  throw new ErroDeAnalise('parêntese sem fechamento');
}

// Quebra o comando em tokens: palavras, operadores e redirecionamentos.
// Também devolve o texto de cada substituição de comando, para análise recursiva.
export function tokenizar(texto) {
  const tokens = [];
  const substituicoes = [];
  const heredocsPendentes = [];
  let palavra = novaPalavra();
  let i = 0;

  const fecharPalavra = () => {
    if (palavra.iniciada) tokens.push({ tipo: 'palavra', ...palavra });
    palavra = novaPalavra();
  };
  const marcar = () => {
    palavra.iniciada = true;
  };

  // Trata `$` (fora de aspas simples). Retorna o novo índice.
  const tratarCifrao = (j, dentroDeAspas = false) => {
    const prox = texto[j + 1];
    if (!dentroDeAspas && prox === "'") {
      // $'...' (aspas ANSI-C): os escapes (`\x2e`...) mudam o texto final.
      let fim = j + 2;
      while (fim < texto.length && texto[fim] !== "'") fim += texto[fim] === '\\' ? 2 : 1;
      if (fim >= texto.length) throw new ErroDeAnalise("$' sem fechamento");
      palavra.texto += texto.slice(j + 2, fim);
      palavra.dinamico = true;
      palavra.citada = true;
      marcar();
      return fim + 1;
    }
    if (!dentroDeAspas && prox === '"') {
      // $"..." (tradução de mensagens): o texto final depende do idioma.
      palavra.dinamico = true;
      marcar();
      return j + 1; // as aspas duplas seguem o tratamento normal
    }
    if (prox === '(' && texto[j + 2] === '(') {
      // Aritmética $(( ... )): não executa comandos, mas o valor é dinâmico.
      const [, fim] = lerAteFechar(texto, j + 2, ')');
      palavra.dinamico = true;
      marcar();
      return texto[fim] === ')' ? fim + 1 : fim;
    }
    if (prox === '(') {
      const [conteudo, fim] = lerAteFechar(texto, j + 2, ')');
      substituicoes.push(conteudo);
      palavra.dinamico = true;
      marcar();
      return fim;
    }
    if (prox === '{') {
      const fim = texto.indexOf('}', j + 2);
      if (fim === -1) throw new ErroDeAnalise('${ sem fechamento');
      palavra.dinamico = true;
      marcar();
      return fim + 1;
    }
    if (prox && /[A-Za-z0-9_@*#?$!-]/.test(prox)) {
      let fim = j + 2;
      if (/[A-Za-z_]/.test(prox)) while (fim < texto.length && /[A-Za-z0-9_]/.test(texto[fim])) fim++;
      palavra.dinamico = true;
      marcar();
      return fim;
    }
    palavra.texto += '$';
    marcar();
    return j + 1;
  };

  while (i < texto.length) {
    const c = texto[i];

    if (c === '\n') {
      fecharPalavra();
      tokens.push({ tipo: 'operador', valor: '\n' });
      i++;
      // Corpo dos heredocs começa na linha seguinte: pula até o delimitador.
      while (heredocsPendentes.length) {
        const { delimitador, tiraTabs } = heredocsPendentes.shift();
        for (;;) {
          if (i >= texto.length) break;
          let fimLinha = texto.indexOf('\n', i);
          if (fimLinha === -1) fimLinha = texto.length;
          let linha = texto.slice(i, fimLinha).replace(/\r$/, '');
          if (tiraTabs) linha = linha.replace(/^\t+/, '');
          i = fimLinha + 1;
          if (linha === delimitador) break;
        }
      }
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      fecharPalavra();
      i++;
      continue;
    }
    if (c === '#' && !palavra.iniciada) {
      // Comentário até o fim da linha.
      while (i < texto.length && texto[i] !== '\n') i++;
      continue;
    }
    if (c === '\\') {
      if (texto[i + 1] === '\n') {
        i += 2; // continuação de linha
        continue;
      }
      if (i + 1 < texto.length) palavra.texto += texto[i + 1];
      palavra.citada = true;
      marcar();
      i += 2;
      continue;
    }
    if (c === "'") {
      const fim = texto.indexOf("'", i + 1);
      if (fim === -1) throw new ErroDeAnalise('aspas simples sem fechamento');
      palavra.texto += texto.slice(i + 1, fim);
      palavra.citada = true;
      marcar();
      i = fim + 1;
      continue;
    }
    if (c === '"') {
      palavra.citada = true;
      marcar();
      i++;
      while (i < texto.length && texto[i] !== '"') {
        const d = texto[i];
        if (d === '\\' && /["\\$`\n]/.test(texto[i + 1] ?? '')) {
          if (texto[i + 1] !== '\n') palavra.texto += texto[i + 1];
          i += 2;
        } else if (d === '$') {
          i = tratarCifrao(i, true);
        } else if (d === '`') {
          const [conteudo, fim] = lerAteFechar(texto, i + 1, '`');
          substituicoes.push(conteudo);
          palavra.dinamico = true;
          i = fim;
        } else {
          palavra.texto += d;
          i++;
        }
      }
      if (i >= texto.length) throw new ErroDeAnalise('aspas duplas sem fechamento');
      i++;
      continue;
    }
    if (c === '$') {
      i = tratarCifrao(i);
      continue;
    }
    if (c === '`') {
      const [conteudo, fim] = lerAteFechar(texto, i + 1, '`');
      substituicoes.push(conteudo);
      palavra.dinamico = true;
      marcar();
      i = fim;
      continue;
    }
    if ((c === '<' || c === '>') && texto[i + 1] === '(') {
      // Substituição de processo <(...) / >(...).
      const [conteudo, fim] = lerAteFechar(texto, i + 2, ')');
      substituicoes.push(conteudo);
      palavra.dinamico = true;
      marcar();
      i = fim;
      continue;
    }

    // Redirecionamentos: [n]> [n]>> >| &> &>> <> < << <<- <<< >& <&
    const redir = /^(&?)(>>|>\||>&|>|<<<|<<-|<<|<>|<&|<)/.exec(texto.slice(i));
    if (redir) {
      // Uma palavra só de dígitos colada no operador é o descritor (ex.: `2>`).
      let fd = '';
      if (!redir[1] && palavra.iniciada && /^\d+$/.test(palavra.texto) && !palavra.dinamico) {
        fd = palavra.texto;
        palavra = novaPalavra();
      } else {
        fecharPalavra();
      }
      const op = redir[1] + redir[2];
      tokens.push({ tipo: 'redir', op, fd });
      i += redir[0].length;
      if (op === '<<' || op === '<<-') {
        // O delimitador é a próxima palavra (sem aspas).
        while (texto[i] === ' ' || texto[i] === '\t') i++;
        const m = /^(['"]?)([^\s'";&|<>()]+)\1/.exec(texto.slice(i));
        if (!m) throw new ErroDeAnalise('heredoc sem delimitador');
        heredocsPendentes.push({ delimitador: m[2], tiraTabs: op === '<<-' });
        tokens.push({ tipo: 'palavra', ...novaPalavra(), texto: m[2], iniciada: true });
        i += m[0].length;
      }
      continue;
    }

    const sep = OPERADORES_SEPARADORES.find((op) => texto.startsWith(op, i));
    if (sep) {
      fecharPalavra();
      tokens.push({ tipo: 'operador', valor: sep });
      i += sep.length;
      continue;
    }
    if (c === '(' || c === ')') {
      fecharPalavra();
      tokens.push({ tipo: 'operador', valor: c });
      i++;
      continue;
    }

    if (c === '*' || c === '?' || c === '[') palavra.glob = true;
    // Chaves fora de aspas com `,` ou `..` depois do `{` viram várias palavras
    // (`{a,b}`, `{1..3}`): o caminho final não é o texto escrito.
    if (c === '{') palavra.abriuChave = true;
    if (palavra.abriuChave && (c === ',' || (c === '.' && texto[i + 1] === '.'))) {
      palavra.glob = true;
      palavra.chaves = true;
    }
    palavra.texto += c;
    marcar();
    i++;
  }
  fecharPalavra();
  return { tokens, substituicoes };
}

// Palavras reservadas que podem abrir um comando simples sem serem o comando.
// `time` não entra aqui: tem opções (`time -p`) e é tratado como embrulho na política.
const PREFIXOS_RESERVADOS = new Set(['then', 'do', 'else', 'elif', '!', '{', '}']);
const ABRE_BLOCO_SEM_COMANDO = new Set(['if', 'while', 'until']);
// Fecham um bloco; sozinhas, não são comando (`done > saida.txt` ainda redireciona).
const FECHA_BLOCO = new Set(['done', 'fi', 'esac']);
// Abrem um cabeçalho que não executa nada: `for x in ...`, `select x in ...`, `case x in`.
const CABECALHOS = new Set(['for', 'select', 'case']);
const IN = new Set(['in']);

const palavraReservada = (t, conjunto) => t.tipo === 'palavra' && !t.citada && !t.dinamico && conjunto.has(t.texto);

// Agrupa os tokens numa lista de itens, na ordem do comando:
//   { tipo: 'comando', palavras: [palavra...], redirecoes: [{ op, fd, alvo }] }
//   { tipo: 'abre' } / { tipo: 'fecha' } — parênteses de subshell, para desfazer
//   um `cd` feito dentro de `( ... )`.
// Cabeçalhos de laço (`for f in a b`) e padrões do `case` (`a|b)`) não são
// comandos: são pulados. As substituições `$(...)` neles já foram analisadas.
export function separarComandos(tokens) {
  const itens = [];
  let atual = { tipo: 'comando', palavras: [], redirecoes: [] };
  let cabecalho = null; // 'for', 'select' ou 'case' enquanto lê o cabeçalho
  let palavrasDoCabecalho = 0;
  let casesAbertos = 0;
  let esperaPadrao = false; // dentro de um `case`, antes do `)` de cada padrão
  const fechar = (operador) => {
    if (atual.palavras.length || atual.redirecoes.length) itens.push(atual);
    if (operador === '(') itens.push({ tipo: 'abre' });
    if (operador === ')') itens.push({ tipo: 'fecha' });
    atual = { tipo: 'comando', palavras: [], redirecoes: [] };
    cabecalho = null;
  };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (esperaPadrao) {
      // Padrão do `case` (`a|b)`, `(a)`) até o `)`; ou o `esac` que fecha o bloco.
      if (t.tipo === 'operador' && t.valor === ')') esperaPadrao = false;
      if (palavraReservada(t, FECHA_BLOCO) && t.texto === 'esac') {
        esperaPadrao = false;
        casesAbertos = Math.max(0, casesAbertos - 1);
      }
      continue;
    }
    if (t.tipo === 'operador') {
      if (cabecalho === 'for' && t.valor === '(' && atual.palavras.length === 0 && palavrasDoCabecalho === 0) {
        // `for ((i = 0; i < 3; i++))`: aritmética, pula até fechar os parênteses.
        let profundidade = 0;
        for (; i < tokens.length; i++) {
          if (tokens[i].tipo !== 'operador') continue;
          if (tokens[i].valor === '(') profundidade++;
          if (tokens[i].valor === ')' && --profundidade === 0) break;
        }
        continue;
      }
      fechar(t.valor);
      if (t.valor === ';;' && casesAbertos > 0) esperaPadrao = true;
      continue;
    }
    if (t.tipo === 'redir') {
      const alvo = tokens[i + 1];
      if (!alvo || alvo.tipo !== 'palavra') throw new ErroDeAnalise(`redirecionamento ${t.op} sem alvo`);
      atual.redirecoes.push({ op: t.op, fd: t.fd, alvo });
      i++;
      continue;
    }
    if (cabecalho) {
      // `case PALAVRA in`: depois do `in` vêm os padrões.
      if (cabecalho === 'case' && palavrasDoCabecalho >= 1 && palavraReservada(t, IN)) {
        atual = { tipo: 'comando', palavras: [], redirecoes: atual.redirecoes };
        cabecalho = null;
        esperaPadrao = true;
        continue;
      }
      palavrasDoCabecalho++;
      continue;
    }
    if (atual.palavras.length === 0) {
      if (palavraReservada(t, CABECALHOS)) {
        cabecalho = t.texto;
        palavrasDoCabecalho = 0;
        if (t.texto === 'case') casesAbertos++;
        continue;
      }
      if (palavraReservada(t, FECHA_BLOCO)) {
        if (t.texto === 'esac') casesAbertos = Math.max(0, casesAbertos - 1);
        continue;
      }
      // Palavras reservadas no início do comando são ignoradas (`then rm x` → `rm x`).
      if (PREFIXOS_RESERVADOS.has(t.texto) || ABRE_BLOCO_SEM_COMANDO.has(t.texto)) continue;
    }
    atual.palavras.push(t);
  }
  fechar(null);
  return itens;
}

// Redirecionamento que escreve em arquivo? Retorna o alvo (palavra) ou null.
export function alvoDeEscrita(redirecao) {
  const { op, alvo } = redirecao;
  if (op === '<' || op === '<<' || op === '<<-' || op === '<<<' || op === '<&') return null;
  // `>&2`, `2>&1`, `>&-`: duplica um descritor, não é arquivo.
  if (op === '>&' && /^(\d+|-)$/.test(alvo.texto) && !alvo.dinamico) return null;
  return alvo;
}
