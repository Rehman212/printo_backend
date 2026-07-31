import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      console.error('Prisma DB connect failed on startup:', err);
      // Keep process alive so /api/health can respond; requests needing DB will fail until DB is up.
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
