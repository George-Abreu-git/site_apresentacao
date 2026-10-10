// Analisador mínimo de comandos Bash para os hooks de restrição de escrita (T-001).
//
// Não é um interpretador de shell completo: ele separa um comando em comandos
// simples (por `&&`, `||`, `;`, `|`, `&`, quebras de linha e parênteses),
// entende aspas, escapes, redirecionamentos, heredocs e substituições de
// comando (`$(...)` e crases, analisadas também). Cada palavra sabe se é
// "dinâmica" (tem `$VAR`, `$(...)`...) ou tem curinga (`*`, `?`, `[`), porque aí
// o hook não consegue saber o caminho final e trata com mais cuidado.

const OPERADORES_SEPARADORES = ['&&', '||', ';;', '|&', ';', '|', '&'];

// Uma palavra em construção: texto já sem aspas + marcas.
function novaPalavra() {
  return { texto: '', dinamico: false, glob: false, iniciada: false };
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
  const tratarCifrao = (j) => {
    const prox = texto[j + 1];
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
      marcar();
      i += 2;
      continue;
    }
    if (c === "'") {
      const fim = texto.indexOf("'", i + 1);
      if (fim === -1) throw new ErroDeAnalise('aspas simples sem fechamento');
      palavra.texto += texto.slice(i + 1, fim);
      marcar();
      i = fim + 1;
      continue;
    }
    if (c === '"') {
      marcar();
      i++;
      while (i < texto.length && texto[i] !== '"') {
        const d = texto[i];
        if (d === '\\' && /["\\$`\n]/.test(texto[i + 1] ?? '')) {
          if (texto[i + 1] !== '\n') palavra.texto += texto[i + 1];
          i += 2;
        } else if (d === '$') {
          i = tratarCifrao(i);
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
        tokens.push({ tipo: 'palavra', texto: m[2], dinamico: false, glob: false, iniciada: true });
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
    palavra.texto += c;
    marcar();
    i++;
  }
  fecharPalavra();
  return { tokens, substituicoes };
}

// Palavras reservadas que podem abrir um comando simples sem serem o comando.
const PREFIXOS_RESERVADOS = new Set(['then', 'do', 'else', 'elif', '!', '{', '}', 'time']);
const ABRE_BLOCO_SEM_COMANDO = new Set(['if', 'while', 'until']);

// Agrupa os tokens numa lista de itens, na ordem do comando:
//   { tipo: 'comando', palavras: [palavra...], redirecoes: [{ op, fd, alvo }] }
//   { tipo: 'abre' } / { tipo: 'fecha' } — parênteses de subshell, para desfazer
//   um `cd` feito dentro de `( ... )`.
export function separarComandos(tokens) {
  const itens = [];
  let atual = { tipo: 'comando', palavras: [], redirecoes: [] };
  const fechar = (operador) => {
    if (atual.palavras.length || atual.redirecoes.length) itens.push(atual);
    if (operador === '(') itens.push({ tipo: 'abre' });
    if (operador === ')') itens.push({ tipo: 'fecha' });
    atual = { tipo: 'comando', palavras: [], redirecoes: [] };
  };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.tipo === 'operador') {
      fechar(t.valor);
      continue;
    }
    if (t.tipo === 'redir') {
      const alvo = tokens[i + 1];
      if (!alvo || alvo.tipo !== 'palavra') throw new ErroDeAnalise(`redirecionamento ${t.op} sem alvo`);
      atual.redirecoes.push({ op: t.op, fd: t.fd, alvo });
      i++;
      continue;
    }
    // Palavras reservadas no início do comando são ignoradas (`then rm x` → `rm x`).
    if (atual.palavras.length === 0 && (PREFIXOS_RESERVADOS.has(t.texto) || ABRE_BLOCO_SEM_COMANDO.has(t.texto))) {
      continue;
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
