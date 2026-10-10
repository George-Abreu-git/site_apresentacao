import { Controller, Get } from '@nestjs/common';

/** Corpo da resposta de GET /api/health. */
export interface StatusDaApi {
  status: 'ok';
}

// "Health check": rota simples que só diz se a API está no ar.
// Serve para testes, para o front e para a hospedagem (Render) saberem que ela subiu.
// O prefixo /api vem de `configurarApp` (criar-app.ts).
@Controller('health')
export class HealthController {
  @Get()
  verificar(): StatusDaApi {
    return { status: 'ok' };
  }
}
