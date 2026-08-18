import { BadRequestException } from '@nestjs/common';
import { AdminProductsService } from './admin-products.service';

function scrape(overrides: Record<string, unknown> = {}) {
  return {
    metadata: {
      source_url: 'https://www.uprinting.com/example.html',
      product_name: 'Example Cards',
    },
    default_selection: { attr0: 'standard', attr1: '100', attr2: 'gloss' },
    description: '<p>Example</p>',
    product_image: 'https://static.example/main.jpg',
    images: ['https://static.example/main.jpg'],
    video: 'https://video.example/example.mp4',
    categoryHint: 'Business Cards',
    attributes: [
      {
        attribute_id: '0',
        name: 'Type',
        field_type: 'buttons',
        defaults_by_product: { standard: 'standard', foil: 'foil' },
        options: [
          { option_id: 'standard', label: 'Standard', default: true },
          { option_id: 'foil', label: 'Foil' },
        ],
      },
      {
        attribute_id: '1',
        name: 'Quantity',
        defaults_by_product: { standard: '100', foil: '100' },
        hide_rules_by_product: { foil: [{ attr0: 'standard' }] },
        options: [
          {
            option_id: '100',
            label: '100',
            default: true,
            available_product_ids: ['standard', 'foil'],
          },
          {
            option_id: '250',
            label: '250',
            available_product_ids: ['standard'],
            exclusion_rules_by_product: {
              standard: [{ attr0: 'foil' }],
            },
          },
        ],
      },
      {
        attribute_id: '2',
        name: 'Finish',
        defaults_by_product: { standard: 'gloss', foil: 'gloss' },
        options: [
          {
            option_id: 'gloss',
            label: 'Gloss',
            default: true,
            available_product_ids: ['standard', 'foil'],
          },
          {
            option_id: 'matte',
            label: 'Matte',
            available_product_ids: ['standard'],
          },
        ],
      },
    ],
    prices: [
      {
        selection: { attr0: 'standard', attr1: '100', attr2: 'gloss' },
        price: 20,
        unit_price: 0.2,
        quantity: 100,
      },
      {
        selection: { attr0: 'standard', attr1: '100', attr2: 'gloss' },
        price: 20,
        unit_price: 0.2,
        quantity: 100,
      },
      {
        selection: { attr0: 'standard', attr1: '250', attr2: 'gloss' },
        price: 35,
        unit_price: 0.14,
        quantity: 250,
      },
      {
        selection: { attr0: 'standard', attr1: '100', attr2: 'matte' },
        price: 22,
        unit_price: 0.22,
        quantity: 100,
      },
    ],
    ...overrides,
  };
}

function product(id = 'draft-1') {
  return {
    id,
    name: 'Example Cards',
    slug: 'example-cards',
    description: '<p>Example</p>',
    shortDescription: null,
    seoTitle: null,
    seoDescription: null,
    basePrice: 20,
    compareAt: null,
    rating: 4.5,
    reviews: 0,
    deliveryDays: 3,
    badge: null,
    imageUrl: null,
    videoUrl: null,
    galleryUrls: [],
    faqs: null,
    productTabs: null,
    featured: false,
    active: false,
    pricingMatrixEnabled: true,
    category: { id: 'cat-1', name: 'Business Cards', slug: 'business-cards' },
    optionGroups: [],
  };
}

function setup(existingDraft: { id: string; slug: string } | null = null) {
  const tx = {
    product: {
      findFirst: jest.fn().mockResolvedValue(existingDraft),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'new-1' }),
      update: jest.fn().mockResolvedValue({}),
    },
    productOptionGroup: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    productVariationPrice: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
  };
  const prisma = {
    category: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'cat-1', name: 'Business Cards', slug: 'business-cards' },
      ]),
      create: jest.fn(),
    },
    product: { findUnique: jest.fn().mockResolvedValue(product(existingDraft?.id ?? 'new-1')) },
    $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
  };
  const productsService = {
    toDetail: jest.fn((value) => ({ product: value, options: value.optionGroups })),
  };
  return {
    service: new AdminProductsService(prisma as never, productsService as never),
    prisma,
    tx,
  };
}

describe('AdminProductsService.importScrape', () => {
  it('rejects malformed and unknown-option pricing rows', async () => {
    const { service } = setup();
    await expect(service.importScrape(scrape({ attributes: [] }) as never))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(service.importScrape(scrape({
      prices: [{
        selection: { attr0: 'missing', attr1: '100', attr2: 'gloss' },
        price: 20,
        unit_price: 0.2,
        quantity: 100,
      }],
    }) as never)).rejects.toThrow('unknown option');
  });

  it('creates one draft with deduplicated matrix rows and linked-card metadata', async () => {
    const { service, tx } = setup();
    const result = await service.importScrape(scrape() as never);

    expect(tx.product.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ active: false }),
    }));
    expect(tx.product.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ active: false, videoUrl: 'https://video.example/example.mp4' }),
    }));
    const createData = tx.product.create.mock.calls[0][0].data;
    expect(createData.optionGroups.create[0].uiType).toBe('CARDS');
    expect(createData.optionGroups.create[1].values.create[0].meta.allowedLinkedValues)
      .toEqual(['standard', 'foil']);
    expect(createData.optionGroups.create[1].meta.hideRulesByProduct.foil)
      .toEqual([{ attr0: 'standard' }]);
    expect(
      createData.optionGroups.create[2].values.create[1].meta
        .pricingByProduct.standard.unitPriceAdd,
    ).toBeCloseTo(0.02);
    expect(tx.productVariationPrice.createMany.mock.calls[0][0].data).toHaveLength(3);
    expect(result.import).toMatchObject({ status: 'draft', pricingRows: 3, refreshed: false });
  });

  it('refreshes a matching draft without creating a duplicate', async () => {
    const { service, tx } = setup({ id: 'draft-1', slug: 'example-cards' });
    const result = await service.importScrape(scrape() as never);

    expect(tx.product.create).not.toHaveBeenCalled();
    expect(tx.productOptionGroup.deleteMany).toHaveBeenCalledWith({ where: { productId: 'draft-1' } });
    expect(tx.productVariationPrice.deleteMany).toHaveBeenCalledWith({ where: { productId: 'draft-1' } });
    expect(result.import.refreshed).toBe(true);
  });

  it('keeps all product and matrix writes inside the transaction', async () => {
    const { service, prisma, tx } = setup();
    tx.productVariationPrice.createMany.mockRejectedValueOnce(new Error('database failure'));

    await expect(service.importScrape(scrape() as never)).rejects.toThrow('database failure');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.product.findUnique).not.toHaveBeenCalled();
  });
});
