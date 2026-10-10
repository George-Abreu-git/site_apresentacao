// Testes da política de restrição de escrita (T-001).
// Rodar: `npm run test:hooks` (ou `node --test .claude/hooks/tests/`).
//
// Cada teste monta o JSON que o Claude Code manda ao hook PreToolUse e confere
// a decisão. Os caminhos ficam num repositório falso, numa pasta temporária,
// para os testes rodarem iguais no Windows e no Linux do CI.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import { avaliar } from '../politica.mjs';

const WINDOWS = process.platform === 'win32';

// Repositório falso com as pastas que importam.
const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-t001-'));
for (const pasta of [
  'apps/web/src', 'apps/web/dist', 'apps/api/src', 'apps/api/test', 'packages/shared/src', 'e2e',
  'docs/02-arquitetura/specs', 'docs/03-tarefas', 'docs/04-estudos/tarefas', '.claude/agents',
  '.claude/hooks', '.github/workflows', 'scripts', '.claude/worktrees/agent-abc/docs/04-estudos/tarefas',
  '.claude/worktrees/agent-abc/docs/03-tarefas', '.claude/worktrees/agent-abc/apps/web',
]) {
  fs.mkdirSync(path.join(raiz, pasta), { recursive: true });
}
after(() => fs.rmSync(raiz, { recursive: true, force: true }));

const entrada = (agente, ferramenta, dados, cwd = raiz) => ({
  session_id: 'sessao-teste',
  hook_event_name: 'PreToolUse',
  cwd,
  tool_name: ferramenta,
  tool_input: dados,
  ...(agente ? { agent_id: `agent-${agente}`, agent_type: agente } : {}),
});

const decidir = (e) => avaliar(e, { raiz }).decisao;
const escrever = (agente, rel, ferramenta = 'Write') => decidir(entrada(agente, ferramenta, { file_path: path.join(raiz, rel), content: 'x' }));
const bash = (agente, comando, cwd = raiz) => decidir(entrada(agente, 'Bash', { command: comando }, cwd));
const powershell = (agente, comando) => decidir(entrada(agente, 'PowerShell', { command: comando }));

// Tabela: [agente, caminho relativo, decisão esperada]
function casosDeArquivo(nome, casos) {
  describe(nome, () => {
    for (const [agente, rel, esperado] of casos) {
      test(`${agente ?? 'sessão principal'} · Write ${rel} → ${esperado}`, () => {
        assert.equal(escrever(agente, rel), esperado);
      });
    }
  });
}

// Tabela: [agente, comando, decisão esperada]
function casosDeBash(nome, casos) {
  describe(nome, () => {
    for (const [agente, comando, esperado] of casos) {
      test(`${agente ?? 'sessão principal'} · ${JSON.stringify(comando)} → ${esperado}`, () => {
        assert.equal(bash(agente, comando), esperado);
      });
    }
  });
}

describe('identificação do agente (critério 29)', () => {
  test('sem agent_id é a sessão principal: nunca bloqueada, nem em docs/03-tarefas', () => {
    assert.equal(escrever(undefined, 'docs/03-tarefas/T-001.md'), 'permitir');
    assert.equal(escrever(undefined, '.claude/agents/dev.md'), 'permitir');
    assert.equal(bash(undefined, 'rm -rf docs/03-tarefas'), 'permitir');
    assert.equal(bash(undefined, 'echo "sem fechar'), 'permitir');
  });
  test('sessão com --agent (agent_type sem agent_id) também é a principal', () => {
    const e = entrada(undefined, 'Write', { file_path: path.join(raiz, 'docs/03-tarefas/x.md') });
    e.agent_type = 'dev';
    assert.equal(decidir(e), 'permitir');
  });
  test('entrada vazia ou estranha não bloqueia a sessão principal', () => {
    assert.equal(avaliar(null, { raiz }).decisao, 'permitir');
    assert.equal(avaliar({}, { raiz }).decisao, 'permitir');
  });
  test('subagente sem caminho ou comando é bloqueado (falha fechada)', () => {
    assert.equal(decidir(entrada('dev', 'Write', {})), 'negar');
    assert.equal(decidir(entrada('dev', 'Bash', { command: 123 })), 'negar');
  });
  test('ferramentas de leitura passam direto', () => {
    assert.equal(decidir(entrada('code-reviewer', 'Read', { file_path: path.join(raiz, 'docs/03-tarefas/x.md') })), 'permitir');
  });
});

casosDeArquivo('Edit/Write por agente (critérios 22 a 27 e 30)', [
  // dev: apps/** e packages/**, exceto apps/api/test/**
  ['dev', 'apps/web/src/App.tsx', 'permitir'],
  ['dev', 'packages/shared/src/index.ts', 'permitir'],
  ['dev', 'apps/web/package.json', 'permitir'],
  ['dev', 'apps/api/test/projetos.e2e-spec.ts', 'negar'],
  ['dev', 'e2e/home.spec.ts', 'negar'],
  ['dev', 'docs/03-tarefas/T-001.md', 'negar'],
  ['dev', 'package.json', 'negar'],
  ['dev', '.claude/agents/dev.md', 'negar'],
  // qa: e2e/** e apps/api/test/**
  ['qa', 'e2e/home.spec.ts', 'permitir'],
  ['qa', 'apps/api/test/projetos.e2e-spec.ts', 'permitir'],
  ['qa', 'apps/web/src/App.tsx', 'negar'],
  ['qa', 'docs/03-tarefas/backlog.md', 'negar'],
  // instrutor: docs/04-estudos/**
  ['instrutor', 'docs/04-estudos/hooks.md', 'permitir'],
  ['instrutor', 'docs/02-arquitetura/specs/x.md', 'negar'],
  ['instrutor', 'docs/03-tarefas/T-001.md', 'negar'],
  // documentador: docs/04-estudos/**, inclusive dentro do worktree dele
  ['documentador', '.claude/worktrees/agent-abc/docs/04-estudos/tarefas/T-001.md', 'permitir'],
  ['documentador', 'docs/04-estudos/tarefas/T-001.md', 'permitir'],
  ['documentador', '.claude/worktrees/agent-abc/docs/03-tarefas/T-001.md', 'negar'],
  ['documentador', '.claude/worktrees/agent-abc/apps/web/x.ts', 'negar'],
  // devops: plataforma
  ['devops', '.claude/hooks/restringir-escrita.mjs', 'permitir'],
  ['devops', '.claude/settings.json', 'permitir'],
  ['devops', '.github/workflows/ci.yml', 'permitir'],
  ['devops', 'scripts/validar_estrutura.py', 'permitir'],
  ['devops', 'docs/02-arquitetura/specs/x.md', 'permitir'],
  ['devops', 'AGENTS.md', 'permitir'],
  ['devops', 'package.json', 'permitir'],
  ['devops', '.gitignore', 'permitir'],
  ['devops', 'eslint.config.mjs', 'permitir'],
  ['devops', 'apps/web/src/App.tsx', 'negar'],
  ['devops', 'packages/shared/src/index.ts', 'negar'],
  ['devops', 'e2e/home.spec.ts', 'negar'],
  ['devops', 'docs/03-tarefas/T-001.md', 'negar'],
  ['devops', 'docs/04-estudos/hooks.md', 'negar'],
  ['devops', 'docs/02-arquitetura/ADR-0003-x.md', 'negar'],
  ['devops', 'package-lock.json', 'negar'],
  // critério 30: definição dos agentes pede a confirmação do George ao devops
  ['devops', '.claude/agents/devops.md', 'perguntar'],
  // code-reviewer: somente leitura
  ['code-reviewer', 'apps/web/src/App.tsx', 'negar'],
  ['code-reviewer', 'docs/04-estudos/x.md', 'negar'],
  // agente fora da tabela (ex.: Explore) não tem área
  ['Explore', 'apps/web/src/App.tsx', 'negar'],
  ['general-purpose', 'docs/03-tarefas/T-001.md', 'negar'],
]);

describe('Edit/Write: detalhes', () => {
  test('Edit, MultiEdit e NotebookEdit seguem a mesma regra do Write', () => {
    assert.equal(escrever('qa', 'apps/web/src/App.tsx', 'Edit'), 'negar');
    assert.equal(escrever('qa', 'e2e/a.spec.ts', 'MultiEdit'), 'permitir');
    const nb = entrada('dev', 'NotebookEdit', { notebook_path: path.join(raiz, 'docs/03-tarefas/x.ipynb') });
    assert.equal(decidir(nb), 'negar');
  });
  test('fora do repositório (ex.: pasta temporária) não é governado pela tabela', () => {
    const e = entrada('dev', 'Write', { file_path: path.join(os.tmpdir(), 'rascunho-t001.txt') });
    assert.equal(decidir(e), 'permitir');
  });
  test('caminho com ".." que volta para uma pasta protegida é bloqueado', () => {
    const e = entrada('dev', 'Write', { file_path: path.join(raiz, 'apps', '..', 'docs', '03-tarefas', 'x.md') });
    assert.equal(decidir(e), 'negar');
  });
  test('mensagem explica o motivo', () => {
    const r = avaliar(entrada('qa', 'Write', { file_path: path.join(raiz, 'apps/web/src/App.tsx') }), { raiz });
    assert.match(r.motivo, /fora da área do qa/);
  });
  test('Windows: barras invertidas, letra do disco e maiúsculas diferentes', { skip: !WINDOWS }, () => {
    const comBarras = path.join(raiz, 'DOCS', '03-Tarefas', 'x.md').replace(/\//g, '\\');
    const minusculo = comBarras[0].toLowerCase() + comBarras.slice(1);
    assert.equal(decidir(entrada('dev', 'Write', { file_path: minusculo })), 'negar');
  });
});

casosDeBash('Bash: dev (critério 28)', [
  ['dev', 'npm test', 'permitir'],
  ['dev', 'npm run build --workspace apps/web', 'permitir'],
  ['dev', 'echo "export {}" > apps/web/src/a.ts', 'permitir'],
  ['dev', 'npm test > /dev/null 2>&1', 'permitir'],
  ['dev', 'rm -rf apps/web/dist', 'permitir'],
  ['dev', 'cd apps/web && rm -rf dist', 'permitir'],
  ['dev', 'mv apps/web/src/a.ts apps/web/src/b.ts', 'permitir'],
  ['dev', 'git checkout -- apps/web/src/App.tsx', 'permitir'],
  ['dev', 'git status && git diff', 'permitir'],
  ['dev', 'find apps/web -name "*.tmp" -delete', 'permitir'],
  ['dev', 'cat <<EOF > apps/web/src/a.txt\nrm -rf docs\nEOF', 'permitir'],
  ['dev', 'echo oi > docs/03-tarefas/T-001.md', 'negar'],
  ['dev', 'echo oi >> docs/03-tarefas/backlog.md', 'negar'],
  ['dev', 'cat x | tee docs/03-tarefas/a.md', 'negar'],
  ['dev', "sed -i 's/a/b/' docs/03-tarefas/T-001.md", 'negar'],
  ['dev', 'sed -i.bak -e s/a/b/ e2e/home.spec.ts', 'negar'],
  ['dev', 'cp apps/web/src/a.ts docs/03-tarefas/', 'negar'],
  ['dev', 'mv docs/03-tarefas/T-001.md apps/web/', 'negar'],
  ['dev', 'rm docs/03-tarefas/T-001.md', 'negar'],
  ['dev', 'rm -rf apps/api', 'negar'],
  ['dev', 'rm -r apps/api/*', 'negar'],
  ['dev', 'cd docs && rm 03-tarefas/T-001.md', 'negar'],
  ['dev', '(cd apps/web && rm -rf dist) && touch x.txt', 'negar'],
  ['dev', 'git checkout main', 'negar'],
  ['dev', 'git checkout -- docs/03-tarefas/T-001.md', 'negar'],
  ['dev', 'git restore docs/03-tarefas/T-001.md', 'negar'],
  ['dev', 'git reset --hard HEAD', 'negar'],
  ['dev', 'git commit -m "x"', 'negar'],
  ['dev', 'git push origin main', 'negar'],
  ['dev', 'git stash', 'negar'],
  ['dev', 'echo $(rm docs/03-tarefas/x.md)', 'negar'],
  ['dev', 'bash -c "rm docs/03-tarefas/x.md"', 'negar'],
  ['dev', 'rm $ALVO', 'negar'],
  ['dev', 'find . -name x -delete', 'negar'],
  ['dev', 'ls docs | xargs rm', 'negar'],
  ['dev', 'node -e "require(\'fs\').writeFileSync(\'docs/03-tarefas/x.md\', \'\')"', 'negar'],
  ['dev', 'cat <<EOF > docs/03-tarefas/x.md\noi\nEOF', 'negar'],
  ['dev', 'echo "sem fechar', 'negar'],
]);

casosDeBash('Bash: comandos comuns que não podem virar falso positivo', [
  ['dev', 'npm test 2>&1 | tee /tmp/saida-testes.txt', 'permitir'],
  ['dev', 'git log --oneline -5', 'permitir'],
  ['dev', 'git add apps/web/src/App.tsx', 'permitir'],
  ['dev', 'mkdir -p apps/web/src/components', 'permitir'],
  ['dev', 'for f in apps/web/src/*.ts; do echo $f; done', 'permitir'],
  ['dev', 'if [ -f x ]; then rm apps/web/dist/x.js; fi', 'permitir'],
  ['dev', "echo 'a > docs/03-tarefas/b'", 'permitir'],
  ['dev', 'grep -c x docs/03-tarefas/T-001.md 2>/dev/null || true', 'permitir'],
  ['dev', 'cat docs/03-tarefas/T-001.md', 'permitir'],
  ['dev', 'git add -A', 'negar'],
  ['dev', 'cd "$(git rev-parse --show-toplevel)" && rm x', 'negar'],
  ['qa', 'npx playwright install --with-deps chromium', 'permitir'],
]);

casosDeBash('Bash: qa, instrutor e documentador', [
  ['qa', 'npm run test:e2e', 'permitir'],
  ['qa', 'npx playwright test --project=desktop', 'permitir'],
  ['qa', 'echo x > e2e/notas.txt', 'permitir'],
  ['qa', 'echo x > apps/web/src/a.ts', 'negar'],
  ['qa', 'git checkout -- apps/web/src/App.tsx', 'negar'],
  ['instrutor', 'echo x > docs/04-estudos/hooks.md', 'permitir'],
  ['instrutor', 'touch apps/web/x.ts', 'negar'],
  ['documentador', 'touch .claude/worktrees/agent-abc/docs/04-estudos/tarefas/T-001.md', 'permitir'],
  ['documentador', 'touch .claude/worktrees/agent-abc/docs/03-tarefas/T-001.md', 'negar'],
]);

casosDeBash('Bash: devops (critérios 26 e 30)', [
  ['devops', 'echo x > .github/workflows/novo.yml', 'permitir'],
  ['devops', 'node --test .claude/hooks/tests/', 'permitir'],
  ['devops', 'python scripts/validar_estrutura.py', 'permitir'],
  ['devops', 'rm apps/web/src/App.tsx', 'negar'],
  ['devops', 'echo x > docs/04-estudos/a.md', 'negar'],
  ['devops', 'rm -r .claude', 'negar'],
  ['devops', "sed -i 's/a/b/' .claude/agents/dev.md", 'perguntar'],
]);

casosDeBash('Bash: code-reviewer somente leitura (critério 27)', [
  ['code-reviewer', 'git diff main...HEAD', 'permitir'],
  ['code-reviewer', 'git log main..HEAD --oneline', 'permitir'],
  ['code-reviewer', 'git show HEAD --stat', 'permitir'],
  ['code-reviewer', 'git status', 'permitir'],
  ['code-reviewer', 'npm test', 'permitir'],
  ['code-reviewer', 'npm run lint', 'permitir'],
  ['code-reviewer', 'npm run test:e2e', 'permitir'],
  ['code-reviewer', 'npm run build', 'permitir'],
  ['code-reviewer', 'npx vitest run', 'permitir'],
  ['code-reviewer', 'PYTHONUTF8=1 python scripts/validar_estrutura.py', 'permitir'],
  ['code-reviewer', 'git diff --stat | tail -5 && grep -rn TODO apps 2>/dev/null', 'permitir'],
  ['code-reviewer', 'bash -c "git status"', 'permitir'],
  ['code-reviewer', 'git diff > revisao.patch', 'negar'],
  ['code-reviewer', 'git diff --output=revisao.patch', 'negar'],
  ['code-reviewer', 'git checkout -- apps/web/src/App.tsx', 'negar'],
  ['code-reviewer', 'git commit -m x', 'negar'],
  ['code-reviewer', 'npm install', 'negar'],
  ['code-reviewer', 'npx eslint --fix .', 'negar'],
  ['code-reviewer', 'rm apps/web/src/App.tsx', 'negar'],
  ['code-reviewer', 'node -e "1"', 'negar'],
  ['code-reviewer', "sed -i 's/a/b/' apps/web/src/App.tsx", 'negar'],
  ['code-reviewer', 'find . -name x -delete', 'negar'],
]);

casosDeBash('Bash: agente fora da tabela', [
  ['Explore', 'ls -la && cat AGENTS.md', 'permitir'],
  ['Explore', 'rm apps/web/src/App.tsx', 'negar'],
]);

describe('PowerShell (reforço)', () => {
  test('sessão principal nunca é bloqueada', () => {
    assert.equal(powershell(undefined, 'Remove-Item -Recurse docs'), 'permitir');
  });
  test('subagente pode ler, mas não escrever pelo PowerShell', () => {
    assert.equal(powershell('dev', 'Get-Content AGENTS.md | Select-String hooks'), 'permitir');
    assert.equal(powershell('dev', 'git status'), 'permitir');
    assert.equal(powershell('dev', "Set-Content -Path docs/03-tarefas/x.md -Value 'x'"), 'negar');
    assert.equal(powershell('dev', "'x' > docs/03-tarefas/x.md"), 'negar');
    assert.equal(powershell('dev', 'git commit -m x'), 'negar');
  });
  test('code-reviewer não usa o PowerShell', () => {
    assert.equal(powershell('code-reviewer', 'Get-ChildItem'), 'negar');
  });
});
