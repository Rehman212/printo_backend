/**
 * Copy categories + products (+ option groups/values) from live DB → local DB.
 *
 * Usage (PowerShell from printo_backend):
 *   $env:PROD_DATABASE_URL="postgresql://postgres:PASSWORD@printoe-db....rds.amazonaws.com:5432/u_printing?schema=public"
 *   node scripts/sync-products-from-prod.cjs
 *
 * Uses local DATABASE_URL from .env (or DATABASE_URL env).
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

function loadEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

const localUrl = process.env.DATABASE_URL;
const prodUrl = process.env.PROD_DATABASE_URL;

if (!localUrl) {
  console.error("Missing local DATABASE_URL (.env)");
  process.exit(1);
}
if (!prodUrl) {
  console.error(
    "Missing PROD_DATABASE_URL. Set it to your live RDS connection string.",
  );
  process.exit(1);
}
if (localUrl === prodUrl) {
  console.error("PROD and local DATABASE_URL are the same — aborting.");
  process.exit(1);
}

const prod = new PrismaClient({ datasources: { db: { url: prodUrl } } });
const local = new PrismaClient({ datasources: { db: { url: localUrl } } });

async function main() {
  console.log("Reading from production…");
  const categories = await prod.category.findMany({ orderBy: { name: "asc" } });
  const products = await prod.product.findMany({
    include: {
      optionGroups: {
        include: { values: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  console.log(
    `Found ${categories.length} categories, ${products.length} products`,
  );

  console.log("Upserting categories → local…");
  for (const c of categories) {
    await local.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        description: c.description,
      },
      create: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      },
    });
  }

  // Map prod category id → local category id (by slug)
  const localCats = await local.category.findMany();
  const catIdBySlug = new Map(localCats.map((c) => [c.slug, c.id]));
  const prodCatById = new Map(categories.map((c) => [c.id, c]));

  console.log("Upserting products → local…");
  let ok = 0;
  for (const p of products) {
    const prodCat = prodCatById.get(p.categoryId);
    const localCategoryId = prodCat
      ? catIdBySlug.get(prodCat.slug)
      : undefined;
    if (!localCategoryId) {
      console.warn(`Skip ${p.slug}: category missing locally`);
      continue;
    }

    const product = await local.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        shortDescription: p.shortDescription,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        basePrice: p.basePrice,
        compareAt: p.compareAt,
        rating: p.rating,
        reviews: p.reviews,
        deliveryDays: p.deliveryDays,
        badge: p.badge,
        imageUrl: p.imageUrl,
        galleryUrls: p.galleryUrls,
        faqs: p.faqs ?? undefined,
        productTabs: p.productTabs ?? undefined,
        featured: p.featured,
        active: p.active,
        categoryId: localCategoryId,
      },
      create: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.shortDescription,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        basePrice: p.basePrice,
        compareAt: p.compareAt,
        rating: p.rating,
        reviews: p.reviews,
        deliveryDays: p.deliveryDays,
        badge: p.badge,
        imageUrl: p.imageUrl,
        galleryUrls: p.galleryUrls,
        faqs: p.faqs ?? undefined,
        productTabs: p.productTabs ?? undefined,
        featured: p.featured,
        active: p.active,
        categoryId: localCategoryId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      },
    });

    // Replace option groups for this product
    await local.productOptionValue.deleteMany({
      where: { group: { productId: product.id } },
    });
    await local.productOptionGroup.deleteMany({
      where: { productId: product.id },
    });

    for (const g of p.optionGroups) {
      const group = await local.productOptionGroup.create({
        data: {
          id: g.id,
          productId: product.id,
          key: g.key,
          label: g.label,
          uiType: g.uiType,
          required: g.required,
          sortOrder: g.sortOrder,
          helpText: g.helpText,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt,
        },
      });
      for (const v of g.values) {
        await local.productOptionValue.create({
          data: {
            id: v.id,
            groupId: group.id,
            label: v.label,
            value: v.value,
            priceMod: v.priceMod,
            sortOrder: v.sortOrder,
            meta: v.meta ?? undefined,
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
          },
        });
      }
    }

    ok += 1;
    if (ok % 25 === 0) console.log(`  … ${ok}/${products.length}`);
  }

  console.log(`Done. Synced ${ok} products to local.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prod.$disconnect();
    await local.$disconnect();
  });
