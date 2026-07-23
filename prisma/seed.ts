import { OptionUiType, Prisma, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type ValueSeed = {
  label: string;
  value: string;
  priceMod?: number;
  meta?: Prisma.InputJsonValue;
};

async function upsertGroup(
  productId: string,
  group: {
    key: string;
    label: string;
    uiType: OptionUiType;
    sortOrder: number;
    helpText?: string;
    values: ValueSeed[];
  },
) {
  const created = await prisma.productOptionGroup.upsert({
    where: {
      productId_key: { productId, key: group.key },
    },
    update: {
      label: group.label,
      uiType: group.uiType,
      sortOrder: group.sortOrder,
      helpText: group.helpText ?? null,
    },
    create: {
      productId,
      key: group.key,
      label: group.label,
      uiType: group.uiType,
      sortOrder: group.sortOrder,
      helpText: group.helpText ?? null,
      required: true,
    },
  });

  for (let i = 0; i < group.values.length; i++) {
    const v = group.values[i];
    await prisma.productOptionValue.upsert({
      where: {
        groupId_value: { groupId: created.id, value: v.value },
      },
      update: {
        label: v.label,
        priceMod: v.priceMod ?? 1,
        sortOrder: i,
        meta: v.meta ?? undefined,
      },
      create: {
        groupId: created.id,
        label: v.label,
        value: v.value,
        priceMod: v.priceMod ?? 1,
        sortOrder: i,
        meta: v.meta ?? undefined,
      },
    });
  }

  return created;
}

async function main() {
  const email = 'rehmanwebs@gmail.com';
  const password = '786786';
  const hashed = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashed,
      role: Role.ADMIN,
      name: 'Rehman',
    },
    create: {
      email,
      password: hashed,
      name: 'Rehman',
      company: 'Printoe',
      role: Role.ADMIN,
    },
  });
  console.log('Admin ready:', admin.email);

  const categorySeeds = [
    { name: 'Business Cards', slug: 'business-cards', description: 'Premium business cards' },
    { name: 'Flyers', slug: 'flyers', description: 'High-impact promotional prints' },
    { name: 'Brochures', slug: 'brochures', description: 'Folded marketing prints' },
    { name: 'Posters', slug: 'posters', description: 'Large format posters' },
    { name: 'Stickers', slug: 'stickers', description: 'Die-cut, roll, sheet & kiss-cut stickers' },
    { name: 'Labels', slug: 'labels', description: 'Product & shipping labels' },
    { name: 'Packaging', slug: 'packaging', description: 'Custom packaging' },
    { name: 'Boxes', slug: 'boxes', description: 'Mailer and product boxes' },
    { name: 'Banners', slug: 'banners', description: 'Indoor & outdoor vinyl banners' },
    { name: 'Marketing Materials', slug: 'marketing-materials', description: 'Campaign print kits' },
    { name: 'Apparel', slug: 'apparel', description: 'Branded apparel' },
    { name: 'Promotional Products', slug: 'promotional-products', description: 'Branded giveaways' },
  ] as const;

  const categoryBySlug: Record<string, { id: string }> = {};
  for (const cat of categorySeeds) {
    const row = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
      },
    });
    categoryBySlug[cat.slug] = row;
  }

  const stickersCat = categoryBySlug['stickers'];
  const bannersCat = categoryBySlug['banners'];
  const cardsCat = categoryBySlug['business-cards'];
  console.log('Categories ready:', Object.keys(categoryBySlug).length);

  const stickers = await prisma.product.upsert({
    where: { slug: 'custom-stickers' },
    update: {
      name: 'Custom Stickers',
      description:
        'Waterproof custom stickers with die-cut, roll, sheet, and kiss-cut options. Configure shape, size, material, and finish.',
      basePrice: 0.05,
      rating: 4.3,
      reviews: 2651,
      deliveryDays: 3,
      badge: 'Best Seller',
      featured: true,
      categoryId: stickersCat.id,
      imageUrl:
        'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
        'https://images.unsplash.com/photo-1586075010923-2ddfd303b67a?w=800&q=80',
      ],
    },
    create: {
      name: 'Custom Stickers',
      slug: 'custom-stickers',
      description:
        'Waterproof custom stickers with die-cut, roll, sheet, and kiss-cut options. Configure shape, size, material, and finish.',
      basePrice: 0.05,
      rating: 4.3,
      reviews: 2651,
      deliveryDays: 3,
      badge: 'Best Seller',
      featured: true,
      categoryId: stickersCat.id,
      imageUrl:
        'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
        'https://images.unsplash.com/photo-1586075010923-2ddfd303b67a?w=800&q=80',
      ],
    },
  });

  await upsertGroup(stickers.id, {
    key: 'sticker_type',
    label: 'Sticker Type',
    uiType: OptionUiType.CARDS,
    sortOrder: 0,
    values: [
      { label: 'Die-Cut Singles', value: 'die-cut', priceMod: 1, meta: { icon: 'Scissors' } },
      { label: 'Roll', value: 'roll', priceMod: 1.05, meta: { icon: 'RefreshCw' } },
      { label: 'Sheet', value: 'sheet', priceMod: 0.95, meta: { icon: 'LayoutGrid' } },
      { label: 'Kiss-Cut Singles', value: 'kiss-cut', priceMod: 1.08, meta: { icon: 'Square' } },
    ],
  });

  await upsertGroup(stickers.id, {
    key: 'shape',
    label: 'Shape',
    uiType: OptionUiType.SELECT,
    sortOrder: 1,
    values: [
      { label: 'Square / Rectangle', value: 'square-rectangle', priceMod: 1 },
      { label: 'Circle', value: 'circle', priceMod: 1.05 },
      { label: 'Oval', value: 'oval', priceMod: 1.06 },
      { label: 'Custom Contour', value: 'custom', priceMod: 1.18 },
    ],
  });

  await upsertGroup(stickers.id, {
    key: 'width',
    label: 'Flat Width',
    uiType: OptionUiType.SELECT,
    sortOrder: 2,
    values: [
      { label: '1"', value: '1in', priceMod: 0.85 },
      { label: '2"', value: '2in', priceMod: 1 },
      { label: '3"', value: '3in', priceMod: 1.2 },
      { label: '4"', value: '4in', priceMod: 1.45 },
    ],
  });

  await upsertGroup(stickers.id, {
    key: 'height',
    label: 'Flat Height',
    uiType: OptionUiType.SELECT,
    sortOrder: 3,
    values: [
      { label: '1"', value: '1in', priceMod: 0.85 },
      { label: '2"', value: '2in', priceMod: 1 },
      { label: '3"', value: '3in', priceMod: 1.2 },
      { label: '4"', value: '4in', priceMod: 1.45 },
    ],
  });

  await upsertGroup(stickers.id, {
    key: 'material',
    label: 'Material',
    uiType: OptionUiType.SELECT,
    sortOrder: 4,
    helpText: 'Vinyl is waterproof and ideal for outdoor use.',
    values: [
      { label: 'White Paper', value: 'white-paper', priceMod: 1 },
      { label: 'White Vinyl', value: 'white-vinyl', priceMod: 1.15 },
      { label: 'Clear Vinyl', value: 'clear-vinyl', priceMod: 1.25 },
      { label: 'Holographic', value: 'holographic', priceMod: 1.4 },
    ],
  });

  await upsertGroup(stickers.id, {
    key: 'finish',
    label: 'Finish',
    uiType: OptionUiType.SELECT,
    sortOrder: 5,
    values: [
      { label: 'Gloss Coating', value: 'gloss', priceMod: 1 },
      { label: 'Matte Coating', value: 'matte', priceMod: 1.05 },
      { label: 'No Coating', value: 'none', priceMod: 0.95 },
    ],
  });

  await upsertGroup(stickers.id, {
    key: 'bundling',
    label: 'Bundling',
    uiType: OptionUiType.SELECT,
    sortOrder: 6,
    helpText: 'Optional bundling for easier distribution.',
    values: [
      { label: 'None', value: 'none', priceMod: 1 },
      { label: 'Bundles of 50', value: '50', priceMod: 1.03 },
      { label: 'Bundles of 100', value: '100', priceMod: 1.05 },
    ],
  });

  await upsertGroup(stickers.id, {
    key: 'quantity',
    label: 'Quantity',
    uiType: OptionUiType.SELECT,
    sortOrder: 7,
    values: [
      { label: '250', value: '250', priceMod: 1 },
      { label: '500', value: '500', priceMod: 0.92 },
      { label: '1,000', value: '1000', priceMod: 0.85 },
      { label: '2,500', value: '2500', priceMod: 0.78 },
      { label: '5,000', value: '5000', priceMod: 0.72 },
    ],
  });

  await upsertGroup(stickers.id, {
    key: 'turnaround',
    label: 'Printing Time',
    uiType: OptionUiType.SELECT,
    sortOrder: 8,
    values: [
      { label: '1 Business Day', value: '1-day', priceMod: 1.35 },
      { label: '3 Business Days', value: '3-day', priceMod: 1 },
      { label: '5 Business Days', value: '5-day', priceMod: 0.92 },
    ],
  });

  const banners = await prisma.product.upsert({
    where: { slug: 'vinyl-banners' },
    update: {
      name: 'Vinyl Banners',
      description: 'Weather-resistant vinyl banners with grommet options.',
      basePrice: 39.99,
      rating: 4.7,
      reviews: 654,
      featured: true,
      categoryId: bannersCat.id,
      imageUrl:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    },
    create: {
      name: 'Vinyl Banners',
      slug: 'vinyl-banners',
      description: 'Weather-resistant vinyl banners with grommet options.',
      basePrice: 39.99,
      rating: 4.7,
      reviews: 654,
      featured: true,
      categoryId: bannersCat.id,
      imageUrl:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
      galleryUrls: [],
    },
  });

  await upsertGroup(banners.id, {
    key: 'size',
    label: 'Size',
    uiType: OptionUiType.SELECT,
    sortOrder: 0,
    values: [
      { label: "2' × 4'", value: '2x4', priceMod: 1 },
      { label: "3' × 6'", value: '3x6', priceMod: 1.45 },
      { label: "4' × 8'", value: '4x8', priceMod: 2.1 },
    ],
  });

  await upsertGroup(banners.id, {
    key: 'material',
    label: 'Material',
    uiType: OptionUiType.SELECT,
    sortOrder: 1,
    values: [
      { label: '13oz Vinyl', value: '13oz', priceMod: 1 },
      { label: '18oz Scrim', value: '18oz', priceMod: 1.2 },
      { label: 'Mesh', value: 'mesh', priceMod: 1.15 },
    ],
  });

  await upsertGroup(banners.id, {
    key: 'finishing',
    label: 'Finishing',
    uiType: OptionUiType.SELECT,
    sortOrder: 2,
    values: [
      { label: 'Hemmed + Grommets', value: 'hem-grommets', priceMod: 1 },
      { label: 'Pole Pockets', value: 'pole-pockets', priceMod: 1.12 },
      { label: 'Hemmed Only', value: 'hemmed', priceMod: 0.95 },
    ],
  });

  await upsertGroup(banners.id, {
    key: 'quantity',
    label: 'Quantity',
    uiType: OptionUiType.SELECT,
    sortOrder: 3,
    values: [
      { label: '1', value: '1', priceMod: 1 },
      { label: '2', value: '2', priceMod: 0.95 },
      { label: '5', value: '5', priceMod: 0.88 },
    ],
  });

  await upsertGroup(banners.id, {
    key: 'turnaround',
    label: 'Printing Time',
    uiType: OptionUiType.SELECT,
    sortOrder: 4,
    values: [
      { label: '2 Business Days', value: '2-day', priceMod: 1.2 },
      { label: '4 Business Days', value: '4-day', priceMod: 1 },
    ],
  });

  const cards = await prisma.product.upsert({
    where: { slug: 'silk-business-cards' },
    update: {
      name: 'Silk Business Cards',
      description: 'Soft-touch laminated cards with premium finishes.',
      basePrice: 29.99,
      rating: 4.9,
      reviews: 1284,
      featured: true,
      categoryId: cardsCat.id,
    },
    create: {
      name: 'Silk Business Cards',
      slug: 'silk-business-cards',
      description: 'Soft-touch laminated cards with premium finishes.',
      basePrice: 29.99,
      rating: 4.9,
      reviews: 1284,
      featured: true,
      categoryId: cardsCat.id,
      imageUrl:
        'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=800&q=80',
      galleryUrls: [],
    },
  });

  await upsertGroup(cards.id, {
    key: 'size',
    label: 'Size',
    uiType: OptionUiType.SELECT,
    sortOrder: 0,
    values: [
      { label: '3.5" × 2"', value: 'standard', priceMod: 1 },
      { label: '3.5" × 2" Rounded', value: 'rounded', priceMod: 1.08 },
      { label: 'Square 2.5"', value: 'square', priceMod: 1.12 },
    ],
  });

  await upsertGroup(cards.id, {
    key: 'material',
    label: 'Paper Stock',
    uiType: OptionUiType.SELECT,
    sortOrder: 1,
    values: [
      { label: '16pt Soft Touch', value: '16pt-soft', priceMod: 1 },
      { label: '14pt Matte', value: '14pt-matte', priceMod: 0.92 },
      { label: '18pt Spot UV', value: '18pt-uv', priceMod: 1.25 },
    ],
  });

  await upsertGroup(cards.id, {
    key: 'finish',
    label: 'Finish',
    uiType: OptionUiType.SELECT,
    sortOrder: 2,
    values: [
      { label: 'Soft Touch', value: 'soft-touch', priceMod: 1 },
      { label: 'Matte', value: 'matte', priceMod: 0.95 },
      { label: 'Spot UV', value: 'spot-uv', priceMod: 1.2 },
      { label: 'Foil', value: 'foil', priceMod: 1.35 },
    ],
  });

  await upsertGroup(cards.id, {
    key: 'quantity',
    label: 'Quantity',
    uiType: OptionUiType.SELECT,
    sortOrder: 3,
    values: [
      { label: '100', value: '100', priceMod: 1 },
      { label: '250', value: '250', priceMod: 0.9 },
      { label: '500', value: '500', priceMod: 0.82 },
      { label: '1,000', value: '1000', priceMod: 0.75 },
    ],
  });

  console.log('Products seeded: custom-stickers, vinyl-banners, silk-business-cards');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
