/**
 * Sync product imageUrl/galleryUrls from uprinting-catalog.json into the DB
 * without running the full seed (avoids bcrypt admin upsert).
 *
 * Usage: node scripts/sync-product-images.cjs
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CATALOG = path.join(__dirname, '..', 'prisma', 'data', 'uprinting-catalog.json');

async function main() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  let updated = 0;
  let missing = 0;

  for (const prod of catalog.products) {
    const existing = await prisma.product.findUnique({
      where: { slug: prod.slug },
      select: { id: true },
    });
    if (!existing) {
      missing++;
      continue;
    }
    await prisma.product.update({
      where: { slug: prod.slug },
      data: {
        imageUrl: prod.imageUrl ?? null,
        galleryUrls: prod.galleryUrls ?? [],
        name: prod.name,
        description: prod.description,
        basePrice: prod.basePrice,
        badge: prod.badge ?? null,
        featured: Boolean(prod.featured),
      },
    });
    updated++;
  }

  console.log(`Images synced: ${updated}`);
  if (missing) console.log(`Not in DB yet (run full seed): ${missing}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
