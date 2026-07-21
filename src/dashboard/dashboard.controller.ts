import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../auth/types/jwt-payload';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  @Get()
  overview(@CurrentUser() user: JwtPayloadUser) {
    return {
      success: true,
      message: 'Dashboard access granted',
      data: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    };
  }
}
