import { Controller, Get } from '@nestjs/common';
import type { Projeto } from '@site-apresentacao/shared';
import { ProjetosService } from './projetos.service.js';

// Controller: só traduz HTTP <-> service. A regra fica no ProjetosService.
// Rota final: GET /api/projetos (o prefixo /api vem de criarApp, em criar-app.ts).
@Controller('projetos')
export class ProjetosController {
  // O Nest descobre pelo tipo do parâmetro que deve entregar o ProjetosService (injeção de dependência).
  constructor(private readonly projetosService: ProjetosService) {}

  // Método assíncrono: o Nest espera a Promise terminar e só então responde com o JSON.
  @Get()
  listar(): Promise<Projeto[]> {
    return this.projetosService.listar();
  }
}
