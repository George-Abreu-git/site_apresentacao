// O `test` usado por todos os arquivos de e2e: é o `test` do Playwright com um passo a mais
// antes de cada teste, que simula a API de projetos sem responder (ainda "acordando").
// Assim nenhum teste depende da API de verdade (que não sobe com os testes) e a página abre
// sempre do mesmo jeito:
// - sem erro de conexão no console do navegador;
// - sem a seção Projetos mudando de tamanho no meio do teste (ela fica no aviso de
//   carregamento). Uma resposta chegando durante uma rolagem mudaria a altura da página e
//   tiraria do lugar as seções abaixo de Projetos (Serviços e Contato);
// - e com o resto da página provando que não espera a API (RNF-03).
//
// Quem testa a seção Projetos (ou precisa dela carregada) registra a própria simulação dentro
// do teste (simularApi, em api.ts); como o Playwright usa a rota registrada por último, ela
// substitui esta.
//
// Uso: import { expect, test } from '../apoio/teste';
import { expect, test as testDoPlaywright } from '@playwright/test';
import { simularApiSemResposta } from './api';

export const test = testDoPlaywright.extend<{ apiDeProjetosSimulada: void }>({
  // `auto: true` faz o passo rodar em todo teste, mesmo que o teste não peça por ele.
  apiDeProjetosSimulada: [
    async ({ page }, usar) => {
      await simularApiSemResposta(page);
      await usar();
    },
    { auto: true },
  ],
});

export { expect };
