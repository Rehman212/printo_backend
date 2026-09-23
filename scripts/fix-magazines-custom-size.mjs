import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "magazines";
const CUSTOM_VALUE = "custom";

const CUSTOM_META = {
  default: false,
  pricingByProduct: {
    "41878": {
      anchorPrice: 888.6,
      unitPriceAdd: -0.5283,
      anchorUnitPrice: 0.8886000000000001,
    },
  },
  uprintingOptionId: "custom",
  allowedLinkedValues: ["41878"],
  exclusionRulesByProduct: {
    "41878": [],
  },
};

async function main() {
  const product = await prisma.product.findUnique({
    where: { slug: SLUG },
    select: { id: true },
  });
  if (!product) throw new Error(`Product ${SLUG} not found`);

  const group = await prisma.productOptionGroup.findFirst({
    where: {
      productId: product.id,
      OR: [
        { key: "attr3" },
        { label: { contains: "Page Size", mode: "insensitive" } },
        { label: { equals: "Size", mode: "insensitive" } },
      ],
    },
    include: {
      values: { orderBy: { sortOrder: "desc" }, take: 1 },
    },
  });
  if (!group) throw new Error(`Size group missing on ${SLUG}`);

  const existing = await prisma.productOptionValue.findFirst({
    where: {
      groupId: group.id,
      OR: [{ value: CUSTOM_VALUE }, { label: { equals: "Custom", mode: "insensitive" } }],
    },
  });
  if (existing) {
    console.log(`Magazines already has Custom size (${existing.value})`);
    return;
  }

  const nextSort = (group.values[0]?.sortOrder ?? -1) + 1;
  await prisma.productOptionValue.create({
    data: {
      groupId: group.id,
      label: "Custom",
      value: CUSTOM_VALUE,
      priceMod: 1,
      sortOrder: nextSort,
      meta: CUSTOM_META,
    },
  });

  console.log(`Added Custom size to ${SLUG} (sortOrder=${nextSort})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
