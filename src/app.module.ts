import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { AdminProductsModule } from './admin-products/admin-products.module';
import { CrmModule } from './crm/crm.module';
import { CartModule } from './cart/cart.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UploadsModule } from './uploads/uploads.module';
import { AdminOpsModule } from './admin-ops/admin-ops.module';
import { CustomerModule } from './customer/customer.module';
import { SettingsModule } from './settings/settings.module';
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
    OrdersModule,
    ProductsModule,
    ReviewsModule,
    AdminProductsModule,
    AdminOpsModule,
    CustomerModule,
    CrmModule,
    CartModule,
    UploadsModule,
    SettingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
