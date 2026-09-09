import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "boat-lettering";

/** UPrinting https://www.uprinting.com/boat-lettering.html gallery */
const FEATURED =
  "https://staticecp.uprinting.com/8246/600x600/UP_Boat-Lettering_A%20(1).png";
const GALLERY = [
  FEATURED,
  "https://staticecp.uprinting.com/8133/Vinyl_Colors_Spec_Image.jpg",
  "https://staticecp.uprinting.com/8288/UP_Spec_Location_A%20(1).png",
  "https://staticecp.uprinting.com/9775/UP_White_Squeegee.jpg",
];

async function main() {
  const product = await prisma.product.findUnique({ where: { slug: SLUG } });
  if (!product) throw new Error(`Product ${SLUG} not found`);

  await prisma.product.update({
    where: { id: product.id },
    data: {
      pricingSourceUrl: "https://www.uprinting.com/boat-lettering.html",
      imageUrl: FEATURED,
      galleryUrls: GALLERY,
    },
  });

  console.log(`Updated ${SLUG}: ${GALLERY.length} gallery images`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
