import { PrismaClient, OptionUiType } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "lip-balm-labels";

const SHAPE_IMAGES = {
  Rectangle: "https://staticecp.uprinting.com/6758/Rectangle.svg",
  "Rectangle w/ Seal":
    "https://staticecp.uprinting.com/8647/50x45/UP_Lip-Balm_Labels_Icon_Image_A.png",
  Circle: "https://staticecp.uprinting.com/6750/Circle.svg",
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
      OR: [{ label: { equals: "Shape", mode: "insensitive" } }, { key: "attr10" }],
    },
    include: { values: true },
  });
  if (!group) throw new Error(`Shape group missing on ${SLUG}`);

  await prisma.productOptionGroup.update({
    where: { id: group.id },
    data: { uiType: OptionUiType.CARDS },
  });

  let updated = 0;
  for (const value of group.values) {
    const image = SHAPE_IMAGES[value.label];
    if (!image) continue;
    const meta =
      value.meta && typeof value.meta === "object" && !Array.isArray(value.meta)
        ? { ...value.meta, image }
        : { image };
    await prisma.productOptionValue.update({
      where: { id: value.id },
      data: { meta },
    });
    updated += 1;
  }

  console.log(`Updated ${SLUG} Shape to CARDS with ${updated} icons`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
