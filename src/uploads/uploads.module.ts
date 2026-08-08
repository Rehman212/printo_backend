import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { PublicFilesController } from './public-files.controller';
import { UploadsService } from './uploads.service';

@Module({
  controllers: [UploadsController, PublicFilesController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
