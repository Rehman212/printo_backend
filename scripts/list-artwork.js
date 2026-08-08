const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.order
  .findMany({
    where: {
      OR: [{ artworkFile: { not: null } }, { proofStatus: { not: "NONE" } }],
    },
    select: { orderNumber: true, artworkFile: true, proofStatus: true },
    take: 10,
  })
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
    return p.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await p.$disconnect();
    process.exit(1);
  });
