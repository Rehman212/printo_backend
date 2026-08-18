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
import { VariationPriceRowDto } from './dto/pricing-matrix.dto';
import { ImportScrapeDto } from './dto/import-scrape.dto';
import { OptionUiType } from '@prisma/client';

function selectionKey(selection: Record<string, string>) {
  return Object.keys(selection)
    .sort()
    .map((key) => `${key}=${selection[key]}`)
    .join('&');
}

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
        shortDescription: dto.shortDescription || null,
        seoTitle: dto.seoTitle?.trim() || null,
        seoDescription: dto.seoDescription?.trim() || null,
        basePrice: dto.basePrice,
        categoryId: dto.categoryId,
        compareAt: dto.compareAt,
        deliveryDays: dto.deliveryDays ?? 3,
        badge: dto.badge,
        imageUrl: dto.imageUrl,
        videoUrl: dto.videoUrl,
        galleryUrls: dto.galleryUrls ?? [],
        faqs: dto.faqs?.length
          ? (dto.faqs as unknown as Prisma.InputJsonValue)
          : undefined,
        productTabs: dto.productTabs?.length
          ? (dto.productTabs as unknown as Prisma.InputJsonValue)
          : undefined,
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
          shortDescription:
            dto.shortDescription === undefined
              ? undefined
              : dto.shortDescription || null,
          seoTitle:
            dto.seoTitle === undefined
              ? undefined
              : dto.seoTitle?.trim() || null,
          seoDescription:
            dto.seoDescription === undefined
              ? undefined
              : dto.seoDescription?.trim() || null,
          basePrice: dto.basePrice,
          categoryId: dto.categoryId,
          compareAt: dto.compareAt,
          deliveryDays: dto.deliveryDays,
          active: dto.active,
          featured: dto.featured,
          badge: dto.badge,
          imageUrl: dto.imageUrl === '' ? null : dto.imageUrl,
          videoUrl: dto.videoUrl === '' ? null : dto.videoUrl,
          galleryUrls: dto.galleryUrls,
          faqs:
            dto.faqs === undefined
              ? undefined
              : ((dto.faqs ?? []) as unknown as Prisma.InputJsonValue),
          productTabs:
            dto.productTabs === undefined
              ? undefined
              : ((dto.productTabs ?? []) as unknown as Prisma.InputJsonValue),
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

  async beginPricingMatrix(productId: string, sourceUrl?: string) {
    await this.requireProduct(productId);
    await this.prisma.$transaction([
      this.prisma.productVariationPrice.deleteMany({ where: { productId } }),
      this.prisma.product.update({
        where: { id: productId },
        data: {
          pricingMatrixEnabled: false,
          pricingSourceUrl: sourceUrl?.trim() || null,
          pricingImportedAt: null,
        },
      }),
    ]);
    return { success: true, data: { importedRows: 0 } };
  }

  async importPricingChunk(productId: string, rows: VariationPriceRowDto[]) {
    await this.requireProduct(productId);
    if (!rows.length) return { success: true, data: { importedRows: 0 } };
    const normalized = rows.map((row) => ({
      productId,
      selectionKey: selectionKey(row.selection),
      selection: row.selection as Prisma.InputJsonValue,
      price: row.price,
      unitPrice: row.unitPrice,
      quantity: row.quantity,
      turnaroundDays: row.turnaroundDays ?? null,
      inStock: row.inStock ?? true,
    }));
    const result = await this.prisma.productVariationPrice.createMany({
      data: normalized,
      skipDuplicates: true,
    });
    return { success: true, data: { importedRows: result.count } };
  }

  async completePricingMatrix(productId: string, expectedRows: number) {
    await this.requireProduct(productId);
    const importedRows = await this.prisma.productVariationPrice.count({ where: { productId } });
    if (importedRows !== expectedRows) {
      throw new BadRequestException(`Pricing import incomplete: expected ${expectedRows}, stored ${importedRows}`);
    }
    await this.prisma.product.update({
      where: { id: productId },
      data: { pricingMatrixEnabled: importedRows > 0, pricingImportedAt: new Date() },
    });
    return { success: true, data: { importedRows, enabled: importedRows > 0 } };
  }

  private async requireProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!product) throw new NotFoundException('Product not found');
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

  /**
   * Server-side counterpart of AdminProducts.tsx's onImportPricingJson - lets
   * the scraper tool (preview_server.py) push a scrape straight in without a
   * human re-uploading the same JSON through the Admin UI. Mirrors that
   * client-side parsing/delta logic exactly (see the comment there for why
   * priceAdd/matrixUnitPrice/matrixAnchorPrice work the way they do), then
   * reuses create()/beginPricingMatrix()/importPricingChunk()/
   * completePricingMatrix() so there's one path for "how a product gets
   * created," not two. Always created inactive (draft) - an automated push
   * from a scrape gets a human review in Admin before it goes live.
   */
  async importScrape(dto: ImportScrapeDto) {
    if (!Array.isArray(dto.attributes) || !Array.isArray(dto.prices)) {
      throw new BadRequestException('Invalid file: attributes and prices arrays required.');
    }

    const scrapedKeys = new Set(
      dto.attributes.map((attribute) =>
        `attr${String(attribute.attribute_id ?? attribute.attributeId ?? '')}`,
      ),
    );
    const normalizeRulesByProduct = (
      value: Record<string, Array<Record<string, string>>> | undefined,
    ) =>
      Object.fromEntries(
        Object.entries(value ?? {}).map(([productId, rules]) => [
          productId,
          (Array.isArray(rules) ? rules : []).map((rule) =>
            Object.fromEntries(
              Object.entries(rule)
                .map(([key, selected]) => [
                  key.startsWith('attr') ? key : `attr${key}`,
                  String(selected),
                ])
                .filter(([key]) => scrapedKeys.has(key)),
            ),
          ),
        ]),
      );

    const importedGroups = dto.attributes.flatMap((attribute, index) => {
      const attributeId = String(attribute.attribute_id ?? attribute.attributeId ?? '');
      if (!attributeId || !attribute.name || !Array.isArray(attribute.options)) {
        throw new BadRequestException(`Invalid attribute at position ${index + 1}`);
      }
      const usableOptions = attribute.options.filter(
        (option) => {
          const id = String(option.option_id ?? option.optionId ?? '');
          return id !== '' && id !== 'custom' && String(option.label ?? '').trim() !== '';
        },
      );
      // Some scraped attributes (dynamic-size sentinels like "Width
      // (Inches)"/"Height (Inches)" on a linked-calculator product) come
      // through with zero real options - nothing for a customer to select.
      // Skipping them here, before allowedKeys is computed below, keeps the
      // stored pricing-matrix rows' selection keys consistent with the
      // groups that actually exist: including a group with 0 options here
      // once caused the opposite bug - the export's own default_selection
      // referenced these attribute_ids, so every stored row's selectionKey
      // carried them too, and the customer-facing selections (which can
      // only ever be built from a real group's real values) could never
      // reproduce that key, so the exact-match /price lookup silently never
      // hit for ANY selection on that product, not just this attribute.
      if (usableOptions.length === 0) return [];
      return [{
        key: `attr${attributeId}`,
        label: attribute.name,
        // "buttons" only ever marks the synthesized linked-calculator type
        // switcher (attribute_id "0", see preview_server.py's LINKED_CALCULATOR
        // block) - render it as tiles like ProductDetail.tsx's own
        // product-type switcher, not a plain dropdown.
        uiType: attribute.field_type === 'buttons' ? OptionUiType.CARDS : OptionUiType.SELECT,
        required: true,
        helpText: '',
        meta: {
          defaultsByProduct: Object.fromEntries(
            Object.entries(attribute.defaults_by_product ?? {}).map(
              ([productId, value]) => [productId, String(value)],
            ),
          ),
          hideRulesByProduct: normalizeRulesByProduct(
            attribute.hide_rules_by_product,
          ),
        },
        values: usableOptions
          .map((option) => {
            const optionId = String(option.option_id ?? option.optionId ?? '');
            // For a linked-calculator product (multiple Business Card
            // "Types" merged into one product), this narrows each option to
            // only the types it was actually scraped under - e.g. a paper
            // stock only offered for Foil cards shouldn't appear once the
            // customer switches to Standard. Empty when this isn't a linked
            // product (every prices[].selection.attr0 is unset), which
            // ProductDetail.tsx's visibleOptions treats as "no restriction."
            const exportedAvailability = Array.isArray(
              option.available_product_ids,
            )
              ? option.available_product_ids.map(String)
              : null;
            const allowedLinkedValues =
              attributeId === '0'
                ? []
                : exportedAvailability ?? [
                    ...new Set(
                      dto.prices
                        .filter((row) => String(row.selection?.[`attr${attributeId}`] ?? '') === optionId)
                        .map((row) => String(row.selection?.attr0 ?? ''))
                        .filter(Boolean),
                    ),
                  ];
            return {
              label: option.label,
              value: optionId,
              priceMod: 1,
              meta: {
                uprintingOptionId: optionId,
                default: Boolean(option.default),
                allowedLinkedValues,
                exclusionRulesByProduct: normalizeRulesByProduct(
                  option.exclusion_rules_by_product,
                ),
              } as Record<string, unknown>,
            };
          }),
      }];
    });
    if (!importedGroups.length) {
      throw new BadRequestException('Scrape contains no usable option groups.');
    }

    const allowedKeys = new Set(importedGroups.map((g) => g.key));
    const allowedValues = new Map(
      importedGroups.map((group) => [
        group.key,
        new Set(group.values.map((value) => value.value)),
      ]),
    );
    const filterSelection = (selection: Record<string, string> | undefined) =>
      Object.fromEntries(Object.entries(selection ?? {}).filter(([key]) => allowedKeys.has(key)));

    const allRows = dto.prices.map((row, index) => {
      const price = Number(row.price);
      const unitPrice = Number(row.unitPrice ?? row.unit_price);
      const quantity = Number(row.quantity);
      if (
        !row.selection ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0 ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        throw new BadRequestException(`Invalid price row at position ${index + 1}`);
      }
      const selection = filterSelection(row.selection);
      if (
        !Object.keys(selection).length ||
        Object.entries(selection).some(
          ([key, value]) => !allowedValues.get(key)?.has(String(value)),
        )
      ) {
        throw new BadRequestException(`Pricing row ${index + 1} references an unknown option.`);
      }
      return {
        selection,
        price,
        unitPrice,
        quantity,
        turnaroundDays: row.turnaroundDays ?? row.turnaround_days,
        inStock: typeof row.inStock === 'boolean' ? row.inStock : row.in_stock !== 'n' && row.in_stock !== false,
      };
    });

    const seenKeys = new Set<string>();
    const rows: typeof allRows = [];
    for (const row of allRows) {
      const key = Object.entries(row.selection).sort().map(([k, v]) => `${k}=${v}`).join('&');
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      rows.push(row);
    }
    if (!rows.length) {
      throw new BadRequestException('Scrape contains no usable pricing rows.');
    }

    const metadataProductId = String(
      (dto.metadata as Record<string, unknown> | undefined)?.product_id ?? '',
    );
    const linkedGroup = importedGroups.find((group) => group.key === 'attr0');
    const productIds = linkedGroup?.values.map((value) => value.value) ??
      (metadataProductId ? [metadataProductId] : ['default']);
    const isAvailableForProduct = (
      value: { meta?: Record<string, unknown> },
      productId: string,
    ) => {
      const allowed = value.meta?.allowedLinkedValues;
      return !Array.isArray(allowed) || allowed.length === 0 || allowed.includes(productId);
    };

    for (const productId of productIds) {
      const defaults = Object.fromEntries(
        importedGroups.flatMap((group) => {
          if (group.key === 'attr0') return [[group.key, productId]];
          const byProduct = group.meta.defaultsByProduct as Record<string, string>;
          const selected = byProduct?.[productId];
          const value = group.values.find(
            (candidate) =>
              candidate.value === selected &&
              isAvailableForProduct(candidate, productId),
          );
          return value ? [[group.key, value.value]] : [];
        }),
      );
      const anchorRow = rows.find(
        (row) =>
          Object.keys(row.selection).length === Object.keys(defaults).length &&
          Object.entries(defaults).every(
            ([key, value]) => row.selection[key] === value,
          ),
      );
      if (!anchorRow) continue;

      for (const group of importedGroups) {
        for (const value of group.values) {
          if (!isAvailableForProduct(value, productId)) continue;
          const pricingByProduct =
            (value.meta.pricingByProduct as Record<string, Record<string, number>> | undefined) ?? {};
          const isAnchorValue = anchorRow.selection[group.key] === value.value;
          pricingByProduct[productId] = {
            anchorPrice: anchorRow.price,
            anchorUnitPrice: anchorRow.unitPrice,
            ...(isAnchorValue ? { unitPriceAdd: 0 } : {}),
            ...(isAnchorValue && /^quantity$/i.test(group.label)
              ? { matrixUnitPrice: anchorRow.unitPrice }
              : {}),
          };
          value.meta = { ...value.meta, pricingByProduct };
        }
      }

      for (const row of rows) {
        if (linkedGroup && row.selection.attr0 !== productId) continue;
        const diffKeys = Object.keys(defaults).filter(
          (key) => row.selection[key] !== anchorRow.selection[key],
        );
        if (diffKeys.length !== 1) continue;
        const [changedKey] = diffKeys;
        const group = importedGroups.find((candidate) => candidate.key === changedKey);
        const value = group?.values.find(
          (candidate) => candidate.value === row.selection[changedKey],
        );
        if (!group || !value) continue;
        const pricingByProduct =
          (value.meta.pricingByProduct as Record<string, Record<string, number>> | undefined) ?? {};
        pricingByProduct[productId] = {
          anchorPrice: anchorRow.price,
          anchorUnitPrice: anchorRow.unitPrice,
          ...(/^quantity$/i.test(group.label)
            ? { matrixUnitPrice: row.unitPrice, unitPriceAdd: 0 }
            : { unitPriceAdd: row.unitPrice - anchorRow.unitPrice }),
        };
        value.meta = { ...value.meta, pricingByProduct };
      }
    }

    const metadata = dto.metadata ?? {};
    const importedName =
      String((metadata as Record<string, unknown>).productName ?? (metadata as Record<string, unknown>).product_name ?? '').trim() ||
      'Untitled Product';
    const importedDescription = typeof dto.description === 'string' ? dto.description.trim() : '';
    const importedImage = typeof dto.product_image === 'string' ? dto.product_image.trim() : undefined;
    const importedGallery = Array.isArray(dto.images)
      ? [...new Set(dto.images.map((url) => String(url).trim()).filter(Boolean))]
      : [];
    const importedVideo = typeof dto.video === 'string' ? dto.video.trim() : undefined;
    const minPrice = rows.length ? Math.min(...rows.map((row) => row.price)) : 0;
    const sourceUrl = String((metadata as Record<string, unknown>).sourceUrl ?? (metadata as Record<string, unknown>).source_url ?? '') || undefined;

    const categoryId = await this.resolveCategory(dto.categoryHint, importedName);
    const result = await this.prisma.$transaction(async (tx) => {
      // Only refresh an inactive import. A published product is never changed
      // by automation; its next scrape becomes a separate reviewable draft.
      const existingDraft = sourceUrl
        ? await tx.product.findFirst({
            where: { pricingSourceUrl: sourceUrl, active: false },
            orderBy: { updatedAt: 'desc' },
          })
        : null;

      let productId: string;
      let slug: string;
      if (existingDraft) {
        productId = existingDraft.id;
        slug = existingDraft.slug;
        await tx.productVariationPrice.deleteMany({ where: { productId } });
        await tx.productOptionGroup.deleteMany({ where: { productId } });
        await tx.product.update({
          where: { id: productId },
          data: {
            name: importedName,
            description: importedDescription || 'Custom print product.',
            basePrice: minPrice,
            categoryId,
            imageUrl: importedImage || null,
            videoUrl: importedVideo || null,
            galleryUrls: importedGallery,
            active: false,
            pricingMatrixEnabled: false,
            pricingSourceUrl: sourceUrl,
            pricingImportedAt: null,
            optionGroups: {
              create: importedGroups.map((group, index) =>
                this.mapOptionGroup(group as unknown as CreateOptionGroupDto, index),
              ),
            },
          },
        });
      } else {
        const baseSlug = this.slugify(importedName) || `product-${Date.now().toString(36)}`;
        slug = baseSlug;
        let suffix = 1;
        while (await tx.product.findUnique({ where: { slug }, select: { id: true } })) {
          slug = `${baseSlug}-${++suffix}`;
        }
        const product = await tx.product.create({
          data: {
            name: importedName,
            slug,
            description: importedDescription || 'Custom print product.',
            basePrice: minPrice,
            categoryId,
            imageUrl: importedImage,
            videoUrl: importedVideo,
            galleryUrls: importedGallery,
            active: false,
            pricingMatrixEnabled: false,
            pricingSourceUrl: sourceUrl,
            optionGroups: {
              create: importedGroups.map((group, index) =>
                this.mapOptionGroup(group as unknown as CreateOptionGroupDto, index),
              ),
            },
          },
        });
        productId = product.id;
      }

      const chunkSize = 500;
      for (let offset = 0; offset < rows.length; offset += chunkSize) {
        const chunk = rows.slice(offset, offset + chunkSize).map((row) => ({
          productId,
          selectionKey: selectionKey(row.selection),
          selection: row.selection as Prisma.InputJsonValue,
          price: row.price,
          unitPrice: row.unitPrice,
          quantity: row.quantity,
          turnaroundDays: row.turnaroundDays ?? null,
          inStock: row.inStock,
        }));
        await tx.productVariationPrice.createMany({ data: chunk });
      }
      await tx.product.update({
        where: { id: productId },
        data: {
          pricingMatrixEnabled: true,
          pricingSourceUrl: sourceUrl,
          pricingImportedAt: new Date(),
        },
      });
      return { productId, slug, refreshed: Boolean(existingDraft) };
    }, { timeout: 30_000 });

    const product = await this.prisma.product.findUnique({
      where: { id: result.productId },
      include: detailInclude,
    });
    if (!product) throw new NotFoundException('Imported product not found');
    const category = product.category;

    return {
      success: true,
      message: `${result.refreshed ? 'Refreshed' : 'Imported'} "${importedName}" as a draft in "${category.name}" (${rows.length} pricing rows). Review and publish in Admin → Products.`,
      data: this.productsService.toDetail(product),
      import: {
        productId: result.productId,
        slug: result.slug,
        category: category.name,
        pricingRows: rows.length,
        status: 'draft',
        refreshed: result.refreshed,
      },
    };
  }

  /** Matches an existing category by name (exact, then substring-in-product-name); creates one if nothing fits. */
  private async resolveCategory(hint: string | undefined, productName: string): Promise<string> {
    const categories = await this.prisma.category.findMany();
    const normalize = (s: string) => s.trim().toLowerCase();

    const words = productName.trim().split(/\s+/);
    const guesses = [hint, words.length >= 2 ? words.slice(-2).join(' ') : undefined, words.at(-1)].filter(
      (g): g is string => Boolean(g),
    );

    for (const guess of guesses) {
      const match = categories.find((c) => normalize(c.name) === normalize(guess));
      if (match) return match.id;
    }

    const nameLower = normalize(productName);
    const substringMatch = categories.find((c) => nameLower.includes(normalize(c.name)));
    if (substringMatch) return substringMatch.id;

    const newName = guesses[0] ?? 'Imported Products';
    const slug = this.slugify(newName) || 'imported-products';
    const existingBySlug = categories.find((c) => c.slug === slug);
    if (existingBySlug) return existingBySlug.id;

    const category = await this.prisma.category.create({ data: { name: newName, slug } });
    return category.id;
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private mapOptionGroup(g: CreateOptionGroupDto, sortOrder: number) {
    return {
      key: g.key,
      label: g.label,
      uiType: g.uiType,
      required: g.required ?? true,
      sortOrder: g.sortOrder ?? sortOrder,
      helpText: g.helpText,
      meta: (g.meta as Prisma.InputJsonValue) ?? undefined,
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
