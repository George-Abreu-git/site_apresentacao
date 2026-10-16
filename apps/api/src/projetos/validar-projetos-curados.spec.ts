import { describe, expect, it } from 'vitest';
import {
  ArquivoDeProjetosInvalidoError,
  validarProjetosCurados,
} from './validar-projetos-curados.js';

// Um projeto válido mínimo: só os campos obrigatórios.
const projetoMinimo = {
  titulo: 'Site de apresentação',
  descricao: 'Portfólio pessoal.',
  stacks: ['React', 'NestJS'],
};

/** Roda a validação esperando erro e devolve a mensagem, para os testes conferirem o texto. */
function mensagemDeErro(dados: unknown): string {
  try {
    validarProjetosCurados(dados);
  } catch (erro) {
    expect(erro).toBeInstanceOf(ArquivoDeProjetosInvalidoError);
    return (erro as Error).message;
  }
  throw new Error('era esperado um erro de validação, mas os dados foram aceitos');
}

describe('validarProjetosCurados', () => {
  it('aceita uma lista de projetos e devolve os projetos na mesma ordem', () => {
    const completo = {
      titulo: 'Outro projeto',
      descricao: 'Com todos os campos.',
      stacks: ['TypeScript'],
      repositorio: 'https://github.com/George-Abreu-git/site_apresentacao',
      demo: 'https://exemplo.com',
      imagem: '/imagens/projetos/outro.png',
    };

    expect(validarProjetosCurados([projetoMinimo, completo])).toEqual([projetoMinimo, completo]);
  });

  it('aceita uma lista vazia', () => {
    expect(validarProjetosCurados([])).toEqual([]);
  });

  it('recusa quando o conteúdo não é uma lista', () => {
    expect(mensagemDeErro({ projetos: [] })).toMatch(/deve ser uma lista \(array\) de projetos/);
  });

  it('recusa um item que não é um objeto', () => {
    expect(mensagemDeErro(['texto solto'])).toMatch(/projeto 1: deve ser um objeto/);
  });

  it.each(['titulo', 'descricao'])('recusa projeto sem o campo obrigatório "%s"', (campo) => {
    const semCampo: Record<string, unknown> = { ...projetoMinimo };
    delete semCampo[campo];

    expect(mensagemDeErro([semCampo])).toMatch(
      new RegExp(`projeto 1.*: campo "${campo}" é obrigatório e deve ser um texto não vazio`),
    );
  });

  it('recusa título só com espaços', () => {
    expect(mensagemDeErro([{ ...projetoMinimo, titulo: '   ' }])).toMatch(/campo "titulo"/);
  });

  it('recusa "stacks" que não é uma lista de textos', () => {
    expect(mensagemDeErro([{ ...projetoMinimo, stacks: 'React' }])).toMatch(
      /campo "stacks" é obrigatório e deve ser uma lista de textos não vazios/,
    );
    expect(mensagemDeErro([{ ...projetoMinimo, stacks: ['React', 42] }])).toMatch(/campo "stacks"/);
  });

  it.each(['repositorio', 'demo'])('recusa "%s" que não é um endereço http(s)', (campo) => {
    expect(mensagemDeErro([{ ...projetoMinimo, [campo]: 'github.com/sem-protocolo' }])).toMatch(
      new RegExp(`campo "${campo}", quando presente, deve ser um endereço http\\(s\\)`),
    );
  });

  it('recusa "imagem" que não é texto', () => {
    expect(mensagemDeErro([{ ...projetoMinimo, imagem: 123 }])).toMatch(
      /campo "imagem", quando presente, deve ser um texto não vazio/,
    );
  });

  it('recusa campo desconhecido (pega erros de digitação, ex.: "titlo")', () => {
    expect(mensagemDeErro([{ ...projetoMinimo, linguagem: 'TS' }])).toMatch(
      /campo "linguagem" não faz parte do formato/,
    );
  });

  it('recusa o campo "github": os dados vivos vêm da API do GitHub, não do arquivo', () => {
    const comGithub = { ...projetoMinimo, github: { disponivel: true, estrelas: 1000 } };
    expect(mensagemDeErro([comGithub])).toMatch(/campo "github" não faz parte do formato/);
  });

  it('identifica o projeto pelo título e junta todos os problemas numa só mensagem', () => {
    const mensagem = mensagemDeErro([
      projetoMinimo,
      { ...projetoMinimo, titulo: 'Projeto quebrado', stacks: null, demo: 'ftp://x' },
    ]);

    expect(mensagem).toMatch(/projeto 2 \("Projeto quebrado"\): campo "stacks"/);
    expect(mensagem).toMatch(/projeto 2 \("Projeto quebrado"\): campo "demo"/);
  });
});
