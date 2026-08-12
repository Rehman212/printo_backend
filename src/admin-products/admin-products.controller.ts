import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminProductsService } from './admin-products.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateOptionGroupDto,
  CreateProductDto,
  UpdateProductDto,
} from './dto/admin-product.dto';
import {
  BeginPricingMatrixDto,
  CompletePricingMatrixDto,
  VariationPriceChunkDto,
} from './dto/pricing-matrix.dto';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get()
  list() {
    return this.adminProductsService.list();
  }

  @Get('categories')
  categories() {
    return this.adminProductsService.listCategories();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.adminProductsService.getOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.adminProductsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.adminProductsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminProductsService.remove(id);
  }

  @Post(':id/options')
  addOption(
    @Param('id') id: string,
    @Body() dto: CreateOptionGroupDto,
  ) {
    return this.adminProductsService.addOptionGroup(id, dto);
  }

  @Post(':id/pricing-matrix/begin')
  beginPricingMatrix(@Param('id') id: string, @Body() dto: BeginPricingMatrixDto) {
    return this.adminProductsService.beginPricingMatrix(id, dto.sourceUrl);
  }

  @Post(':id/pricing-matrix/chunk')
  importPricingChunk(@Param('id') id: string, @Body() dto: VariationPriceChunkDto) {
    return this.adminProductsService.importPricingChunk(id, dto.rows);
  }

  @Post(':id/pricing-matrix/complete')
  completePricingMatrix(@Param('id') id: string, @Body() dto: CompletePricingMatrixDto) {
    return this.adminProductsService.completePricingMatrix(id, dto.expectedRows);
  }
}
