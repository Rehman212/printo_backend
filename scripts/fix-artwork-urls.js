const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const base = (process.env.API_PUBLIC_URL || "http://localhost:4000").replace(
    /\/$/,
    "",
  );
  const rows = await p.order.findMany({
    where: { artworkFile: { not: null } },
    select: { id: true, orderNumber: true, artworkFile: true },
  });
  for (const row of rows) {
    let next = row.artworkFile || "";
    // Relative frontend paths → Nest file API
    const m = next.match(/\/uploads\/artwork\/([^/?#]+)/i);
    if (m) {
      next = `${base}/api/files/artwork/${m[1]}`;
    } else if (next && !/^https?:\/\//i.test(next) && !next.startsWith("/api/")) {
      // bare filename
      if (/\.(png|jpe?g|gif|webp|svg|pdf)$/i.test(next)) {
        next = `${base}/api/files/artwork/${encodeURIComponent(next)}`;
      }
    }
    if (next !== row.artworkFile) {
      await p.order.update({
        where: { id: row.id },
        data: { artworkFile: next },
      });
      console.log(row.orderNumber, "=>", next);
    } else {
      console.log(row.orderNumber, "ok", next);
    }
  }
}

main()
  .then(() => p.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await p.$disconnect();
    process.exit(1);
  });
