// Ponto de entrada da API: carrega o .env, cria a aplicação e começa a escutar a porta.
import { carregarVariaveisDeAmbiente } from './config/carregar-variaveis-de-ambiente.js';
import { criarApp } from './criar-app.js';

// O .env é procurado no diretório atual: com `npm run dev`/`npm start`, é a pasta apps/api.
// Os módulos devem ler process.env dentro das classes (não no topo do arquivo),
// porque os imports acima rodam antes desta linha.
carregarVariaveisDeAmbiente();

const app = await criarApp();
await app.listen(process.env.PORT ?? 3000);
