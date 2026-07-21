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
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/admin-category.dto';

@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminCategoriesController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get()
  list() {
    return this.adminProductsService.listCategories();
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.adminProductsService.createCategory(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.adminProductsService.updateCategory(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminProductsService.removeCategory(id);
  }
}
