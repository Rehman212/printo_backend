const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.wishlistItem.findMany();
  let updated = 0;
  for (const item of items) {
    if (item.imageUrl && item.basePrice != null && item.productId) continue;
    const product = await prisma.product.findUnique({
      where: { slug: item.productSlug },
      select: { id: true, imageUrl: true, basePrice: true },
    });
    if (!product) continue;
    await prisma.wishlistItem.update({
      where: { id: item.id },
      data: {
        imageUrl: item.imageUrl || product.imageUrl,
        basePrice: item.basePrice ?? product.basePrice,
        productId: item.productId || product.id,
      },
    });
    updated += 1;
  }
  const after = await prisma.wishlistItem.findMany();
  console.log({ total: after.length, updated, sample: after[0] });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
