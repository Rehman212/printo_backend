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
  if (!/<ul[\s>]/i.test(description)) {
    description = FEATURES_HTML + description;
  } else if (!/Built for heavy/i.test(description)) {
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
    // Keep hide rules, but Production Time must stay visible for standard qtys.
    if (group.key === "attr1797") {
      meta.hideRulesByProduct = { [PRODUCT_ID]: [] };
    }

    await prisma.productOptionGroup.update({
      where: { id: group.id },
      data: { meta },
    });

    for (const value of group.values) {
      const valueMeta = asObject(value.meta);
      let changed = false;

      if (group.key === "attr1796") {
        const isDefault = value.value === QTY_250;
        if (valueMeta.default !== isDefault) {
          valueMeta.default = isDefault;
          changed = true;
        }
      }

      if (group.key === "attr1797") {
        // Imported exclusion rules hide BOTH turnaround options for qty 1/10/…
        // so Production Time vanishes. Live UPrinting still shows turnaround;
        // clear these so the field stays visible and live price can resolve.
        if (valueMeta.exclusionRulesByProduct) {
          valueMeta.exclusionRulesByProduct = { [PRODUCT_ID]: [] };
          changed = true;
        }
        const isDefault = value.value === TURNAROUND_DEFAULT;
        if (Boolean(valueMeta.default) !== isDefault) {
          valueMeta.default = isDefault;
          changed = true;
        }
      }

      if (group.key === "attr1792") {
        const next = cleanMaterialLabel(value.label);
        if (next !== value.label) {
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
          continue;
        }
      }

      if (changed) {
        await prisma.productOptionValue.update({
          where: { id: value.id },
          data: { meta: valueMeta },
        });
      }
    }
  }

  console.log(
    `Updated ${SLUG}: default qty 250, Production Time visible, material labels, features`,
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
