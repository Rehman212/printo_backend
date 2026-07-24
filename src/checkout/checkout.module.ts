import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';

/** @deprecated Checkout is handled by OrdersModule (`POST /checkout`) */
@Module({
  imports: [OrdersModule],
})
export class CheckoutModule {}
