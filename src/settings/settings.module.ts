import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsService } from './settings.service';
import {
  AdminSettingsController,
  PublicSettingsController,
} from './settings.controller';

@Module({
  imports: [PrismaModule],
  providers: [SettingsService],
  controllers: [AdminSettingsController, PublicSettingsController],
  exports: [SettingsService],
})
export class SettingsModule {}
