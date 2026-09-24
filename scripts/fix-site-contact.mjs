import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      supportEmail: "printoeteam@gmail.com",
      supportPhone: "+1 (251) 280-5283",
      socialInstagram: "https://www.instagram.com/_printoe",
      socialFacebook: "https://www.facebook.com/share/1DufBwMubg/",
      socialLinkedin: "https://www.linkedin.com/company/printoe/",
    },
    update: {
      supportEmail: "printoeteam@gmail.com",
      supportPhone: "+1 (251) 280-5283",
      socialInstagram: "https://www.instagram.com/_printoe",
      socialFacebook: "https://www.facebook.com/share/1DufBwMubg/",
      socialLinkedin: "https://www.linkedin.com/company/printoe/",
    },
  });

  console.log("Updated site contact + social links");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
