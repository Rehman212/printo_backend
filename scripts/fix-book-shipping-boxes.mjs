import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "book-shipping-boxes";
const SOURCE = "https://www.uprinting.com/book-shipping-boxes.html";
const PRODUCT_ID = "43553";

const QTY_250 = "1847648";
const SIZE_DEFAULT = "1847617";
const MATERIAL_DEFAULT = "1847626";
const SIDES_DEFAULT = "1847635";
const TURNAROUND_DEFAULT = "1847658";

/** UPrinting Production Time options + qty exclusion rules (attr1796). */
const PRODUCTION_TIME = [
  {
    value: "1850171",
    label: "Express (4 Business Days)",
    sortOrder: 0,
    days: 4,
    blockedQty: [
      "1847643",
      "1847644",
      "1847645",
      "1847646",
      "1847647",
      "1847648",
      "1847649",
      "1847650",
      "1847651",
      "1847653",
      "1847654",
      "1847655",
      "1850170",
    ],
  },
  {
    value: "1847656",
    label: "Standard (8 Business Days)",
    sortOrder: 1,
    days: 8,
    blockedQty: [
      "1847641",
      "1847647",
      "1847648",
      "1847649",
      "1847650",
      "1847651",
      "1847653",
      "1847654",
      "1847655",
      "1850170",
    ],
  },
  {
    value: "1847657",
    label: "Rush (4 Business Days)",
    sortOrder: 2,
    days: 4,
    blockedQty: [
      "1847641",
      "1847647",
      "1847648",
      "1847649",
      "1847650",
      "1847651",
      "1847653",
      "1847654",
      "1847655",
      "1850170",
    ],
  },
  {
    value: "1847658",
    label: "Standard (10 Business Days)",
    sortOrder: 3,
    days: 10,
    blockedQty: [
      "1847641",
      "1847643",
      "1847644",
      "1847645",
      "1847646",
      "1847650",
      "1847651",
      "1847653",
      "1847654",
      "1847655",
      "1850170",
    ],
  },
  {
    value: "1847659",
    label: "Rush (8 Business Days)",
    sortOrder: 4,
    days: 8,
    blockedQty: [
      "1847641",
      "1847643",
      "1847644",
      "1847645",
      "1847646",
      "1847650",
      "1847651",
      "1847653",
      "1847654",
      "1847655",
      "1850170",
    ],
  },
  {
    value: "1847660",
    label: "Standard (12 Business Days)",
    sortOrder: 5,
    days: 12,
    blockedQty: [
      "1847641",
      "1847643",
      "1847644",
      "1847645",
      "1847646",
      "1847647",
      "1847648",
      "1847649",
      "1847654",
      "1847655",
      "1850170",
    ],
  },
  {
    value: "1847661",
    label: "Standard (15 Business Days)",
    sortOrder: 6,
    days: 15,
    blockedQty: [
      "1847641",
      "1847643",
      "1847644",
      "1847645",
      "1847646",
      "1847647",
      "1847648",
      "1847649",
      "1847650",
      "1847651",
      "1847653",
    ],
  },
];

const FEATURES_HTML = `<ul>
<li>Built for heavy, flat items</li>
<li>Reinforced bottom for added support</li>
<li>Standard and custom sizes available</li>
<li>Print inside, outside, or both</li>
</ul>
`;

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...value }
    : {};
}

function cleanMaterialLabel(label) {
  return String(label)
    .replace(/\s*B\s*-?\s*Flute\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const product = await prisma.product.findUnique({
    where: { slug: SLUG },
    include: { optionGroups: { include: { values: true } } },
  });
  if (!product) throw new Error(`Product ${SLUG} not found`);

  let description = product.description || "";
  if (!/Built for heavy/i.test(description)) {
    description = FEATURES_HTML + description;
  }

  await prisma.product.update({
    where: { id: product.id },
    data: {
      pricingSourceUrl: SOURCE,
      shortDescription:
        "Built for heavy, flat items. Reinforced bottom, standard and custom sizes, print inside, outside, or both.",
      description,
      basePrice: 987.5,
    },
  });

  const defaults = {
    attr1801: SIZE_DEFAULT,
    attr1792: MATERIAL_DEFAULT,
    attr1795: SIDES_DEFAULT,
    attr1796: QTY_250,
    attr1797: TURNAROUND_DEFAULT,
  };

  for (const group of product.optionGroups) {
    const meta = asObject(group.meta);
    const defaultsByProduct = asObject(meta.defaultsByProduct);
    if (defaults[group.key]) {
      defaultsByProduct[PRODUCT_ID] = defaults[group.key];
    }
    meta.defaultsByProduct = defaultsByProduct;

    if (group.key === "attr1797") {
      meta.hideRulesByProduct = { [PRODUCT_ID]: [] };
      meta.presentation = "radio";
    }

    await prisma.productOptionGroup.update({
      where: { id: group.id },
      data: { meta },
    });

    if (group.key === "attr1792") {
      for (const value of group.values) {
        const next = cleanMaterialLabel(value.label);
        if (next === value.label) continue;
        const valueMeta = asObject(value.meta);
        await prisma.productOptionValue.update({
          where: { id: value.id },
          data: {
            label: next,
            meta: {
              ...valueMeta,
              displayLabel: next,
              rawLabel: valueMeta.rawLabel ?? value.label,
            },
          },
        });
      }
    }

    if (group.key === "attr1796") {
      for (const value of group.values) {
        const valueMeta = asObject(value.meta);
        valueMeta.default = value.value === QTY_250;
        await prisma.productOptionValue.update({
          where: { id: value.id },
          data: { meta: valueMeta },
        });
      }
    }

    if (group.key === "attr1797") {
      const existingByValue = new Map(
        group.values.map((value) => [value.value, value]),
      );
      for (const option of PRODUCTION_TIME) {
        const exclusionRulesByProduct = {
          [PRODUCT_ID]: option.blockedQty.map((qty) => ({
            attr1796: qty,
          })),
        };
        const meta = {
          default: option.value === TURNAROUND_DEFAULT,
          uprintingOptionId: option.value,
          allowedLinkedValues: [PRODUCT_ID],
          exclusionRulesByProduct,
          turnaroundDays: option.days,
        };
        const existing = existingByValue.get(option.value);
        if (existing) {
          await prisma.productOptionValue.update({
            where: { id: existing.id },
            data: {
              label: option.label,
              sortOrder: option.sortOrder,
              meta,
            },
          });
        } else {
          await prisma.productOptionValue.create({
            data: {
              groupId: group.id,
              label: option.label,
              value: option.value,
              priceMod: 1,
              sortOrder: option.sortOrder,
              meta,
            },
          });
        }
      }
      // Remove obsolete values not in the live calculator set.
      const keep = new Set(PRODUCTION_TIME.map((item) => item.value));
      for (const value of group.values) {
        if (keep.has(value.value)) continue;
        await prisma.productOptionValue.delete({ where: { id: value.id } });
      }
    }
  }

  console.log(
    `Updated ${SLUG}: full Production Time set + qty exclusions (qty 25 => Standard 8 / Rush 4)`,
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
