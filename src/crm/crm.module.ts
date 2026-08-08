import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { PublicCrmController } from './public-crm.controller';

@Module({
  imports: [PrismaModule],
  providers: [CrmService],
  controllers: [CrmController, PublicCrmController],
})
export class CrmModule {}
