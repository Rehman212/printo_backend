const { PrismaClient } = require("@prisma/client");

async function main() {
  const p = new PrismaClient();
  await p.$executeRawUnsafe(
    'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shortDescription" TEXT',
  );
  await p.$executeRawUnsafe(
    'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT',
  );
  await p.$executeRawUnsafe(
    'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT',
  );
  await p.$executeRawUnsafe(
    'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "faqs" JSONB',
  );
  await p.$executeRawUnsafe(
    'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "productTabs" JSONB',
  );
  console.log("columns ok");
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
