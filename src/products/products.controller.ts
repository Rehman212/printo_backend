import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('featured') featured?: string,
  ) {
    return this.productsService.findAll(category, featured === 'true');
  }

  @Get('categories/list')
  listCategories() {
    return this.productsService.listCategories();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Post(':slug/price')
  findVariationPrice(
    @Param('slug') slug: string,
    @Body() body: { selections?: Record<string, string> },
  ) {
    return this.productsService.findVariationPrice(slug, body.selections ?? {});
  }
}
