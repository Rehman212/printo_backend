import {
  Body,
  Controller,
  Get,
  OnModuleInit,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProofStatus, QuoteStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminOpsService } from './admin-ops.service';
import {
  CreateQuoteDto,
  UpdateProofStatusDto,
  UpdateQuoteStatusDto,
} from './dto/admin-ops.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminOpsController implements OnModuleInit {
  constructor(private readonly adminOpsService: AdminOpsService) {}

  async onModuleInit() {
    await this.adminOpsService.ensureDemoQuotes();
    await this.adminOpsService.ensureDemoProofs();
    await this.adminOpsService.backfillProofsFromArtwork();
  }

  @Get('stats')
  stats() {
    return this.adminOpsService.stats();
  }

  @Get('customers')
  customers() {
    return this.adminOpsService.listCustomers();
  }

  @Get('proofs')
  proofs() {
    return this.adminOpsService.listProofs();
  }

  @Patch('proofs/:id')
  updateProof(@Param('id') id: string, @Body() dto: UpdateProofStatusDto) {
    return this.adminOpsService.updateProofStatus(id, dto.status);
  }

  @Get('quotes')
  quotes() {
    return this.adminOpsService.listQuotes();
  }

  @Post('quotes')
  createQuote(@Body() dto: CreateQuoteDto) {
    return this.adminOpsService.createQuote(dto);
  }

  @Patch('quotes/:id/status')
  updateQuote(@Param('id') id: string, @Body() dto: UpdateQuoteStatusDto) {
    return this.adminOpsService.updateQuoteStatus(id, dto.status);
  }
}

/** Re-export enums for DTO validation convenience in JS runtime */
export { ProofStatus, QuoteStatus };
