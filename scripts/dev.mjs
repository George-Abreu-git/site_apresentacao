// Sobe a API (apps/api) e o front (apps/web) ao mesmo tempo, para desenvolvimento.
//
// Por que um script e não `npm run dev --workspaces`? O npm roda os workspaces
// um de cada vez, e um servidor de desenvolvimento nunca termina: o segundo
// nunca subiria. Aqui abrimos um processo por workspace, em paralelo, usando
// só o Node (sem dependência extra).
//
// Ctrl+C no terminal encerra os dois, porque o sinal chega a todos os
// processos abertos a partir deste terminal.
import { spawn } from 'node:child_process';

const workspaces = ['apps/api', 'apps/web'];

for (const workspace of workspaces) {
  // `shell: true` é necessário no Windows, onde o npm é o arquivo `npm.cmd`.
  const processo = spawn(`npm run dev --workspace ${workspace}`, {
    stdio: 'inherit',
    shell: true,
  });

  // Se um dos servidores terminar com erro, o comando `npm run dev` também
  // termina com erro (o outro continua rodando até o Ctrl+C).
  processo.on('exit', (codigo) => {
    if (codigo) process.exitCode = codigo;
  });
}
