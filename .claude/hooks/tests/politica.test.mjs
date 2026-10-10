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
import { avaliar, expandirChaves } from '../politica.mjs';

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

casosDeBash('Bash: code-reviewer — escrita disfarçada (D4, opcional 3)', [
  ['code-reviewer', 'npm run lint -- --fix', 'negar'],
  ['code-reviewer', 'npx vitest run -u', 'negar'],
  ['code-reviewer', 'npm test -- --update', 'negar'],
  ['code-reviewer', 'npx playwright test --update-snapshots', 'negar'],
  ['code-reviewer', 'node --test --import ./x.mjs .claude/hooks/tests/', 'negar'],
  ['code-reviewer', 'node --test --require=./x.cjs', 'negar'],
  ['code-reviewer', 'node --test -e "1"', 'negar'],
  ['code-reviewer', 'git -c diff.external=x diff', 'negar'],
  ['code-reviewer', 'git -c core.pager=x log', 'negar'],
  ['code-reviewer', 'git grep -Ovim x', 'negar'],
  ['code-reviewer', 'GIT_EXTERNAL_DIFF=x git diff', 'negar'],
  ['code-reviewer', 'env NODE_OPTIONS=--require=./x npm test', 'negar'],
  ['code-reviewer', 'node --test .claude/hooks/tests/', 'permitir'],
  ['code-reviewer', 'GIT_PAGER=cat git log --oneline', 'permitir'],
  ['code-reviewer', 'git diff -u main', 'permitir'],
  ['dev', 'git -c user.name=x log', 'negar'],
]);

casosDeBash('Bash: code-reviewer — leituras legítimas (D4, opcional 4)', [
  ['code-reviewer', 'for f in apps/web/src/*.ts; do grep -c x $f; done', 'permitir'],
  ['code-reviewer', 'for ((i = 0; i < 3; i++)); do echo $i; done', 'permitir'],
  ['code-reviewer', 'case "$x" in a|b) echo um;; (c) echo dois;; esac', 'permitir'],
  ['code-reviewer', 'select x in a b; do echo $x; done', 'permitir'],
  ['code-reviewer', 'if [[ -f x ]]; then cat x; fi', 'permitir'],
  ['code-reviewer', 'git diff --name-only | while read f; do wc -l "$f"; done', 'permitir'],
  ['code-reviewer', "awk '{print $1}' apps/web/package.json", 'permitir'],
  ['code-reviewer', "awk -F: '$3 == 1 || $4 == 2 {print $1}' arquivo", 'permitir'],
  ['code-reviewer', 'python -X utf8 scripts/validar_estrutura.py', 'permitir'],
  ['code-reviewer', 'for f in a; do rm $f; done', 'negar'],
  ['code-reviewer', "awk -i inplace '{print}' x", 'negar'],
  ['code-reviewer', "awk 'BEGIN{system(\"rm x\")}'", 'negar'],
  ['code-reviewer', "awk '{print > \"x\"}' y", 'negar'],
  ['code-reviewer', "awk '{print | \"sh\"}' y", 'negar'],
  ['code-reviewer', 'awk -f programa.awk y', 'negar'],
  ['code-reviewer', 'python -c "import os" scripts/validar_estrutura.py', 'negar'],
  ['code-reviewer', 'python -m http.server scripts/validar_estrutura.py', 'negar'],
]);

casosDeBash('Bash: curingas, chaves e $\'...\' (revisão da rodada 1)', [
  ['dev', 'rm apps/web/*/../../../docs/03-tarefas/x', 'negar'],
  ['devops', 'touch docs/{02-arquitetura,03-tarefas}/x.md', 'negar'],
  ['dev', 'touch apps/{web/a,../docs/03-tarefas/b}', 'negar'],
  ['dev', "touch apps/$'\\x2e\\x2e'/docs/03-tarefas/x", 'negar'],
  ['dev', 'touch apps/$"web"/x', 'negar'],
  ['dev', 'mkdir -p apps/web/src/{components,hooks}', 'permitir'],
  ['dev', 'touch apps/web/src/{App,main}.tsx', 'permitir'],
  ['dev', 'touch apps/web/src/f{1..3}.ts', 'permitir'],
  ['dev', 'touch apps/web/.?/x', 'negar'],
  ['dev', 'touch apps/{,}.{.,}/docs/03-tarefas/x', 'negar'],
  ['dev', 'touch "apps/web/"{a,b}', 'negar'],
  ['dev', 'mv apps/web/src/a.ts apps/{web,../docs/03-tarefas}/', 'negar'],
  ['dev', 'sed -i {s/a/b/,docs/03-tarefas/x}', 'negar'],
  ['dev', 'cd apps/api/te* && rm -rf x', 'negar'],
  ['dev', 'echo {} a{b}c', 'permitir'],
]);

describe('expansão de chaves', () => {
  test('listas, sequências e aninhamento', () => {
    assert.deepEqual(expandirChaves('a/{b,c}/d'), ['a/b/d', 'a/c/d']);
    assert.deepEqual(expandirChaves('f{1..3}'), ['f1', 'f2', 'f3']);
    assert.deepEqual(expandirChaves('{a,b{x,y}}'), ['a', 'bx', 'by']);
    assert.deepEqual(expandirChaves('{x}'), ['{x}']);
  });
  test('expansão grande demais devolve null', () => {
    assert.equal(expandirChaves('{1..9999}'), null);
  });
});

casosDeBash('Bash: comandos que escrevem por opção (curl, wget, rsync, tar, unzip, awk)', [
  ['dev', 'curl -sSL https://exemplo.dev/a.json -o apps/web/src/a.json', 'permitir'],
  ['dev', 'curl -s https://exemplo.dev', 'permitir'],
  ['dev', 'curl -sSLo docs/03-tarefas/x https://exemplo.dev', 'negar'],
  ['dev', 'curl --output=docs/03-tarefas/x https://exemplo.dev', 'negar'],
  ['dev', 'curl -O https://exemplo.dev/a.json', 'negar'],
  ['dev', 'cd apps/web && curl -O https://exemplo.dev/a.json', 'permitir'],
  ['dev', 'curl --output-dir apps/web -o ../../docs/03-tarefas/x https://exemplo.dev', 'negar'],
  ['dev', 'wget -P apps/web/dist https://exemplo.dev/a.zip', 'permitir'],
  ['dev', 'wget -qO- https://exemplo.dev', 'permitir'],
  ['dev', 'wget https://exemplo.dev/a.zip', 'negar'],
  ['dev', 'wget -O docs/03-tarefas/x https://exemplo.dev', 'negar'],
  ['dev', 'wget -e robots=off https://exemplo.dev', 'negar'],
  ['dev', 'rsync -a apps/web/src/ apps/web/dist/', 'permitir'],
  ['dev', 'rsync -a apps/web/dist/ usuario@servidor:/srv/www', 'permitir'],
  ['dev', 'rsync -a --delete apps/web/dist/ docs/', 'negar'],
  ['dev', 'ls | xargs rsync -a apps/web/dist/', 'negar'],
  ['dev', 'tar -xzf a.tar.gz -C apps/web/dist', 'permitir'],
  ['dev', 'tar -czf apps/web/dist/a.tgz apps/web/dist', 'permitir'],
  ['dev', 'tar -tzf a.tgz', 'permitir'],
  ['dev', 'tar -xzf a.tar.gz', 'negar'],
  ['dev', 'tar xzf a.tar.gz -C docs', 'negar'],
  ['dev', 'tar cf docs/03-tarefas/a.tar apps', 'negar'],
  ['dev', 'tar -xf a.tar -C apps/web -C ../../docs', 'negar'],
  ['dev', 'unzip a.zip -d apps/web/dist', 'permitir'],
  ['dev', 'unzip -l a.zip', 'permitir'],
  ['dev', 'unzip a.zip', 'negar'],
  ['dev', 'unzip -o a.zip -d docs/03-tarefas', 'negar'],
  ['dev', "gawk -i inplace -v x=1 '{print}' apps/web/src/a.ts", 'permitir'],
  ['dev', "awk '{print $1}' docs/03-tarefas/T-001.md", 'permitir'],
  ['dev', "awk -i inplace '{print}' docs/03-tarefas/T-001.md", 'negar'],
  ['dev', "awk 'BEGIN{print 1 > \"docs/03-tarefas/x\"}'", 'negar'],
  ['dev', 'find apps -name "*.zip" -exec unzip -d docs {} \\;', 'negar'],
  ['dev', 'find apps -name x -exec sh -c \'rm "$1"\' _ {} \\;', 'negar'],
  ['dev', 'find apps -name "*.ts" -exec grep -l x {} +', 'permitir'],
]);

casosDeBash('Bash: comandos-embrulho e suas opções (revisão da rodada 2)', [
  // Casos pedidos na revisão.
  ['dev', 'env -u X rm -f docs/03-tarefas/T-001.md', 'negar'],
  ['dev', 'env -C docs/03-tarefas rm T-001.md', 'negar'],
  ['dev', "env -S 'rm -f docs/03-tarefas/x'", 'negar'],
  ['dev', 'env -Srm docs/03-tarefas/x', 'negar'],
  ['dev', 'timeout -s KILL 5 rm docs/03-tarefas/x', 'negar'],
  ['dev', 'exec -a nome rm docs/03-tarefas/x', 'negar'],
  ['dev', 'time -p rm -f .claude/agents/dev.md', 'negar'],
  ['devops', 'time -p rm -f .claude/agents/dev.md', 'perguntar'],
  ['dev', 'env -i FOO=1 npm test', 'permitir'],
  ['dev', 'timeout 60 npm test', 'permitir'],
  // env: formas longas, pasta trocada e opção desconhecida.
  ['dev', 'env --unset=X rm docs/03-tarefas/x', 'negar'],
  ['dev', 'env --chdir=docs rm 03-tarefas/x', 'negar'],
  ['dev', 'env -C apps/web rm -f dist/x.js', 'permitir'],
  ['dev', 'env -C apps/web rm ../api/test/x.ts', 'negar'],
  ['dev', 'env -C $PASTA rm x', 'negar'],
  ['dev', 'env -X rm docs/03-tarefas/x', 'negar'],
  ['dev', "env --split-string='rm x'", 'negar'],
  ['dev', 'env - FOO=1 bash -c "rm docs/03-tarefas/x"', 'negar'],
  // timeout, stdbuf, nice, nohup, command, builtin, sudo.
  ['dev', 'timeout -k 5 10 rm docs/03-tarefas/x', 'negar'],
  ['dev', 'timeout --signal=KILL 5 rm docs/03-tarefas/x', 'negar'],
  ['dev', 'timeout -vs KILL 5 rm docs/03-tarefas/x', 'negar'],
  ['dev', 'stdbuf -o L rm docs/03-tarefas/x', 'negar'],
  ['dev', 'stdbuf -oL rm docs/03-tarefas/x', 'negar'],
  ['dev', 'stdbuf -oL npm test', 'permitir'],
  ['dev', 'nice -n 5 rm docs/03-tarefas/x', 'negar'],
  ['dev', 'nice --adjustment 5 rm docs/03-tarefas/x', 'negar'],
  ['dev', 'nice -10 rm docs/03-tarefas/x', 'negar'],
  ['dev', 'nohup rm docs/03-tarefas/x', 'negar'],
  ['dev', 'nohup --x rm docs/03-tarefas/x', 'negar'],
  ['dev', 'command rm docs/03-tarefas/x', 'negar'],
  ['dev', 'command -v wget', 'permitir'],
  ['dev', 'builtin -x rm docs/03-tarefas/x', 'negar'],
  ['dev', 'sudo -u root rm docs/03-tarefas/x', 'negar'],
  ['dev', 'sudo -e docs/03-tarefas/x', 'negar'],
  // time: `-o` grava arquivo; `time { ...; }` ainda é analisado.
  ['dev', 'time -o docs/03-tarefas/x npm test', 'negar'],
  ['dev', 'time -o apps/web/dist/tempo.txt npm test', 'permitir'],
  ['dev', 'time { rm docs/03-tarefas/x; }', 'negar'],
  // xargs: opções conhecidas e embrulhos dentro dele.
  ['dev', 'ls | xargs -0n 1 rm docs/03-tarefas/x', 'negar'],
  ['dev', 'ls docs/03-tarefas | xargs env rm', 'negar'],
  ['dev', 'ls | xargs nice -n 1 rm', 'negar'],
  ['dev', 'ls | xargs --x rm', 'negar'],
  ['dev', 'ls | xargs -I{} echo {}', 'permitir'],
  // Embrulhos não analisados.
  ['dev', 'setsid rm docs/03-tarefas/x', 'negar'],
  ['dev', 'watch ls', 'negar'],
  // code-reviewer: embrulhos de leitura passam; opções que gravam ou escondem, não.
  ['code-reviewer', 'time npm test', 'permitir'],
  ['code-reviewer', 'time -p git status', 'permitir'],
  ['code-reviewer', 'timeout 60 npm test', 'permitir'],
  ['code-reviewer', "env -S 'git diff'", 'negar'],
  ['code-reviewer', 'time -o x.txt git status', 'negar'],
]);

casosDeBash('Bash: opcionais da D5', [
  // (1) IFS e atribuição solta no code-reviewer.
  ['code-reviewer', 'git diff --name-only | while IFS= read -r l; do wc -l "$l"; done', 'permitir'],
  ['code-reviewer', 'n=0; for f in a b; do echo $f; done', 'permitir'],
  ['code-reviewer', 'PATH=/tmp/x; git status', 'negar'],
  ['code-reviewer', 'n=0 git status', 'negar'],
  // (2) tar --remove-files apaga as origens.
  ['dev', 'tar -czf apps/web/dist/a.tgz docs/03-tarefas --remove-files', 'negar'],
  ['dev', 'tar czf apps/web/dist/a.tgz docs --remove-files', 'negar'],
  ['dev', 'tar -cf apps/web/dist/a.tar -C docs 03-tarefas --remove-files', 'negar'],
  ['dev', 'tar --remove-files -cf apps/web/dist/a.tar apps/web/src', 'permitir'],
  // (3) arquivos de configuração do curl/wget e inclusões do gawk.
  ['dev', 'curl -K apps/web/x.cfg https://exemplo.dev', 'negar'],
  ['dev', 'curl --config=apps/web/x.cfg https://exemplo.dev', 'negar'],
  ['dev', 'wget --config apps/web/x.rc -P apps/web/dist https://exemplo.dev', 'negar'],
  ['dev', "gawk '@include \"inplace\"; {print}' docs/03-tarefas/T-001.md", 'negar'],
  ['dev', "gawk '@load \"inplace\"; {print}' apps/web/src/a.ts", 'negar'],
  ['dev', "gawk -l inplace '{print}' apps/web/src/a.ts", 'negar'],
  ['dev', 'gawk -f apps/web/x.awk docs/03-tarefas/T-001.md', 'negar'],
  ['dev', "gawk -i apps/web/x.awk '{print}' docs/03-tarefas/T-001.md", 'negar'],
  ['dev', 'awk -f apps/web/x.awk apps/web/src/a.ts', 'permitir'],
  // (4) variáveis que trocam o repositório do git (e a configuração de curl/wget).
  ['dev', 'GIT_DIR=/tmp/x git add apps/web/src/a.ts', 'negar'],
  ['dev', 'GIT_WORK_TREE=docs git add 03-tarefas/x', 'negar'],
  ['dev', 'GIT_INDEX_FILE=/tmp/i git add apps/web/src/a.ts', 'negar'],
  ['dev', 'env GIT_WORK_TREE=docs git checkout -- x', 'negar'],
  ['dev', 'export GIT_DIR=/tmp/x && git status', 'negar'],
  ['dev', 'HOME=apps/web curl https://exemplo.dev', 'negar'],
  ['dev', 'CI=1 npm test', 'permitir'],
]);

casosDeBash('Bash: rodada 3 — timeout dinâmico (D6, bloqueante 1)', [
  ['dev', 'timeout $(echo --foreground) 5 rm -f docs/03-tarefas/x', 'negar'],
  ['dev', 'timeout `echo 5` rm -f docs/03-tarefas/x', 'negar'],
  ['dev', 'timeout 60 npm test', 'permitir'],
  ['dev', 'timeout 60 git log', 'permitir'],
]);

casosDeBash('Bash: rodada 3 — sed e/w/W e -f (D6, bloqueante 2)', [
  // Negados para quem escreve e para o code-reviewer, com ou sem endereço.
  ['dev', "sed -n '1w /dev/null' apps/web/src/a.ts", 'negar'],
  ['code-reviewer', "sed -n '1w /dev/null'", 'negar'],
  ['dev', "sed 's/a/b/w .claude/agents/dev.md' apps/web/src/a.ts", 'negar'],
  ['code-reviewer', "sed 's/a/b/w .claude/agents/dev.md' f", 'negar'],
  ['dev', "sed '1e rm -f docs/03-tarefas/x' apps/web/src/a.ts", 'negar'],
  ['code-reviewer', "sed '1e rm -f docs/03-tarefas/x' f", 'negar'],
  ['code-reviewer', "echo x | sed 's/.*/echo executado-pelo-sed/e'", 'negar'],
  ['dev', "echo x | sed 's/.*/echo executado-pelo-sed/e'", 'negar'],
  ['dev', "sed '/foo/w saida.txt' apps/web/src/a.ts", 'negar'],
  ['dev', "sed '\\#re#W x' apps/web/src/a.ts", 'negar'],
  ['dev', 'sed -f programa.sed apps/web/src/a.ts', 'negar'],
  ['code-reviewer', 'sed --file=programa.sed f', 'negar'],
  ['dev', "sed -e '1,3d' -e '5w outro.txt' apps/web/src/a.ts", 'negar'],
  // Permitidos: scripts de leitura/substituição comuns.
  ['code-reviewer', "sed -n '1,20p' apps/web/src/a.ts", 'permitir'],
  ['code-reviewer', "sed 's/foo/the bar/' apps/web/src/a.ts", 'permitir'],
  ['code-reviewer', "sed -n '/erro/p' apps/web/src/a.ts", 'permitir'],
  ['dev', "sed -i 's/foo/the bar/' apps/web/src/a.ts", 'permitir'],
  ['dev', "sed -i '1,5d' apps/web/src/a.ts", 'permitir'],
  ['dev', "sed 's/a/b/' docs/03-tarefas/T-001.md", 'permitir'],
]);

casosDeBash('Bash: rodada 3 — executores do Windows/Git Bash (D6, bloqueante 3)', [
  ['dev', 'powershell Remove-Item docs/03-tarefas/x', 'negar'],
  ['dev', 'powershell -c Set-Content AGENTS.md x', 'negar'],
  ['dev', 'pwsh -Command Remove-Item apps/web/src/a.ts', 'negar'],
  ['dev', 'powershell -EncodedCommand ZQBjAGgAbwA=', 'negar'],
  ['dev', 'cmd //c del docs\\\\03-tarefas\\\\x', 'negar'],
  ['dev', 'winpty -Xallow-non-tty rm docs/03-tarefas/x', 'negar'],
  ['dev', 'start rm docs/03-tarefas/x', 'negar'],
  ['dev', 'wsl rm docs/03-tarefas/x', 'negar'],
  ['code-reviewer', 'cmd //c dir', 'negar'],
  ['dev', 'powershell Get-ChildItem', 'permitir'],
  ['dev', 'powershell -NoProfile Get-Content AGENTS.md', 'permitir'],
]);

casosDeBash('Bash: rodada 3 — git executa programas, para todos (D6, bloqueante 4)', [
  ['dev', "GIT_EXTERNAL_DIFF='rm -f docs/03-tarefas/x' git diff", 'negar'],
  ['dev', "git -c diff.external='rm -f docs/03-tarefas/x' diff", 'negar'],
  ['dev', 'git --exec-path=/tmp status', 'negar'],
  ['dev', 'git --config-env=x=Y status', 'negar'],
  ['dev', 'git grep -O x TODO', 'negar'],
  ['dev', 'GIT_SSH=/tmp/x git fetch', 'negar'],
  ['dev', 'PAGER=less git log', 'negar'],
  ['dev', 'export GIT_EXTERNAL_DIFF=x && git diff', 'negar'],
  ['dev', 'GIT_PAGER=cat git log -1', 'permitir'],
  ['dev', 'git add apps/web/src/a.ts', 'permitir'],
  ['dev', 'PAGER=cat git log', 'permitir'],
]);

casosDeBash('Bash: rodada 3 — rede de segurança para quem escreve (D6, opcional 5)', [
  ['dev', 'npx rimraf docs/03-tarefas/x', 'negar'],
  ['dev', 'sort -o docs/03-tarefas/x f', 'negar'],
  ['dev', 'uniq f docs/03-tarefas/x', 'negar'],
  ['devops', 'npx rimraf .claude/agents/dev.md', 'negar'],
  ['dev', 'zip -r .git/x apps', 'negar'],
  ['dev', 'grep -n T-001 docs/03-tarefas/backlog.md', 'permitir'],
  ['dev', 'cat docs/03-tarefas/T-001-hooks-restricao-escrita.md', 'permitir'],
  ['dev', 'head -5 docs/03-tarefas/backlog.md', 'permitir'],
  ['dev', 'wc -l docs/03-tarefas/T-001.md', 'permitir'],
  ['dev', 'zip -r apps/web/dist/x.zip apps/web/dist', 'permitir'],
]);

casosDeBash('Bash: rodada 3 — HOME restrito a curl/wget/git (D6, opcional 6)', [
  ['dev', 'HOME=apps/web curl https://exemplo.dev', 'negar'],
  ['dev', 'XDG_CONFIG_HOME=/tmp git status', 'negar'],
  ['dev', 'WGETRC=/tmp/x wget https://exemplo.dev -P apps/web/dist', 'negar'],
  ['dev', 'HOME=/tmp npm test', 'permitir'],
  ['dev', 'HOME=/tmp node --version', 'permitir'],
  ['dev', 'XDG_CONFIG_HOME=/tmp npm run build', 'permitir'],
]);

casosDeBash('Bash: rodada 3 — varredura adversarial (escrita por opção e editores)', [
  // sort/shuf -o gravam num arquivo: conferidos contra a área (mesma família de sort -o).
  ['dev', 'sort -o apps/api/test/x.ts entrada.txt', 'negar'],
  ['dev', 'shuf -o apps/api/test/x.ts entrada.txt', 'negar'],
  ['dev', 'sort -o docs/03-tarefas/x f', 'negar'],
  ['dev', 'sort -o apps/web/dist/ordenado.txt f', 'permitir'],
  ['dev', 'sort apps/web/src/a.ts', 'permitir'],
  // Editores de linha e modo ex/script gravam por comando: negados para quem escreve.
  ['dev', "ex -sc '%d|x' apps/api/test/x.ts", 'negar'],
  ['dev', 'ed apps/api/test/x.ts', 'negar'],
  ['dev', 'vim -c wq apps/api/test/x.ts', 'negar'],
  ['dev', 'vim +wq apps/api/test/x.ts', 'negar'],
  ['dev', 'vim apps/web/src/a.ts', 'permitir'],
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
