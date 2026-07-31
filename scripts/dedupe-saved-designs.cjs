const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Add optionsKey column if missing (raw), then dedupe before unique index
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "saved_designs"
    ADD COLUMN IF NOT EXISTS "optionsKey" TEXT NOT NULL DEFAULT ''
  `);

  const designs = await prisma.savedDesign.findMany({
    orderBy: { updatedAt: 'desc' },
  });

  const seen = new Set();
  let removed = 0;
  for (const d of designs) {
    const key = `${d.userId}::${d.productSlug ?? ''}::${d.optionsKey ?? ''}`;
    // Also collapse old duplicates that share same productSlug + productName
    const legacyKey = `${d.userId}::${d.productSlug ?? ''}::name::${d.productName ?? ''}`;
    if (seen.has(key) || (d.productSlug && seen.has(legacyKey))) {
      await prisma.savedDesign.delete({ where: { id: d.id } });
      removed += 1;
      continue;
    }
    seen.add(key);
    if (d.productSlug) seen.add(legacyKey);
  }

  console.log({ total: designs.length, removed, kept: designs.length - removed });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
