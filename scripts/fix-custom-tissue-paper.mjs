import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "custom-tissue-paper";
const SOURCE = "https://www.uprinting.com/custom-tissue.html";
const FULL = "18223";
const BLANK = "42641";

const FEATURED =
  "https://staticecp.uprinting.com/3878/600x600/Custom_Tissue_Paper_Marketing_Materials_B.jpg";

const FULL_SIZES = new Set([
  "1753141", // 10x14
  "1753142", // 14x20
  "1753143", // 18x24
  "1753144", // 21x29
]);

const FULL_QTY = [
  "574594", // 10
  "574503", // 25
  "574504", // 50
  "574506", // 100
  "574508", // 200
  "574509", // 250
  "574595", // 300
  "574596", // 400
  "574510", // 500
  "574597", // 600
  "574598", // 700
  "574599", // 800
  "574600", // 900
  "574511", // 1000
  "574512", // 2000
];

/** 10 lb White Tissue blocked at these Full Color quantities (UPrinting). */
const PAPER_10LB_BLOCKED_QTY = [
  "574508",
  "574509",
  "574595",
  "574596",
  "574510",
  "574597",
  "574598",
  "574599",
  "574600",
  "574511",
  "574512",
];

/** Full Color turnaround options (UPrinting custom-tissue.html). */
const PRINTING_TIME_FULL = [
  { value: "1869244", label: "5 Business Days", days: 5, sortOrder: 0 },
  { value: "574601", label: "8 Business Days", days: 8, sortOrder: 1 },
  { value: "1429163", label: "10 Business Days", days: 10, sortOrder: 2 },
  { value: "1637631", label: "12 Business Days", days: 12, sortOrder: 3 },
  { value: "873398", label: "15 Business Days", days: 15, sortOrder: 4 },
  { value: "1494701", label: "17 Business Days", days: 17, sortOrder: 5 },
  { value: "1212384", label: "20 Business Days", days: 20, sortOrder: 6 },
  { value: "1494702", label: "24 Business Days", days: 24, sortOrder: 7 },
];

/** Blank uses a separate 5-day option id. */
const PRINTING_TIME_BLANK = [
  { value: "1763993", label: "5 Business Days", days: 5, sortOrder: 0 },
];

/** Full Color sizes that use Half Fold instead of None. */
const HALF_FOLD_SIZES = new Set(["1753142", "1753143", "1753144"]);
const FOLD_NONE = "574471";
const FOLD_HALF = "574472";

const FEATURES_HTML = `<ul>
<li>Custom printed or blank</li>
<li>Available in multiple sizes &amp; various colors</li>
<li>Dress up paper bags and mailer boxes</li>
<li>Protects items from dirt and shock</li>
<li>Choose from soft or thick tissue paper</li>
</ul>
`;

const DESCRIPTION = `${FEATURES_HTML}
<h2>Make every little detail count with custom tissue paper.</h2>
<p>Finishing touches matter, especially if you want to elevate the unboxing experience of your customers. Custom printed and blank tissue paper can help you do just that — not only does it protect your products from dirt and impact, but it also makes a good first impression on people.</p>`;

const DEFAULTS = {
  [FULL]: {
    attr3: "1753141",
    attr1: "1849060",
    attr7: "574471",
    attr4: "574499",
    attr975: "639451",
    attr5: "574506",
    attr6: "1869244",
  },
  [BLANK]: {
    attr3: "1763960",
    attr980: "1763952",
    attr1: "1770538",
    attr7: "1770539", // Soft Fold (hidden, priced)
    attr4: "1763978", // No Printing (blank) (hidden, priced)
    attr5: "1763980",
    attr6: "1763993",
  },
};

const FOLD_SOFT = "1770539";
const SIDE_BLANK = "1763978";

/** Blank default combo live anchors (6x14 / White / qty 100 / 5 days). */
const BLANK_PRICING = {
  anchorPrice: 20.96,
  unitPriceAdd: 0,
  anchorUnitPrice: 0.2096,
};

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...value }
    : {};
}

async function main() {
  const product = await prisma.product.findUnique({
    where: { slug: SLUG },
    include: { optionGroups: { include: { values: true } } },
  });
  if (!product) throw new Error(`Product ${SLUG} not found`);

  const gallery = [
    FEATURED,
    ...(product.galleryUrls || []).filter((url) => url && url !== FEATURED),
  ].slice(0, 12);

  await prisma.product.update({
    where: { id: product.id },
    data: {
      pricingSourceUrl: SOURCE,
      imageUrl: FEATURED,
      galleryUrls: gallery,
      shortDescription:
        "Custom printed or blank tissue paper in multiple sizes and colors. Soft or thick stock to dress up bags and mailer boxes.",
      description: DESCRIPTION,
      basePrice: 101.95,
      deliveryDays: 5,
    },
  });

  for (const group of product.optionGroups) {
    const meta = asObject(group.meta);
    const defaultsByProduct = asObject(meta.defaultsByProduct);
    for (const [productId, defaults] of Object.entries(DEFAULTS)) {
      if (defaults[group.key]) {
        defaultsByProduct[productId] = defaults[group.key];
      }
    }
    meta.defaultsByProduct = defaultsByProduct;

    if (group.key === "attr980") {
      // Paper Color only for Blank (UPrinting).
      meta.hideRulesByProduct = { [FULL]: [{}], [BLANK]: [] };
    }
    if (group.key === "attr7") {
      // Soft Fold is Blank-only and UI-hidden; still required for live price.
      meta.hideRulesByProduct = { [BLANK]: [{}], [FULL]: [] };
      meta.keepWhenHidden = true;
      meta.forceSelect = true;
    }
    if (group.key === "attr4") {
      meta.hideRulesByProduct = { [BLANK]: [{}], [FULL]: [] };
      meta.keepWhenHidden = true;
      meta.forceSelect = true;
    }
    if (group.key === "attr975") {
      meta.hideRulesByProduct = { [BLANK]: [{}], [FULL]: [] };
      meta.forceSelect = true;
    }
    if (group.key === "attr6") {
      meta.hideRulesByProduct = { [FULL]: [], [BLANK]: [] };
    }
    if (group.key === "attr1") {
      meta.forceSelect = true;
    }

    let label = group.label;
    if (group.key === "attr1") label = "Paper Type";
    if (group.key === "attr975") label = "Print Color";
    if (group.key === "attr6") label = "Printing Time";

    await prisma.productOptionGroup.update({
      where: { id: group.id },
      data: { label, meta },
    });

    if (group.key === "attr3") {
      for (const value of group.values) {
        const valueMeta = asObject(value.meta);
        const isFull = FULL_SIZES.has(value.value);
        valueMeta.allowedLinkedValues = isFull ? [FULL] : [BLANK];
        valueMeta.default =
          value.value === DEFAULTS[FULL].attr3 ||
          value.value === DEFAULTS[BLANK].attr3;
        await prisma.productOptionValue.update({
          where: { id: value.id },
          data: { meta: valueMeta },
        });
      }
    }

    if (group.key === "attr1") {
      for (const value of group.values) {
        const valueMeta = asObject(value.meta);
        let nextLabel = value.label
          .replace(/\s*\(inhouse\)\s*/i, "")
          .replace(/10lb\./i, "10 lb.")
          .replace(/\s+/g, " ")
          .trim();
        if (value.value === "1849060") nextLabel = "10 lb. White Tissue";
        if (value.value === "1241035") nextLabel = "18 lb. White Tissue";
        if (value.value === "1770538") nextLabel = "10 lb. Tissue";

        if (value.value === "1849060" || value.value === "1241035") {
          valueMeta.allowedLinkedValues = [FULL];
        } else if (value.value === "1770538") {
          valueMeta.allowedLinkedValues = [BLANK];
        }

        if (value.value === "1849060") {
          valueMeta.exclusionRulesByProduct = {
            [FULL]: PAPER_10LB_BLOCKED_QTY.map((qty) => ({ attr5: qty })),
          };
        }

        valueMeta.default =
          value.value === DEFAULTS[FULL].attr1 ||
          value.value === DEFAULTS[BLANK].attr1;
        valueMeta.displayLabel = nextLabel;
        await prisma.productOptionValue.update({
          where: { id: value.id },
          data: { label: nextLabel, meta: valueMeta },
        });
      }
    }

    if (group.key === "attr5") {
      const fullSet = new Set(FULL_QTY);
      for (const [index, value] of group.values.entries()) {
        const valueMeta = asObject(value.meta);
        const isFull = fullSet.has(value.value);
        valueMeta.allowedLinkedValues = isFull ? [FULL] : [BLANK];
        valueMeta.default =
          value.value === DEFAULTS[FULL].attr5 ||
          value.value === DEFAULTS[BLANK].attr5;
        const qtyNum = Number.parseInt(String(value.label).replace(/,/g, ""), 10);
        await prisma.productOptionValue.update({
          where: { id: value.id },
          data: {
            sortOrder: Number.isFinite(qtyNum) ? qtyNum : index,
            meta: valueMeta,
          },
        });
      }
    }

    if (group.key === "attr7") {
      const existingByValue = new Map(
        group.values.map((value) => [value.value, value]),
      );
      const foldOptions = [
        {
          value: FOLD_NONE,
          label: "None",
          sortOrder: 0,
          meta: {
            default: true,
            uprintingOptionId: FOLD_NONE,
            allowedLinkedValues: [FULL],
            exclusionRulesByProduct: {
              [FULL]: [...HALF_FOLD_SIZES].map((size) => ({ attr3: size })),
            },
          },
        },
        {
          value: FOLD_HALF,
          label: "Half Fold",
          sortOrder: 1,
          meta: {
            default: false,
            uprintingOptionId: FOLD_HALF,
            allowedLinkedValues: [FULL],
            exclusionRulesByProduct: {
              [FULL]: [{ attr3: "1753141" }],
            },
          },
        },
        {
          value: FOLD_SOFT,
          label: "Soft Fold",
          sortOrder: 2,
          meta: {
            default: true,
            uprintingOptionId: FOLD_SOFT,
            allowedLinkedValues: [BLANK],
            pricingByProduct: { [BLANK]: BLANK_PRICING },
          },
        },
      ];
      const keep = new Set(foldOptions.map((item) => item.value));
      for (const option of foldOptions) {
        const existing = existingByValue.get(option.value);
        if (existing) {
          await prisma.productOptionValue.update({
            where: { id: existing.id },
            data: {
              label: option.label,
              sortOrder: option.sortOrder,
              meta: option.meta,
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
              meta: option.meta,
            },
          });
        }
      }
      for (const value of group.values) {
        if (keep.has(value.value)) continue;
        await prisma.productOptionValue.delete({ where: { id: value.id } });
      }
    }

    if (group.key === "attr4") {
      const existingByValue = new Map(
        group.values.map((value) => [value.value, value]),
      );
      const sideOptions = [
        {
          value: "574499",
          label: "Front Only",
          sortOrder: 0,
          meta: {
            default: true,
            uprintingOptionId: "574499",
            allowedLinkedValues: [FULL],
          },
        },
        {
          value: SIDE_BLANK,
          label: "No Printing (blank)",
          sortOrder: 1,
          meta: {
            default: true,
            uprintingOptionId: SIDE_BLANK,
            allowedLinkedValues: [BLANK],
            pricingByProduct: { [BLANK]: BLANK_PRICING },
          },
        },
      ];
      const keep = new Set(sideOptions.map((item) => item.value));
      for (const option of sideOptions) {
        const existing = existingByValue.get(option.value);
        if (existing) {
          await prisma.productOptionValue.update({
            where: { id: existing.id },
            data: {
              label: option.label,
              sortOrder: option.sortOrder,
              meta: option.meta,
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
              meta: option.meta,
            },
          });
        }
      }
      for (const value of group.values) {
        if (keep.has(value.value)) continue;
        await prisma.productOptionValue.delete({ where: { id: value.id } });
      }
    }

    if (group.key === "attr975") {
      for (const value of group.values) {
        const valueMeta = asObject(value.meta);
        valueMeta.allowedLinkedValues = [FULL];
        valueMeta.displayLabel = "Full Color";
        valueMeta.default = true;
        await prisma.productOptionValue.update({
          where: { id: value.id },
          data: { label: "Full Color", meta: valueMeta },
        });
      }
    }

    if (group.key === "attr980") {
      for (const value of group.values) {
        const valueMeta = asObject(value.meta);
        valueMeta.allowedLinkedValues = [BLANK];
        valueMeta.default = value.value === DEFAULTS[BLANK].attr980;
        valueMeta.pricingByProduct = {
          ...asObject(valueMeta.pricingByProduct),
          [BLANK]: BLANK_PRICING,
        };
        await prisma.productOptionValue.update({
          where: { id: value.id },
          data: { meta: valueMeta },
        });
      }
    }

    if (group.key === "attr0") {
      for (const value of group.values) {
        const valueMeta = asObject(value.meta);
        valueMeta.default = value.value === FULL;
        if (value.value === BLANK) {
          valueMeta.pricingByProduct = { [BLANK]: BLANK_PRICING };
        }
        await prisma.productOptionValue.update({
          where: { id: value.id },
          data: { meta: valueMeta },
        });
      }
    }

    if (group.key === "attr6") {
      const existingByValue = new Map(
        group.values.map((value) => [value.value, value]),
      );
      const allTimes = [
        ...PRINTING_TIME_FULL.map((option) => ({
          ...option,
          allowedLinkedValues: [FULL],
          isDefault: option.value === "1869244",
        })),
        ...PRINTING_TIME_BLANK.map((option) => ({
          ...option,
          allowedLinkedValues: [BLANK],
          isDefault: option.value === "1763993",
          pricingByProduct: { [BLANK]: BLANK_PRICING },
        })),
      ];
      const keep = new Set(allTimes.map((item) => item.value));
      for (const option of allTimes) {
        const valueMeta = {
          default: option.isDefault,
          uprintingOptionId: option.value,
          turnaroundDays: option.days,
          allowedLinkedValues: option.allowedLinkedValues,
          ...(option.pricingByProduct
            ? { pricingByProduct: option.pricingByProduct }
            : {}),
        };
        const existing = existingByValue.get(option.value);
        if (existing) {
          await prisma.productOptionValue.update({
            where: { id: existing.id },
            data: {
              label: option.label,
              sortOrder: option.sortOrder,
              meta: valueMeta,
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
              meta: valueMeta,
            },
          });
        }
      }
      for (const value of group.values) {
        if (keep.has(value.value)) continue;
        await prisma.productOptionValue.delete({ where: { id: value.id } });
      }
    }
  }

  // Stamp Blank pricing on Blank-only paper / size / qty defaults
  const refreshed = await prisma.product.findUnique({
    where: { slug: SLUG },
    include: { optionGroups: { include: { values: true } } },
  });
  for (const group of refreshed?.optionGroups ?? []) {
    if (!["attr1", "attr3", "attr5"].includes(group.key)) continue;
    for (const value of group.values) {
      const valueMeta = asObject(value.meta);
      const allowed = valueMeta.allowedLinkedValues;
      if (!Array.isArray(allowed) || !allowed.includes(BLANK)) continue;
      valueMeta.pricingByProduct = {
        ...asObject(valueMeta.pricingByProduct),
        [BLANK]: BLANK_PRICING,
      };
      await prisma.productOptionValue.update({
        where: { id: value.id },
        data: { meta: valueMeta },
      });
    }
  }

  console.log(
    `Updated ${SLUG}: Blank Soft Fold/No Printing + live Blank pricing anchors, Full/Blank rules`,
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
