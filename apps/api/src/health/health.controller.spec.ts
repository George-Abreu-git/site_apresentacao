import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller.js';
import { HealthModule } from './health.module.js';

describe('HealthController', () => {
  it('responde que a API está no ar', () => {
    const controller = new HealthController();

    expect(controller.verificar()).toEqual({ status: 'ok' });
  });

  it('é registrado pelo HealthModule', async () => {
    // Monta só este módulo, como o Nest faria ao subir a API.
    const modulo = await Test.createTestingModule({ imports: [HealthModule] }).compile();

    expect(modulo.get(HealthController).verificar()).toEqual({ status: 'ok' });
  });

  it('a resposta tem só o campo status (não expõe versão, ambiente nem variáveis)', () => {
    expect(Object.keys(new HealthController().verificar())).toEqual(['status']);
  });

  it('cada resposta é um objeto novo (alterar uma não muda a próxima)', () => {
    const controller = new HealthController();
    const primeira = controller.verificar() as { status: string };
    primeira.status = 'alterado';

    expect(controller.verificar()).toEqual({ status: 'ok' });
  });
});
