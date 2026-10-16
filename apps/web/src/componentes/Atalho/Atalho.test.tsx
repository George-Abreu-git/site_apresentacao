import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Atalho from './Atalho';

describe('Atalho (RF-02, RF-07)', () => {
  it('é um link (<a>) para a âncora recebida, com o texto recebido', () => {
    render(<Atalho href="#contato">Fale comigo</Atalho>);

    const atalho = screen.getByRole('link', { name: 'Fale comigo' });
    expect(atalho.tagName).toBe('A');
    expect(atalho).toHaveAttribute('href', '#contato');
  });

  it('sem variante, usa a principal (preenchida)', () => {
    render(<Atalho href="#projetos">Ver projetos</Atalho>);

    // Nos testes o CSS não é processado, mas o nome da classe continua no className.
    expect(screen.getByRole('link').className).toMatch(/principal/);
    expect(screen.getByRole('link').className).not.toMatch(/secundario/);
  });

  it('com a variante secundária, usa só o contorno', () => {
    render(
      <Atalho href="#contato" variante="secundario">
        Entrar em contato
      </Atalho>,
    );

    expect(screen.getByRole('link').className).toMatch(/secundario/);
    expect(screen.getByRole('link').className).not.toMatch(/principal/);
  });

  it('navega na mesma aba (é âncora interna, não link externo)', () => {
    render(<Atalho href="#projetos">Ver projetos</Atalho>);

    expect(screen.getByRole('link')).not.toHaveAttribute('target');
  });
});
