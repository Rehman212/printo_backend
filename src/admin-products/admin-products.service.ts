import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import {
  CreateOptionGroupDto,
  CreateProductDto,
  UpdateProductDto,
} from './dto/admin-product.dto';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/admin-category.dto';

const detailInclude = {
  category: true,
  optionGroups: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      values: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
};

@Injectable()
export class AdminProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async list() {
    const products = await this.prisma.product.findMany({
      include: detailInclude,
      orderBy: { updatedAt: 'desc' },
    });

    return {
      success: true,
      data: products.map((p) => this.productsService.toDetail(p)),
    };
  }

  async getOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: detailInclude,
    });
    if (!product) throw new NotFoundException('Product not found');
    return { success: true, data: this.productsService.toDetail(product) };
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" already exists`);
    }

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        basePrice: dto.basePrice,
        categoryId: dto.categoryId,
        compareAt: dto.compareAt,
        deliveryDays: dto.deliveryDays ?? 3,
        badge: dto.badge,
        imageUrl: dto.imageUrl,
        galleryUrls: dto.galleryUrls ?? [],
        featured: dto.featured ?? false,
        active: dto.active ?? true,
        optionGroups: dto.options?.length
          ? {
              create: dto.options.map((g, gi) => this.mapOptionGroup(g, gi)),
            }
          : undefined,
      },
      include: detailInclude,
    });

    return {
      success: true,
      message: 'Product created and stored in database',
      data: this.productsService.toDetail(product),
    };
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');

    if (dto.slug && dto.slug !== existing.slug) {
      const clash = await this.prisma.product.findUnique({
        where: { slug: dto.slug },
      });
      if (clash) {
        throw new ConflictException(`Slug "${dto.slug}" already exists`);
      }
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException('Category not found');
    }

    const product = await this.prisma.$transaction(async (tx) => {
      if (dto.options) {
        await tx.productOptionGroup.deleteMany({ where: { productId: id } });
      }

      return tx.product.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          basePrice: dto.basePrice,
          categoryId: dto.categoryId,
          compareAt: dto.compareAt,
          deliveryDays: dto.deliveryDays,
          active: dto.active,
          featured: dto.featured,
          badge: dto.badge,
          imageUrl: dto.imageUrl,
          galleryUrls: dto.galleryUrls,
          ...(dto.options
            ? {
                optionGroups: {
                  create: dto.options.map((g, gi) =>
                    this.mapOptionGroup(g, gi),
                  ),
                },
              }
            : {}),
        },
        include: detailInclude,
      });
    });

    return {
      success: true,
      message: 'Product updated in database',
      data: this.productsService.toDetail(product),
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');

    await this.prisma.product.delete({ where: { id } });

    return {
      success: true,
      message: 'Product deleted from database',
      data: { id },
    };
  }

  async addOptionGroup(productId: string, dto: CreateOptionGroupDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const group = await this.prisma.productOptionGroup.create({
      data: {
        productId,
        ...this.mapOptionGroup(dto, dto.sortOrder ?? 0),
      },
      include: { values: true },
    });

    return { success: true, data: group };
  }

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return { success: true, data: categories };
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Category slug "${dto.slug}" already exists`);
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
      },
      include: { _count: { select: { products: true } } },
    });

    return {
      success: true,
      message: 'Category created',
      data: category,
    };
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    if (dto.slug && dto.slug !== existing.slug) {
      const clash = await this.prisma.category.findUnique({
        where: { slug: dto.slug },
      });
      if (clash) {
        throw new ConflictException(`Category slug "${dto.slug}" already exists`);
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
      },
      include: { _count: { select: { products: true } } },
    });

    return {
      success: true,
      message: 'Category updated',
      data: category,
    };
  }

  async removeCategory(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) throw new NotFoundException('Category not found');

    if (existing._count.products > 0) {
      throw new BadRequestException(
        `Cannot delete “${existing.name}” — ${existing._count.products} product(s) still use it. Move or delete those products first.`,
      );
    }

    await this.prisma.category.delete({ where: { id } });

    return {
      success: true,
      message: 'Category deleted',
      data: { id },
    };
  }

  private mapOptionGroup(g: CreateOptionGroupDto, sortOrder: number) {
    return {
      key: g.key,
      label: g.label,
      uiType: g.uiType,
      required: g.required ?? true,
      sortOrder: g.sortOrder ?? sortOrder,
      helpText: g.helpText,
      values: {
        create: g.values.map((v, vi) => ({
          label: v.label,
          value: v.value,
          priceMod: v.priceMod ?? 1,
          sortOrder: vi,
          meta: (v.meta as Prisma.InputJsonValue) ?? undefined,
        })),
      },
    };
  }
}
