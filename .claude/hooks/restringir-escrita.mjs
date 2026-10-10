#!/usr/bin/env node
// Hook PreToolUse: restringe a escrita de cada subagente à sua área (T-001).
//
// Registrado em .claude/settings.json para as ferramentas Edit, Write,
// MultiEdit, NotebookEdit, Bash e PowerShell. O Claude Code manda o JSON da
// chamada pela entrada padrão; a regra fica em politica.mjs.
//
// Respostas (https://code.claude.com/docs/en/hooks#pretooluse-decision-control):
//   - permitir  → não imprime nada e sai com 0: segue o fluxo normal de permissões
//                 (nunca devolvemos "allow", que pularia as confirmações).
//   - negar     → JSON com permissionDecision "deny" e o motivo (o agente lê).
//   - perguntar → JSON com permissionDecision "ask": o George confirma ou não.
//
// Segurança da ativação: a sessão principal (sem agent_id) nunca é bloqueada.
// Se o próprio hook falhar, a sessão principal segue (falha aberta) e um
// subagente é bloqueado (falha fechada), com a mensagem do erro.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { avaliar } from './politica.mjs';

// A raiz do repositório é a pasta acima de .claude/hooks/.
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const DECISOES = { negar: 'deny', perguntar: 'ask' };

function responder(decisao, motivo) {
  const permissao = DECISOES[decisao];
  if (!permissao) return; // permitir: sem saída
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: permissao,
      permissionDecisionReason: `[restringir-escrita] ${motivo}`,
    },
  }));
}

async function lerEntrada() {
  const partes = [];
  for await (const parte of process.stdin) partes.push(parte);
  const texto = Buffer.concat(partes).toString('utf8');
  return texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto; // tira o BOM, se vier
}

let entrada = null;
try {
  entrada = JSON.parse(await lerEntrada());
  const { decisao, motivo } = avaliar(entrada, { raiz: RAIZ });
  responder(decisao, motivo);
} catch (erro) {
  if (entrada && entrada.agent_id) {
    responder('negar', `erro interno do hook; subagente bloqueado por segurança (${erro?.message ?? erro})`);
  }
  // Sessão principal ou entrada ilegível: não bloqueia.
}
