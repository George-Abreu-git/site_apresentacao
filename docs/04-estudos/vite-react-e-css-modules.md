---
tipo: estudo
tarefa: T-005
tags: [front-end]
data: 2026-10-10
---

# Vite, React e CSS Modules

## Conceito

- **React** monta a tela a partir de **componentes**: funções que devolvem algo parecido com HTML (JSX). `App` é o primeiro componente do site.
- **Vite** é a ferramenta que leva esse código ao navegador. Ele tem dois modos:
  - `npm run dev` (`vite`): um **servidor de desenvolvimento** em `http://localhost:5173`. Ele transforma TypeScript/JSX na hora em que o navegador pede cada arquivo e recarrega a página quando você salva.
  - `npm run build` (`tsc -b && vite build`): primeiro o `tsc` **só confere os tipos** (não gera nada, `noEmit`); depois o Vite junta e minifica tudo em `apps/web/dist/`, que é o que vai para o Cloudflare Pages.
- **CSS Modules** são arquivos `*.module.css`. Ao importar um deles, você recebe um objeto com os nomes das classes, e o Vite troca cada nome por um **nome único** (ex.: `.titulo` vira algo como `_titulo_x1y2z`). Resultado: uma classe `.titulo` num componente nunca colide com outra `.titulo` em outro componente.

### Como o front sobe

```
apps/web/index.html             <html lang="pt-BR"> ... <div id="root"> ... <script src="/src/main.tsx">
        ▼
apps/web/src/main.tsx           acha o #root e manda o React desenhar <App /> dentro dele
        ▼
apps/web/src/App.tsx            <main> + <h1>George Siqueira</h1> + "Site em construção."
apps/web/src/App.module.css     estilos só deste componente
apps/web/src/index.css          estilos globais mínimos (cor do texto e do fundo)
```

O `index.html` é a porta de entrada: é nele que ficam o `lang="pt-BR"` (para leitores de tela), o `<title>` e a `<meta name="viewport">`, sem a qual o celular "finge" ser uma tela larga e o layout responsivo não funciona.

## Por que importa

- O Vite deixa o ciclo "salvar → ver" quase instantâneo, o que ajuda muito quem está aprendendo.
- CSS Modules resolvem o maior problema do CSS em projetos que crescem: um estilo de um lugar estragar outro. Sem precisar de convenções de nome nem de biblioteca extra (escolha da ADR-0001).
- A página provisória já nasce com a estrutura semântica (`<main>`, um `<h1>`) que a acessibilidade (RNF) vai cobrar em todas as seções.

## Como aparece no projeto

- `apps/web/src/App.tsx` usa `estilos.pagina`, `estilos.titulo` e `estilos.aviso`.
- `apps/web/src/App.module.css` mostra duas técnicas responsivas sem *media query*: `min-height: 100dvh` (altura real da tela do celular, descontando a barra do navegador) e `font-size: clamp(2rem, 6vw, 3.5rem)` (o título cresce com a largura, entre um mínimo e um máximo).
- `apps/web/tsconfig.json`: `"types": ["vite/client"]` é o que faz o TypeScript aceitar `import estilos from './App.module.css'`.
- `apps/web/vite.config.ts`: plugin do React e o bloco `test` do Vitest (veja [[tipos-de-teste-unitario-rota-e2e]]).
- **Atualização (T-007):** os dois itens acima descrevem a página provisória da T-005. Na T-007 o `App.module.css` foi removido; o `<h1>`, o aviso e o `clamp()` foram para `apps/web/src/componentes/Inicio/Inicio.tsx` e `Inicio.module.css`, e cada componente ganhou sua pasta em `apps/web/src/componentes/` (`.tsx` + `.module.css` + teste). Veja [[docs/04-estudos/tarefas/T-007]].

## Exemplo

```tsx
// apps/web/src/App.tsx
import estilos from './App.module.css'; // objeto: { pagina: '_pagina_abc', titulo: '_titulo_def', ... }

function App() {
  return (
    <main className={estilos.pagina}>               {/* em JSX é className, não class */}
      <h1 className={estilos.titulo}>George Siqueira</h1>
      <p className={estilos.aviso}>Site em construção.</p>
    </main>
  );
}
```

```css
/* apps/web/src/App.module.css */
.titulo {
  margin: 0;
  font-size: clamp(2rem, 6vw, 3.5rem); /* mínimo, preferido (6% da largura), máximo */
}
```

## Para aprofundar

- **Exercício**: rode `npm run dev -w apps/web`, abra o DevTools (F12), inspecione o `<h1>` e veja o nome real da classe. Depois rode `npm run build -w apps/web` e procure a mesma classe em `apps/web/dist/assets/*.css`.
- **Exercício**: no DevTools, ative a visão de celular e arraste a largura da tela. Observe o título mudar de tamanho por causa do `clamp`. Em que largura ele para de crescer? (Dica: 3.5rem ÷ 6vw.)
- **Pergunta**: o que aconteceria com o layout no celular se a `<meta name="viewport">` fosse apagada do `index.html`?
- **Pesquisa**: o que o `<StrictMode>` do `main.tsx` faz em desenvolvimento e por que ele não afeta o build?

## Links

- Tarefa: [[docs/03-tarefas/T-005-monorepo-base]]
- ADR: [[docs/02-arquitetura/ADR-0001-stack]]
- Relacionadas: [[mapa-do-monorepo]], [[tipos-de-teste-unitario-rota-e2e]]
