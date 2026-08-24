import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "bumper-stickers";
const SOURCE = "https://www.uprinting.com/bumper-sticker-printing.html";
const PRODUCT_ID = "338";

const SIZE_DEFAULT = "19689"; // 6" x 2"
const MATERIAL_DEFAULT = "15576"; // High Gloss White Outdoor Vinyl
const QTY_DEFAULT = "15579"; // 50
const TURNAROUND_DEFAULT = "123200"; // 3 Business Days
const BUNDLING_DEFAULT = "123195"; // None
const BUNDLING_SHRINK = "123196";
const SIDES_DEFAULT = "15577"; // Front Only
const SETS_DEFAULT = "123197"; // 25

/**
 * UPrinting Size dropdown (featured Square + Rectangle).
 * Other scraped sizes stay in DB for pricing history but are UI-hidden.
 */
const FEATURED_SIZES = [
  { value: "19686", label: '3" x 3"', group: "Square", sortOrder: 0 },
  { value: "19687", label: '4" x 4"', group: "Square", sortOrder: 1 },
  { value: "19689", label: '6" x 2"', group: "Rectangle", sortOrder: 2 },
  { value: "19690", label: '6" x 3"', group: "Rectangle", sortOrder: 3 },
  { value: "123191", label: '7" x 3"', group: "Rectangle", sortOrder: 4 },
  { value: "19691", label: '9" x 3"', group: "Rectangle", sortOrder: 5 },
  { value: "19692", label: '10" x 3"', group: "Rectangle", sortOrder: 6 },
  { value: "19693", label: '11" x 3"', group: "Rectangle", sortOrder: 7 },
  { value: "123194", label: '11.5" x 3"', group: "Rectangle", sortOrder: 8 },
];

const MATERIAL_LABELS = {
  "1833676": "Gloss White Outdoor BOPP",
  "1833678": "Matte White Outdoor Vinyl",
  "1833680": "Gloss White Outdoor Vinyl",
  "15576": "High Gloss White Outdoor Vinyl",
  "1833679": "Reflective Vinyl",
};

/** BOPP not offered at qty 250+ (UPrinting exclusions). */
const BOPP_BLOCKED_QTY = [
  "15585",
  "15586",
  "15587",
  "15588",
  "15589",
  "15590",
  "15591",
  "15592",
];

/** In Sets Of — only visible when Bundling = Shrink Wrapping. */
const IN_SETS_OF = [
  {
    value: "123197",
    label: "25",
    sortOrder: 0,
    blockedQty: [],
  },
  {
    value: "123198",
    label: "50",
    sortOrder: 1,
    blockedQty: ["15578", "15580", "15582"], // 25, 75, 125
  },
];

const FEATURES_HTML = `<ul>
<li>Choose from durable BOPP or Vinyl built for outdoor exposure</li>
<li>Weather-resistant materials with long-lasting adhesion</li>
<li>Available in standard &amp; custom shapes and sizes</li>
<li>Full-color printing for bold, high-visibility designs</li>
<li>Order Quantities as low as 25 stickers</li>
<li>Printing as fast as 1 business day</li>
</ul>
`;

const DESCRIPTION = `${FEATURES_HTML}
<p>Turn traffic into impressions with custom vinyl bumper stickers. Whether you are promoting a political campaign, showing school spirit, or advertising your small business, our stickers are built to withstand the rigors of the road. Printed on 4 mil. white vinyl with a permanent all-purpose adhesive, these stickers stay attached through rain, wind, and car washes.</p>
<h2>Why Choose High-Gloss Vinyl for Your Vehicle?</h2>
<p>We use 4 mil. White Vinyl High Gloss (UV) for all bumper sticker orders. This premium material is specifically engineered for outdoor exposure.</p>
<ul>
<li><strong>Weather-Resistant and Waterproof Durability:</strong> Your design is protected against moisture and harsh weather conditions. The material resists tearing and peeling, ensuring your message stays intact.</li>
<li><strong>High-Gloss Finish for Maximum Visibility:</strong> The UV-resistant high-gloss coating protects your colors from fading under the sun while adding a shiny, reflective finish that catches the eye of drivers behind you.</li>
</ul>
<h2>Choosing the Right Shape and Size</h2>
<p>We offer standard and custom sizes to fit any design requirement.</p>
<ul>
<li><strong>Rectangles:</strong> The classic bumper sticker shape.</li>
<li><strong>6" x 2":</strong> The industry standard. Compact enough for any bumper but large enough for text.</li>
<li><strong>10" x 3":</strong> Ideal for longer political slogans or website URLs.</li>
<li><strong>Squares:</strong> A modern alternative for logos and icons.</li>
<li><strong>3" x 3" to 4" x 4":</strong> Perfect for school mascots or square business logos.</li>
</ul>
<h2>Popular Uses for Custom Bumper Stickers</h2>
<ul>
<li><strong>Political Campaigns:</strong> Distribute durable stickers to supporters to boost name recognition during election season.</li>
<li><strong>Business Fleet Branding:</strong> Apply your logo and phone number to delivery vans and company cars for cost-effective mobile advertising.</li>
<li><strong>School Spirit:</strong> Honor Student and university mascot stickers are a staple for parents and alumni.</li>
<li><strong>Promotional Merch:</strong> Bands and lifestyle brands use stickers as low-cost merchandise for fans.</li>
</ul>`;

const FAQS = [
  {
    question: "Do you offer a proof before printing?",
    answer:
      'Yes. We offer a free file check. You can upload your artwork and select "Wait for a PDF Proof" during checkout. We will email you a PDF proof to review for errors or alignment issues before we begin production.',
  },
  {
    question: "Are these bumper stickers waterproof?",
    answer:
      "Yes. We print on 4 mil. white vinyl which is fully waterproof and weather-resistant. The UV-resistant coating also prevents the ink from fading or running when exposed to rain or sunlight.",
  },
  {
    question: "Will the sticker damage my car paint?",
    answer:
      "Our bumper stickers use a permanent, all-purpose adhesive. While they are safe for most factory-cured vehicle paint jobs, they are designed to stay in place permanently. If you are concerned about potential residue upon removal years later, we recommend applying the sticker to the vehicle's rear window glass instead of the painted bumper.",
  },
  {
    question: "Can I remove and reuse the sticker?",
    answer:
      "No. These stickers are intended for one-time application. The permanent adhesive makes them difficult to remove once cured, and they cannot be reapplied. For a reusable option, please check our Car Magnets.",
  },
  {
    question: "How fast can you print my order?",
    answer:
      "We offer a printing turnaround time as fast as 1 business day. This means if your press-ready file is uploaded and approved by our cutoff time, we will print it and have it ready for shipping within 24 hours.",
  },
];

const GROUP_ORDER = [
  "attr3",
  "attr1",
  "attr4",
  "attr400",
  "attr635",
  "attr5",
  "attr6",
];

const DEFAULTS = {
  attr3: SIZE_DEFAULT,
  attr1: MATERIAL_DEFAULT,
  attr4: SIDES_DEFAULT,
  attr400: BUNDLING_DEFAULT,
  attr635: SETS_DEFAULT,
  attr5: QTY_DEFAULT,
  attr6: TURNAROUND_DEFAULT,
};

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...value }
    : {};
}

async function ensureInSetsOfGroup(product) {
  let group = product.optionGroups.find((item) => item.key === "attr635");
  if (group) return group;

  group = await prisma.productOptionGroup.create({
    data: {
      productId: product.id,
      key: "attr635",
      label: "In Sets Of",
      uiType: "SELECT",
      required: true,
      sortOrder: 4,
      meta: {
        defaultsByProduct: { [PRODUCT_ID]: SETS_DEFAULT },
        hideRulesByProduct: {
          // Hide unless Bundling = Shrink Wrapping (UPrinting rule).
          [PRODUCT_ID]: [{ attr400: BUNDLING_DEFAULT }],
        },
        keepWhenHidden: true,
      },
      values: {
        create: IN_SETS_OF.map((option) => ({
          label: option.label,
          value: option.value,
          priceMod: 1,
          sortOrder: option.sortOrder,
          meta: {
            default: option.value === SETS_DEFAULT,
            uprintingOptionId: option.value,
            allowedLinkedValues: [PRODUCT_ID],
            exclusionRulesByProduct: {
              [PRODUCT_ID]: option.blockedQty.map((qty) => ({ attr5: qty })),
            },
          },
        })),
      },
    },
    include: { values: true },
  });
  return group;
}

async function main() {
  let product = await prisma.product.findUnique({
    where: { slug: SLUG },
    include: { optionGroups: { include: { values: true } } },
  });
  if (!product) throw new Error(`Product ${SLUG} not found`);

  await ensureInSetsOfGroup(product);
  product = await prisma.product.findUnique({
    where: { slug: SLUG },
    include: { optionGroups: { include: { values: true } } },
  });

  await prisma.product.update({
    where: { id: product.id },
    data: {
      pricingSourceUrl: SOURCE,
      shortDescription:
        "Choose from durable BOPP or Vinyl built for outdoor exposure. Weather-resistant, full-color, quantities as low as 25, printing as fast as 1 business day.",
      description: DESCRIPTION,
      faqs: FAQS,
      basePrice: 30.99,
      deliveryDays: 3,
    },
  });

  const featuredByValue = new Map(
    FEATURED_SIZES.map((item) => [item.value, item]),
  );

  for (const [index, key] of GROUP_ORDER.entries()) {
    const group = product.optionGroups.find((item) => item.key === key);
    if (!group) continue;

    const meta = asObject(group.meta);
    const defaultsByProduct = asObject(meta.defaultsByProduct);
    defaultsByProduct[PRODUCT_ID] = DEFAULTS[key];
    meta.defaultsByProduct = defaultsByProduct;

    let label = group.label;
    if (key === "attr1") label = "Material";
    if (key === "attr6") label = "Printing Time";
    if (key === "attr635") label = "In Sets Of";

    if (key === "attr635") {
      meta.hideRulesByProduct = {
        [PRODUCT_ID]: [{ attr400: BUNDLING_DEFAULT }],
      };
      meta.keepWhenHidden = true;
    }

    if (key === "attr4") {
      // Keep as dropdown even with a single value (UPrinting style).
      meta.forceSelect = true;
    }

    await prisma.productOptionGroup.update({
      where: { id: group.id },
      data: {
        sortOrder: index,
        label,
        meta,
      },
    });

    if (key === "attr3") {
      for (const value of group.values) {
        const featured = featuredByValue.get(value.value);
        const valueMeta = asObject(value.meta);
        if (featured) {
          delete valueMeta.uiHidden;
          valueMeta.optionGroup = featured.group;
          valueMeta.default = featured.value === SIZE_DEFAULT;
          await prisma.productOptionValue.update({
            where: { id: value.id },
            data: {
              label: featured.label,
              sortOrder: featured.sortOrder,
              meta: valueMeta,
            },
          });
        } else {
          valueMeta.uiHidden = true;
          delete valueMeta.optionGroup;
          valueMeta.default = false;
          await prisma.productOptionValue.update({
            where: { id: value.id },
            data: {
              sortOrder: 100 + value.sortOrder,
              meta: valueMeta,
            },
          });
        }
      }
    }

    if (key === "attr1") {
      for (const value of group.values) {
        const nextLabel = MATERIAL_LABELS[value.value] ?? value.label;
        const valueMeta = asObject(value.meta);
        valueMeta.default = value.value === MATERIAL_DEFAULT;
        valueMeta.displayLabel = nextLabel;
        valueMeta.rawLabel = valueMeta.rawLabel ?? value.label;
        if (value.value === "1833676") {
          valueMeta.exclusionRulesByProduct = {
            [PRODUCT_ID]: BOPP_BLOCKED_QTY.map((qty) => ({ attr5: qty })),
          };
        }
        await prisma.productOptionValue.update({
          where: { id: value.id },
          data: {
            label: nextLabel,
            meta: valueMeta,
          },
        });
      }
    }

    if (key === "attr635") {
      const existingByValue = new Map(
        group.values.map((value) => [value.value, value]),
      );
      for (const option of IN_SETS_OF) {
        const valueMeta = {
          default: option.value === SETS_DEFAULT,
          uprintingOptionId: option.value,
          allowedLinkedValues: [PRODUCT_ID],
          exclusionRulesByProduct: {
            [PRODUCT_ID]: option.blockedQty.map((qty) => ({ attr5: qty })),
          },
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
    }

    if (
      key === "attr5" ||
      key === "attr6" ||
      key === "attr400" ||
      key === "attr4"
    ) {
      for (const value of group.values) {
        const valueMeta = asObject(value.meta);
        valueMeta.default = value.value === DEFAULTS[key];
        await prisma.productOptionValue.update({
          where: { id: value.id },
          data: { meta: valueMeta },
        });
      }
    }
  }

  console.log(
    `Updated ${SLUG}: In Sets Of (shows on Shrink Wrapping), Material/BOPP qty rules, featured sizes`,
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
