import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      success: true,
      name: 'Printoe API',
      version: '1.0.0',
    };
  }

  @Get('health')
  health() {
    return {
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
