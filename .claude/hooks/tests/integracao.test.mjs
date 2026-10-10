// Testes de integração do hook (T-001): executam o script de verdade, como o
// Claude Code faz (JSON pela entrada padrão), e conferem o registro no
// .claude/settings.json. Rodar: `npm run test:hooks`.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from 'node:test';

const PASTA_HOOKS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = path.resolve(PASTA_HOOKS, '..', '..');
const SCRIPT = path.join(PASTA_HOOKS, 'restringir-escrita.mjs');

// Roda o hook com `entrada` (objeto ou texto cru) e devolve { codigo, saida }.
function rodarHook(entrada) {
  const texto = typeof entrada === 'string' ? entrada : JSON.stringify(entrada);
  const r = spawnSync(process.execPath, [SCRIPT], { input: texto, encoding: 'utf8', timeout: 10000 });
  return { codigo: r.status, saida: r.stdout.trim() };
}

const chamada = (agente, ferramenta, dados) => ({
  session_id: 's',
  hook_event_name: 'PreToolUse',
  cwd: RAIZ,
  tool_name: ferramenta,
  tool_input: dados,
  ...(agente ? { agent_id: `agent-${agente}`, agent_type: agente } : {}),
});

const decisao = (saida) => (saida ? JSON.parse(saida).hookSpecificOutput.permissionDecision : 'sem saída');

describe('script restringir-escrita.mjs', () => {
  test('sessão principal: sai com 0 e sem saída (segue o fluxo normal)', () => {
    const r = rodarHook(chamada(undefined, 'Write', { file_path: path.join(RAIZ, 'docs/03-tarefas/x.md') }));
    assert.deepEqual(r, { codigo: 0, saida: '' });
  });
  test('subagente fora da área: JSON com "deny" e o motivo', () => {
    const r = rodarHook(chamada('dev', 'Write', { file_path: path.join(RAIZ, 'docs/03-tarefas/x.md') }));
    assert.equal(r.codigo, 0);
    assert.equal(decisao(r.saida), 'deny');
    assert.match(JSON.parse(r.saida).hookSpecificOutput.permissionDecisionReason, /orquestrador/);
  });
  test('subagente dentro da área: sem saída (nunca devolve "allow")', () => {
    const r = rodarHook(chamada('dev', 'Write', { file_path: path.join(RAIZ, 'apps/web/src/x.ts') }));
    assert.deepEqual(r, { codigo: 0, saida: '' });
  });
  test('devops na definição de um agente: "ask" (o George confirma)', () => {
    const r = rodarHook(chamada('devops', 'Edit', { file_path: path.join(RAIZ, '.claude/agents/dev.md') }));
    assert.equal(decisao(r.saida), 'ask');
  });
  test('Bash do qa: e2e permitido, escrita no código do dev negada', () => {
    assert.equal(decisao(rodarHook(chamada('qa', 'Bash', { command: 'npm run test:e2e' })).saida), 'sem saída');
    assert.equal(decisao(rodarHook(chamada('qa', 'Bash', { command: 'echo x > apps/web/src/a.ts' })).saida), 'deny');
  });
  test('JSON com BOM no início também é lido', () => {
    const json = JSON.stringify(chamada('dev', 'Write', { file_path: path.join(RAIZ, 'docs/03-tarefas/x.md') }));
    assert.equal(decisao(rodarHook(String.fromCharCode(0xfeff) + json).saida), 'deny');
  });
  test('entrada ilegível não trava a sessão: sai com 0 e sem saída', () => {
    assert.deepEqual(rodarHook('isto não é JSON'), { codigo: 0, saida: '' });
    assert.deepEqual(rodarHook(''), { codigo: 0, saida: '' });
  });
});

describe('.claude/settings.json', () => {
  const settings = JSON.parse(fs.readFileSync(path.join(RAIZ, '.claude/settings.json'), 'utf8'));

  test('registra o hook PreToolUse para Edit/Write/MultiEdit/NotebookEdit/Bash/PowerShell', () => {
    const grupos = settings.hooks?.PreToolUse ?? [];
    const grupo = grupos.find((g) => g.hooks?.some((h) => h.args?.some((a) => a.endsWith('restringir-escrita.mjs'))));
    assert.ok(grupo, 'grupo do hook restringir-escrita não encontrado');
    const ferramentas = grupo.matcher.split('|');
    for (const f of ['Edit', 'Write', 'MultiEdit', 'NotebookEdit', 'Bash', 'PowerShell']) {
      assert.ok(ferramentas.includes(f), `matcher sem ${f}`);
    }
    const hook = grupo.hooks.find((h) => h.args?.some((a) => a.endsWith('restringir-escrita.mjs')));
    assert.equal(hook.type, 'command');
    assert.equal(hook.command, 'node');
    assert.equal(hook.args[0], '${CLAUDE_PROJECT_DIR}/.claude/hooks/restringir-escrita.mjs');
  });

  test('regras deny para git push --force/-f e rm -rf (critério 31)', () => {
    const deny = settings.permissions?.deny ?? [];
    for (const regra of ['Bash(git push --force *)', 'Bash(git push -f *)', 'Bash(git push * --force)', 'Bash(git push * -f)', 'Bash(rm -rf *)']) {
      assert.ok(deny.includes(regra), `falta a regra deny ${regra}`);
    }
  });
});
