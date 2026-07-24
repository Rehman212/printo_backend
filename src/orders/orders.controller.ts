import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../auth/types/jwt-payload';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** Place order (authenticated customer / admin) */
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@CurrentUser() user: JwtPayloadUser, @Body() dto: CheckoutDto) {
    return this.ordersService.placeOrder(user.userId, dto);
  }

  /** Customer's own orders */
  @Get('orders')
  @UseGuards(JwtAuthGuard)
  myOrders(@CurrentUser() user: JwtPayloadUser) {
    return this.ordersService.listForUser(user.userId);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  myOrder(@Param('id') id: string) {
    return this.ordersService.getOne(id);
  }

  /** Admin: all orders */
  @Get('admin/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminList(@Query('status') status?: string) {
    return this.ordersService.listAll(status);
  }

  @Get('admin/orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminGet(@Param('id') id: string) {
    return this.ordersService.getOne(id);
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminUpdateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
