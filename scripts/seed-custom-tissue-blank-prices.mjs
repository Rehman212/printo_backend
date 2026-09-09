/**
 * Seed Blank (attr0=42641) variation prices for custom-tissue-paper.
 * Local UPrinting scraper is often 403-blocked; production live prices are
 * copied into the local matrix so Blank option changes still price correctly.
 *
 * Paper Color does not change Blank tissue price — rows are cloned per color.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "custom-tissue-paper";
const BLANK = "42641";
const FOLD_SOFT = "1770539";
const SIDE_BLANK = "1763978";
const PAPER = "1770538";
const TA = "1763993";
const PRICE_API =
  process.env.TISSUE_PRICE_API ??
  "https://api.printoe.com/api/products/custom-tissue-paper/price";

function selectionKey(selection) {
  return Object.keys(selection)
    .sort()
    .map((key) => `${key}=${selection[key]}`)
    .join("&");
}

async function fetchPrice(selection) {
  const response = await fetch(PRICE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selections: selection }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${selectionKey(selection)}`);
  }
  const json = await response.json();
  const data = json?.data;
  const price = Number(data?.price);
  const unitPrice = Number(data?.unitPrice);
  const quantity = Number(data?.quantity);
  if (
    !Number.isFinite(price) ||
    !Number.isFinite(unitPrice) ||
    !Number.isFinite(quantity)
  ) {
    throw new Error(`Bad price payload for ${selectionKey(selection)}`);
  }
  return {
    price,
    unitPrice,
    quantity,
    turnaroundDays:
      data?.turnaroundDays == null ? 5 : Number(data.turnaroundDays),
  };
}

async function mapPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let index = 0;
  async function run() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current], current);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => run()),
  );
  return results;
}

async function main() {
  const product = await prisma.product.findUnique({
    where: { slug: SLUG },
    include: { optionGroups: { include: { values: true } } },
  });
  if (!product) throw new Error(`Missing ${SLUG}`);

  const byKey = Object.fromEntries(
    product.optionGroups.map((group) => [group.key, group]),
  );
  const sizes = (byKey.attr3?.values ?? []).filter((value) =>
    (value.meta?.allowedLinkedValues ?? []).includes(BLANK),
  );
  const colors = byKey.attr980?.values ?? [];
  const qtys = (byKey.attr5?.values ?? []).filter((value) =>
    (value.meta?.allowedLinkedValues ?? []).includes(BLANK),
  );
  if (!sizes.length || !colors.length || !qtys.length) {
    throw new Error("Blank size/color/qty options missing");
  }

  const white =
    colors.find((value) => value.value === "1763952") ?? colors[0];
  const jobs = [];
  for (const size of sizes) {
    for (const qty of qtys) {
      jobs.push({ size, qty });
    }
  }

  console.log(
    `Fetching ${jobs.length} Blank size×qty prices from ${PRICE_API} (clone × ${colors.length} colors)`,
  );

  const priced = await mapPool(jobs, 4, async ({ size, qty }) => {
    const selection = {
      attr0: BLANK,
      attr3: size.value,
      attr980: white.value,
      attr1: PAPER,
      attr7: FOLD_SOFT,
      attr4: SIDE_BLANK,
      attr5: qty.value,
      attr6: TA,
    };
    const quote = await fetchPrice(selection);
    console.log(
      `  ${size.label} qty ${qty.label} → $${quote.price} ($${quote.unitPrice}/ea)`,
    );
    return { size, qty, quote };
  });

  let upserts = 0;
  for (const row of priced) {
    for (const color of colors) {
      const selection = {
        attr0: BLANK,
        attr3: row.size.value,
        attr980: color.value,
        attr1: PAPER,
        attr7: FOLD_SOFT,
        attr4: SIDE_BLANK,
        attr5: row.qty.value,
        attr6: TA,
      };
      const key = selectionKey(selection);
      await prisma.productVariationPrice.upsert({
        where: {
          productId_selectionKey: {
            productId: product.id,
            selectionKey: key,
          },
        },
        create: {
          productId: product.id,
          selectionKey: key,
          selection,
          price: row.quote.price,
          unitPrice: row.quote.unitPrice,
          quantity: row.quote.quantity,
          turnaroundDays: row.quote.turnaroundDays,
          inStock: true,
        },
        update: {
          selection,
          price: row.quote.price,
          unitPrice: row.quote.unitPrice,
          quantity: row.quote.quantity,
          turnaroundDays: row.quote.turnaroundDays,
          inStock: true,
        },
      });
      upserts += 1;
    }

    // Stamp qty-specific unit for Blank fallback when an exact row is missing.
    const qtyMeta =
      row.qty.meta && typeof row.qty.meta === "object" && !Array.isArray(row.qty.meta)
        ? { ...row.qty.meta }
        : {};
    const pricingByProduct =
      qtyMeta.pricingByProduct && typeof qtyMeta.pricingByProduct === "object"
        ? { ...qtyMeta.pricingByProduct }
        : {};
    pricingByProduct[BLANK] = {
      ...(pricingByProduct[BLANK] ?? {}),
      anchorPrice: row.quote.price,
      anchorUnitPrice: row.quote.unitPrice,
      matrixUnitPrice: row.quote.unitPrice,
      unitPriceAdd: 0,
    };
    qtyMeta.pricingByProduct = pricingByProduct;
    await prisma.productOptionValue.update({
      where: { id: row.qty.id },
      data: { meta: qtyMeta },
    });
  }

  console.log(`Upserted ${upserts} Blank variation rows for ${SLUG}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
