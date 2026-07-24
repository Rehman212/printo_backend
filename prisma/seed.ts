import { OptionUiType, Prisma, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getOptionTemplate } = require('./data/product-option-templates.cjs') as {
  getOptionTemplate: (
    slug: string,
    categorySlug: string,
  ) => Array<{
    key: string;
    label: string;
    uiType: string;
    helpText?: string;
    values: Array<{
      label: string;
      value: string;
      priceMod?: number;
      meta?: Prisma.InputJsonValue;
    }>;
  }>;
};

const prisma = new PrismaClient();

type CatalogCategory = {
  name: string;
  slug: string;
  description?: string;
};

type CatalogProduct = {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  compareAt?: number | null;
  imageUrl?: string | null;
  galleryUrls?: string[];
  categorySlug: string;
  rating?: number;
  reviews?: number;
  deliveryDays?: number;
  featured?: boolean;
  badge?: string | null;
  active?: boolean;
};

type CatalogFile = {
  categories: CatalogCategory[];
  products: CatalogProduct[];
};

type ValueSeed = {
  label: string;
  value: string;
  priceMod?: number;
  meta?: Prisma.InputJsonValue;
};

function loadCatalog(): CatalogFile {
  const file = path.join(__dirname, 'data', 'uprinting-catalog.json');
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw) as CatalogFile;
}

function toUiType(raw: string): OptionUiType {
  if (raw === 'CARDS') return OptionUiType.CARDS;
  if (raw === 'NUMBER') return OptionUiType.NUMBER;
  return OptionUiType.SELECT;
}

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

async function seedProductOptions(
  productId: string,
  slug: string,
  categorySlug: string,
) {
  const groups = getOptionTemplate(slug, categorySlug);
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    await upsertGroup(productId, {
      key: g.key,
      label: g.label,
      uiType: toUiType(g.uiType),
      sortOrder: i,
      helpText: g.helpText,
      values: g.values,
    });
  }
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

  const catalog = loadCatalog();
  const categoryBySlug: Record<string, { id: string }> = {};

  for (const cat of catalog.categories) {
    const row = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description ?? null },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? null,
      },
    });
    categoryBySlug[cat.slug] = row;
  }
  console.log('Categories ready:', Object.keys(categoryBySlug).length);

  let upserted = 0;
  let optionsSeeded = 0;
  for (const prod of catalog.products) {
    const category = categoryBySlug[prod.categorySlug];
    if (!category) {
      console.warn(`Skip ${prod.slug}: missing category ${prod.categorySlug}`);
      continue;
    }

    const data = {
      name: prod.name,
      description: prod.description,
      basePrice: prod.basePrice,
      compareAt: prod.compareAt ?? null,
      rating: prod.rating ?? 4.5,
      reviews: prod.reviews ?? 0,
      deliveryDays: prod.deliveryDays ?? 3,
      badge: prod.badge ?? null,
      imageUrl: prod.imageUrl ?? null,
      galleryUrls: prod.galleryUrls ?? [],
      featured: Boolean(prod.featured),
      active: prod.active !== false,
      categoryId: category.id,
    };

    const row = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: data,
      create: { slug: prod.slug, ...data },
    });
    upserted++;

    await seedProductOptions(row.id, prod.slug, prod.categorySlug);
    optionsSeeded++;
  }

  console.log(`Products upserted: ${upserted}`);
  console.log(`Products with option groups: ${optionsSeeded}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
