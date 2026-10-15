// Ponto único de acesso aos textos (RF-09): os componentes importam `conteudo` daqui,
// nunca de um idioma específico. Quando houver outro idioma (v2), só este arquivo
// decide qual objeto entregar; os componentes não mudam.
import { ptBR } from './pt-BR';

export type { Conteudo } from './tipos';

export const conteudo = ptBR;
