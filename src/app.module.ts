import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CheckoutModule } from './checkout/checkout.module';
import { ProductsModule } from './products/products.module';
import { AdminProductsModule } from './admin-products/admin-products.module';
import { CrmModule } from './crm/crm.module';
import { CartModule } from './cart/cart.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    DashboardModule,
    CheckoutModule,
    ProductsModule,
    AdminProductsModule,
    CrmModule,
    CartModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
