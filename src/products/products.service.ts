import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  customSizeFactor,
  customSizeUnit,
  isCustomSizePilot,
  resolveBaseSizeInches,
  toInches,
} from './custom-size';

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

const PRODUCT_SLUG_ALIASES: Record<string, string> = {
  'address-labels': 'address-labels-return-address-labels',
  'return-address-labels': 'address-labels-return-address-labels',
  'lip-balm-labels-2': 'lip-balm-labels',
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async productBySlug<T>(
    slug: string,
    query: (resolved: string) => Promise<T | null>,
  ) {
    const resolved = PRODUCT_SLUG_ALIASES[slug] ?? slug;
    const match = await query(resolved);
    if (match) return match;
    if (resolved !== slug) {
      const original = await query(slug);
      if (original) return original;
    }
    const publishedTwin = await this.prisma.product.findFirst({
      where: {
        active: true,
        OR: [
          { slug: slug.replace(/-2$/, '') },
          { slug: { startsWith: `${slug.replace(/-2$/, '')}` } },
        ],
      },
      select: { slug: true, name: true },
    });
    if (publishedTwin && publishedTwin.slug !== slug && publishedTwin.slug !== resolved) {
      return query(publishedTwin.slug);
    }
    return null;
  }

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
    const product = await this.productBySlug(slug, (resolved) =>
      this.prisma.product.findUnique({
        where: { slug: resolved },
        include: productInclude,
      }),
    );

    if (!product || !product.active) {
      throw new NotFoundException('Product not found');
    }

    return {
      success: true,
      data: this.toDetail(product),
    };
  }

  async findVariationPrice(
    slug: string,
    selections: Record<string, string>,
    customSize?: { width?: number; height?: number },
  ) {
    const product = await this.productBySlug(slug, (resolved) =>
      this.prisma.product.findUnique({
        where: { slug: resolved },
        select: {
          id: true,
          active: true,
          pricingMatrixEnabled: true,
          pricingSourceUrl: true,
        },
      }),
    );
    if (!product?.active) throw new NotFoundException('Product not found');
    if (!product.pricingMatrixEnabled) {
      return { success: true, data: null };
    }
    const normalized = Object.fromEntries(
      Object.entries(selections)
        .filter(([key, value]) => key && typeof value === 'string' && value)
        .map(([key, value]) => [key, value]),
    );
    const selectionKey = Object.keys(normalized)
      .sort()
      .map((key) => `${key}=${normalized[key]}`)
      .join('&');
    const [row, matrixRows] = await Promise.all([
      this.prisma.productVariationPrice.findUnique({
        where: { productId_selectionKey: { productId: product.id, selectionKey } },
        select: { price: true, unitPrice: true, quantity: true, turnaroundDays: true, inStock: true },
      }),
      this.prisma.productVariationPrice.findMany({
        where: { productId: product.id, inStock: true },
        select: { selection: true },
      }),
    ]);
    const keys = [...new Set(matrixRows.flatMap((item) => Object.keys(item.selection as Record<string, string>)))]
      .sort((a, b) => Number(a.replace(/^attr/, '')) - Number(b.replace(/^attr/, '')));
    const availableOptions = Object.fromEntries(keys.map((targetKey) => {
      const targetIndex = keys.indexOf(targetKey);
      const parentKeys = new Set(keys.slice(0, targetIndex));
      const values = new Set<string>();
      for (const item of matrixRows) {
        const candidate = item.selection as Record<string, string>;
        const matchesParentFields = Object.entries(normalized).every(
          ([key, value]) => !parentKeys.has(key) || candidate[key] === value,
        );
        if (matchesParentFields && candidate[targetKey]) values.add(candidate[targetKey]);
      }
      return [targetKey, [...values]];
    }));
    if (product.pricingSourceUrl) {
      try {
        const previewBase = (
          process.env.SCRAPER_PREVIEW_URL ?? 'http://127.0.0.1:8877'
        ).replace(/\/$/, '');
        const response = await fetch(`${previewBase}/api/live-price`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_url: product.pricingSourceUrl,
            selection: normalized,
          }),
          signal: AbortSignal.timeout(45_000),
        });
        if (response.ok) {
          const live = (await response.json()) as {
            price?: number | string;
            unit_price?: number | string;
            quantity?: number | string;
            turnaround_days?: number | string | null;
          };
          const price = Number(live.price);
          const unitPrice = Number(live.unit_price);
          const quantity = Number(live.quantity);
          if (
            Number.isFinite(price) &&
            Number.isFinite(unitPrice) &&
            Number.isFinite(quantity)
          ) {
            return {
              success: true,
              data: await this.applyCustomSizeScale(slug, product.id, normalized, customSize, {
                price,
                unitPrice,
                quantity,
                turnaroundDays:
                  live.turnaround_days == null
                    ? null
                    : Number(live.turnaround_days),
                inStock: true,
                availableOptions,
                pricingMode: 'live',
              }),
            };
          }
        }
      } catch {
        // A stored exact row remains a safe offline fallback. If none exists,
        // the storefront's unit-delta fallback handles the temporary outage.
      }
    }
    return {
      success: true,
      data: await this.applyCustomSizeScale(slug, product.id, normalized, customSize, {
        ...(row ?? {}),
        availableOptions,
      }),
    };
  }

  private async applyCustomSizeScale(
    slug: string,
    productId: string,
    selections: Record<string, string>,
    customSize: { width?: number; height?: number } | undefined,
    data: Record<string, unknown>,
  ) {
    const width = Number(customSize?.width);
    const height = Number(customSize?.height);
    if (!isCustomSizePilot(slug) || !(width > 0) || !(height > 0)) return data;
    const price = Number(data.price);
    const unitPrice = Number(data.unitPrice);
    if (!Number.isFinite(price) || !Number.isFinite(unitPrice)) return data;

    const groups = await this.prisma.productOptionGroup.findMany({
      where: { productId },
      select: {
        key: true,
        label: true,
        values: { select: { value: true, label: true } },
      },
    });
    const base = resolveBaseSizeInches(slug, groups, selections);
    if (!base) return data;
    const custom = toInches(width, height, customSizeUnit(slug));
    const factor = customSizeFactor(base, custom);
    if (!factor) return data;
    return {
      ...data,
      price: Math.round(price * factor * 100) / 100,
      unitPrice: Math.round(unitPrice * factor * 10000) / 10000,
      customSizeApplied: true,
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
    videoUrl?: string | null;
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
      videoUrl: product.videoUrl ?? null,
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
      pricingMatrixEnabled: 'pricingMatrixEnabled' in product && Boolean(product.pricingMatrixEnabled),
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
    videoUrl?: string | null;
    galleryUrls: string[];
    faqs?: unknown;
    productTabs?: unknown;
    featured: boolean;
    pricingMatrixEnabled?: boolean;
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
      meta?: unknown;
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
        videoUrl: product.videoUrl ?? null,
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
        pricingMatrixEnabled: product.pricingMatrixEnabled ?? false,
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
        meta: g.meta ?? null,
        values: g.values
          .filter((v) => {
            const meta =
              v.meta && typeof v.meta === 'object' && !Array.isArray(v.meta)
                ? (v.meta as Record<string, unknown>)
                : null;
            return !meta?.uiHidden;
          })
          .map((v) => ({
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
