import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "custom-metallic-labels";

/** UPrinting https://www.uprinting.com/metallic-labels.html */
const FEATURED =
  "https://staticecp.uprinting.com/15851/600x600/Metallic_Labels_Stickers_and_Labels.jpg";
const GALLERY = [
  FEATURED,
  "https://staticecp.uprinting.com/1092/700x700/Custom_Metallic_Labels_Marketing_Materials_A.jpg",
  "https://staticecp.uprinting.com/3752/700x700/Metallic_Labels_Thickness_A.jpg",
];

async function main() {
  const product = await prisma.product.findUnique({ where: { slug: SLUG } });
  if (!product) throw new Error(`Product ${SLUG} not found`);

  await prisma.product.update({
    where: { id: product.id },
    data: {
      pricingSourceUrl: "https://www.uprinting.com/metallic-labels.html",
      imageUrl: FEATURED,
      galleryUrls: GALLERY,
    },
  });

  console.log(
    `Updated ${SLUG}: featured + ${GALLERY.length} gallery images (hero was missing from gallery)`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
