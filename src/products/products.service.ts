import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const productInclude = {
  category: true,
  optionGroups: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      values: {
        orderBy: { sortOrder: 'asc' as const },
      },
    },
  },
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string, featuredOnly = false) {
    const products = await this.prisma.product.findMany({
      where: {
        active: true,
        ...(featuredOnly ? { featured: true } : {}),
        ...(category
          ? { category: { slug: category } }
          : {}),
      },
      include: {
        category: true,
        optionGroups: {
          select: { id: true, key: true, label: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    });

    return {
      success: true,
      data: products.map((p) => this.toListItem(p)),
    };
  }

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: { where: { active: true } } } },
      },
    });

    return {
      success: true,
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        productCount: c._count.products,
      })),
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    });

    if (!product || !product.active) {
      throw new NotFoundException('Product not found');
    }

    return {
      success: true,
      data: this.toDetail(product),
    };
  }

  private toListItem(product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    basePrice: number;
    compareAt: number | null;
    rating: number;
    reviews: number;
    deliveryDays: number;
    badge: string | null;
    imageUrl: string | null;
    galleryUrls: string[];
    faqs?: unknown;
    productTabs?: unknown;
    featured: boolean;
    category: { id: string; name: string; slug: string };
    optionGroups: { id: string; key: string; label: string }[];
  }) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription ?? null,
      seoTitle: product.seoTitle ?? null,
      seoDescription: product.seoDescription ?? null,
      basePrice: product.basePrice,
      compareAt: product.compareAt,
      rating: product.rating,
      reviews: product.reviews,
      deliveryDays: product.deliveryDays,
      badge: product.badge,
      imageUrl: product.imageUrl,
      galleryUrls: product.galleryUrls,
      faqs: Array.isArray(product.faqs)
        ? (product.faqs as Array<{ question?: string; answer?: string }>).filter(
            (f) =>
              typeof f?.question === 'string' &&
              typeof f?.answer === 'string' &&
              f.question.trim() &&
              f.answer.trim(),
          )
        : [],
      productTabs: Array.isArray(product.productTabs) ? product.productTabs : [],
      featured: product.featured,
      category: product.category,
      optionGroupCount: product.optionGroups.length,
      optionGroups: product.optionGroups,
    };
  }

  toDetail(product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    basePrice: number;
    compareAt: number | null;
    rating: number;
    reviews: number;
    deliveryDays: number;
    badge: string | null;
    imageUrl: string | null;
    galleryUrls: string[];
    faqs?: unknown;
    productTabs?: unknown;
    featured: boolean;
    active?: boolean;
    category: { id: string; name: string; slug: string };
    optionGroups: Array<{
      id: string;
      key: string;
      label: string;
      uiType: string;
      required: boolean;
      sortOrder: number;
      helpText: string | null;
      values: Array<{
        id: string;
        label: string;
        value: string;
        priceMod: number;
        meta: unknown;
        sortOrder: number;
      }>;
    }>;
  }) {
    return {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription ?? null,
        seoTitle: product.seoTitle ?? null,
        seoDescription: product.seoDescription ?? null,
        basePrice: product.basePrice,
        compareAt: product.compareAt,
        rating: product.rating,
        reviews: product.reviews,
        deliveryDays: product.deliveryDays,
        badge: product.badge,
        imageUrl: product.imageUrl,
        galleryUrls: product.galleryUrls,
        faqs: Array.isArray(product.faqs)
          ? (product.faqs as Array<{ question?: string; answer?: string }>).filter(
              (f) =>
                typeof f?.question === 'string' &&
                typeof f?.answer === 'string' &&
                f.question.trim() &&
                f.answer.trim(),
            )
          : [],
        productTabs: Array.isArray(product.productTabs) ? product.productTabs : [],
        featured: product.featured,
        active: product.active ?? true,
        category: product.category,
      },
      options: product.optionGroups.map((g) => ({
        id: g.id,
        key: g.key,
        label: g.label,
        uiType: g.uiType,
        required: g.required,
        sortOrder: g.sortOrder,
        helpText: g.helpText,
        values: g.values.map((v) => ({
          id: v.id,
          label: v.label,
          value: v.value,
          priceMod: v.priceMod,
          sortOrder: v.sortOrder,
          meta: v.meta,
        })),
      })),
    };
  }
}
