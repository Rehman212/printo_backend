import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "address-labels-return-address-labels";
const SOURCE = "https://www.uprinting.com/return-address-label-printing.html";
const SHAPES =
  "https://staticecp.uprinting.com/6955/700x700/CTS_Shapes_without_lollipop.jpg";

const DIE = "7";
const ROLL = "33";
const SHEET = "1508";

const DESCRIPTION = `<ul>
<li>3 label formats to choose from: singles, roll, sheet</li>
<li>Available in custom shape &amp; 8 standard shapes</li>
<li>A variety of paper &amp; waterproof materials available</li>
<li>Multiple sizes for return addresses, mailing labels, and packaging</li>
<li>Printing turnaround as fast as 1 business day</li>
</ul>
<h2>Save Time with Personalized Return Address Labels</h2>
<p>Skip the hassle of handwriting a mountain of letters. Custom return address labels allow you to quickly peel and stick your address onto packages, invitations, and everyday correspondence. Whether you are sending out hundreds of corporate mailers or addressing annual holiday cards, personalized return address stickers add a polished finishing touch while saving you hours of manual work.</p>
<h3>Professional Custom Mailing Labels for Business</h3>
<p>Establish your brand's authority from the moment your package arrives. Print your company name, return address, and logo on high-quality paper or waterproof BOPP materials.</p>
<h3>Elegant Address Stickers for Weddings &amp; Holidays</h3>
<p>Return address labels aren't just for business—they are an essential part of personal stationery. Coordinate your labels with your event's theme by uploading your own elegant, minimalist, rustic, botanical, or monogrammed address labels. They are perfect for:</p>
<ul>
<li>Wedding invitations and Save-the-Dates</li>
<li>Holiday and Christmas cards</li>
<li>Graduation announcements</li>
<li>Baby shower invitations and Thank You notes</li>
<li>Everyday bill-paying and correspondence</li>
</ul>
<h2>Choose the Right Return Address Label Format</h2>
<p>We offer three distinct formats to suit your order volume and application method.</p>
<h3>Roll Labels for Bulk Mailing</h3>
<p>Roll labels are ideal for fast, high-volume application. Available in quantities of 250 or more, these labels are wound on a standard core and can be applied quickly by hand or with a label gun.</p>
<h3>Sheet Labels for Personal Stationery</h3>
<p>Sheet labels print a specific quantity of labels onto a single page. This format is highly recommended for smaller, personal mailing batches.</p>
<h3>Cut-to-Size Singles for Custom Applications</h3>
<p>Ordered in quantities below 250 pieces, cut-to-size singles are delivered as individually cut labels. These are printed quickly—ready to ship in as little as 1 business day—and are ideal for small, highly customized mailings.</p>`;

const FAQS = [
  {
    question: "What is the best sticker format for return address labels?",
    answer:
      "If you are sending a small batch of personal mail, sheet labels or cut-to-size singles are the most cost-effective and convenient. If you are a business or sending bulk event invitations (250+ pieces), roll labels are the best choice as they can be rapidly applied with a label gun.",
  },
  {
    question: "Do you offer waterproof materials for custom address labels?",
    answer:
      "Yes. You can print on waterproof BOPP for your address labels. For orders of 250 and above, the material remains waterproof in both hot and cold water. For smaller quantities (starting at 25 pieces), the label is waterproof in cold or tap water but may peel if submerged in hot water.",
  },
  {
    question: "Can I use return address labels as envelope seals?",
    answer:
      "Yes. Many customers order circle, oval, or starburst-shaped return address labels and apply them directly over the back flap of the envelope.",
  },
  {
    question: "Can I print die-cut or irregularly shaped roll labels?",
    answer:
      'Yes. After selecting the "Roll" format, choose "Custom" under the shape options, then set width and height. Include a dieline in your artwork file.',
  },
  {
    question: "Can I upload my own design file to print address labels?",
    answer:
      "Yes. Upload JPG, PNG, TIF, AI, or PUB files. For best quality, submit CMYK artwork at 300dpi with a .125\" bleed on each side.",
  },
];

const GROUP_ORDER = [
  "attr0",
  "attr10",
  "attr3",
  "attr765",
  "attr1",
  "attr25",
  "attr1335",
  "attr17",
  "attr948",
  "attr400",
  "attr27",
  "attr5",
  "attr853",
  "attr6",
];

/** Verified against UPrinting Address Labels live calculator. */
const DEFAULTS = {
  [DIE]: {
    attr10: "67708",
    attr3: "15362",
    attr1: "1854158",
    attr17: "1854161",
    attr400: "118944",
    attr5: "324",
    attr6: "140228",
  },
  [ROLL]: {
    attr10: "1380",
    attr3: "1384",
    attr25: "15477",
    attr17: "1418",
    attr27: "1420",
    attr5: "1426",
    attr6: "1440",
  },
  [SHEET]: {
    attr10: "1076409",
    attr3: "86232",
    attr765: "86237",
    attr1335: "871108",
    attr1: "1671122",
    attr853: "86797",
    attr5: "86272",
    attr6: "86793",
  },
};

const ALWAYS = [{}];

/**
 * Per-type visibility matching UPrinting Address Labels.
 * keepWhenHidden: still sent to live pricing when UI-hidden.
 */
const GROUP_RULES = {
  attr10: {
    label: "Shape",
    hide: { [SHEET]: ALWAYS },
    keepWhenHidden: true,
  },
  attr3: { label: "Size" },
  attr765: {
    label: "Sheet Size",
    hide: { [DIE]: ALWAYS, [ROLL]: ALWAYS },
  },
  attr1: {
    label: "Material",
    hide: { [ROLL]: ALWAYS },
  },
  attr25: {
    label: "Material",
    hide: { [DIE]: ALWAYS, [SHEET]: ALWAYS },
  },
  attr1335: {
    label: "Imprint Area",
    hide: { [DIE]: ALWAYS, [ROLL]: ALWAYS, [SHEET]: ALWAYS },
    keepWhenHidden: true,
  },
  attr17: {
    label: "Finish",
    hide: { [SHEET]: ALWAYS },
  },
  attr948: {
    label: "White Ink",
    hide: { [DIE]: ALWAYS, [ROLL]: ALWAYS, [SHEET]: ALWAYS },
    keepWhenHidden: true,
  },
  attr400: {
    label: "Bundling",
    hide: { [ROLL]: ALWAYS, [SHEET]: ALWAYS },
  },
  attr27: {
    label: "Unwind Direction",
    hide: { [DIE]: ALWAYS, [SHEET]: ALWAYS },
  },
  attr5: {
    label: "Quantity",
    hide: { [SHEET]: ALWAYS },
    keepWhenHidden: true,
  },
  attr853: {
    label: "Number of Sheets",
    hide: { [DIE]: ALWAYS, [ROLL]: ALWAYS },
  },
  attr6: { label: "Printing Time" },
};

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...value }
    : {};
}

function cleanDieCutMaterialLabel(label) {
  return String(label)
    .replace(/\s*-\s*SP\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSheetMaterialLabel(label) {
  if (/high\s*gloss/i.test(label)) return "High Gloss White Paper";
  if (/sheet\s*labels/i.test(label) || /uncoated/i.test(label)) {
    return "Uncoated White Paper";
  }
  return label;
}

async function main() {
  const product = await prisma.product.findUnique({
    where: { slug: SLUG },
    include: { optionGroups: { include: { values: true } } },
  });
  if (!product) throw new Error(`Product ${SLUG} not found`);

  const gallery = [
    SHAPES,
    ...product.galleryUrls.filter((url) => url !== SHAPES),
  ];

  await prisma.product.update({
    where: { id: product.id },
    data: {
      description: DESCRIPTION,
      shortDescription:
        "3 label formats to choose from: singles, roll, sheet. Custom shape and 8 standard shapes, paper and waterproof materials, as fast as 1 business day.",
      imageUrl: SHAPES,
      galleryUrls: gallery,
      pricingSourceUrl: SOURCE,
      faqs: FAQS,
    },
  });

  for (const [index, key] of GROUP_ORDER.entries()) {
    const group = product.optionGroups.find((item) => item.key === key);
    if (!group) continue;

    const meta = asObject(group.meta);
    const defaultsByProduct = asObject(meta.defaultsByProduct);
    const hideRulesByProduct = asObject(meta.hideRulesByProduct);
    const rules = GROUP_RULES[key] ?? {};

    for (const [productId, defaults] of Object.entries(DEFAULTS)) {
      if (defaults[key]) defaultsByProduct[productId] = defaults[key];
    }

    // Reset then apply current hide map so stale empty arrays don't linger.
    for (const productId of [DIE, ROLL, SHEET]) {
      delete hideRulesByProduct[productId];
    }
    if (rules.hide) {
      Object.assign(hideRulesByProduct, rules.hide);
    }

    meta.defaultsByProduct = defaultsByProduct;
    meta.hideRulesByProduct = hideRulesByProduct;
    if (rules.keepWhenHidden) meta.keepWhenHidden = true;
    else delete meta.keepWhenHidden;

    await prisma.productOptionGroup.update({
      where: { id: group.id },
      data: {
        sortOrder: index,
        label: rules.label ?? group.label,
        meta,
      },
    });

    if (key === "attr1") {
      for (const value of group.values) {
        const valueMeta = asObject(value.meta);
        const allowed = Array.isArray(valueMeta.allowedLinkedValues)
          ? valueMeta.allowedLinkedValues.map(String)
          : [];
        let nextLabel = value.label;
        if (allowed.includes(SHEET) || /sheet\s*labels/i.test(value.label)) {
          nextLabel = cleanSheetMaterialLabel(value.label);
        } else if (allowed.includes(DIE) || /-\s*SP\b/i.test(value.label)) {
          nextLabel = cleanDieCutMaterialLabel(value.label);
        }
        if (nextLabel === value.label && valueMeta.displayLabel === nextLabel) {
          continue;
        }
        await prisma.productOptionValue.update({
          where: { id: value.id },
          data: {
            label: nextLabel,
            meta: {
              ...valueMeta,
              displayLabel: nextLabel,
              rawLabel: valueMeta.rawLabel ?? value.label,
            },
          },
        });
      }
    }
  }

  // Die-Cut is the Address Labels landing default.
  const typeGroup = product.optionGroups.find((item) => item.key === "attr0");
  if (typeGroup) {
    for (const value of typeGroup.values) {
      const valueMeta = asObject(value.meta);
      valueMeta.default = value.value === DIE;
      await prisma.productOptionValue.update({
        where: { id: value.id },
        data: { meta: valueMeta },
      });
    }
  }

  console.log(
    `Updated ${SLUG}: Die-Cut/Roll/Sheet defaults, hides, material labels`,
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
