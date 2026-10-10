// Ponto de entrada do front: monta o React dentro da <div id="root"> do index.html.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// O tema vem antes: index.css e os componentes usam as variáveis definidas nele.
import './tema.css';
import './index.css';

const raiz = document.getElementById('root');
if (!raiz) {
  throw new Error('Elemento #root não encontrado no index.html');
}

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
