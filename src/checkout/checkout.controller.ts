import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../auth/types/jwt-payload';
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

class CheckoutDto {
  @IsArray()
  items!: unknown[];

  @IsNumber()
  @Min(0)
  total!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  @Post()
  create(@CurrentUser() user: JwtPayloadUser, @Body() dto: CheckoutDto) {
    return {
      success: true,
      message: 'Checkout authorized',
      data: {
        orderId: `ORD-${Date.now()}`,
        userId: user.userId,
        total: dto.total,
        itemCount: Array.isArray(dto.items) ? dto.items.length : 0,
        notes: dto.notes ?? null,
        status: 'pending',
      },
    };
  }
}
