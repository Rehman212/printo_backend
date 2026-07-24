const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const products = await p.product.count();
  const categories = await p.category.count();
  const topSellers = await p.product.findMany({
    where: { badge: 'Top Seller' },
    select: { name: true, basePrice: true },
    orderBy: { name: 'asc' },
  });
  const featured = await p.product.findMany({
    where: { badge: 'Featured' },
    select: { name: true, basePrice: true },
    orderBy: { name: 'asc' },
  });
  const sample = await p.product.findUnique({
    where: { slug: 'standard-business-cards' },
  });
  console.log(
    JSON.stringify(
      {
        products,
        categories,
        topSellers,
        featured,
        standardCards: sample
          ? { name: sample.name, price: sample.basePrice, image: sample.imageUrl }
          : null,
      },
      null,
      2,
    ),
  );
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
