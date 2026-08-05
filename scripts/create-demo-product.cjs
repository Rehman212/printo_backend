/**
 * Creates (or refreshes) a demo product that exercises every Add Product feature:
 * SEO fields, featured image + gallery, rich description, FAQs, product tabs
 * (select/text/number fields) and storefront option groups (SELECT/CARDS/NUMBER).
 *
 * Usage (from printo_backend):
 *   node scripts/create-demo-product.cjs
 *
 * Runs against DATABASE_URL from .env unless TARGET_DATABASE_URL is set.
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

function loadEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}

loadEnvFile();

const url = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL (.env) or TARGET_DATABASE_URL");
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url } } });

const SLUG = "demo-full-feature-product";

const IMAGES = [
  "https://images.unsplash.com/photo-1589998059171-988d887df646?w=1200&q=80",
  "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200&q=80",
  "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1200&q=80",
  "https://images.unsplash.com/photo-1524234107056-1c1f48f64ab8?w=1200&q=80",
  "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&q=80",
];

/** Featured image is IMAGES[0]; the rest become gallery thumbnails. */
const GALLERY = IMAGES;

const FAQS = [
  {
    question: "What file formats do you accept?",
    answer:
      "PDF, AI, EPS, and high-res PNG/JPG. PDF with bleed and embedded fonts is preferred.",
  },
  {
    question: "Do you check my artwork for free?",
    answer:
      "Yes. Every order includes a complimentary preflight review before production.",
  },
  {
    question: "Can I change options after calculating?",
    answer:
      "Absolutely. Update any option and the printing cost updates instantly.",
  },
  {
    question: "How fast is rush turnaround?",
    answer:
      "1 business day production is available on most sizes for a rush fee.",
  },
];

const PRODUCT_TABS = [
  {
    id: "tab_standard",
    label: "Standard Print",
    iconUrl: "",
    price: 24.5,
    fields: [
      {
        id: "field_std_size",
        label: "Trim Size",
        type: "select",
        options: ['3.5" x 2"', '2" x 3.5"', '3.5" x 2" Rounded'],
        helpText: "Finished size after cutting.",
      },
      {
        id: "field_std_notes",
        label: "Special Instructions",
        type: "text",
        helpText: "Anything our prepress team should know.",
      },
      {
        id: "field_std_qty",
        label: "Extra Proof Copies",
        type: "number",
        helpText: "Physical proofs mailed before the full run.",
      },
    ],
  },
  {
    id: "tab_premium",
    label: "Premium Finish",
    iconUrl: "",
    price: 39.9,
    fields: [
      {
        id: "field_prem_foil",
        label: "Foil Colour",
        type: "select",
        options: ["Gold", "Silver", "Rose Gold", "Holographic"],
        helpText: "Metallic foil stamped on the front.",
      },
      {
        id: "field_prem_coverage",
        label: "Foil Coverage %",
        type: "number",
        helpText: "Approximate area covered by foil.",
      },
    ],
  },
];

const OPTION_GROUPS = [
  {
    key: "size",
    label: "Size",
    uiType: "SELECT",
    helpText: "Finished trim size.",
    values: [
      { label: '3.5" × 2" (Standard)', value: "3-5x2", priceMod: 1 },
      { label: '3.5" × 2" Rounded', value: "3-5x2-rounded", priceMod: 1.08 },
      { label: '2" × 3.5" (Vertical)', value: "2x3-5", priceMod: 1 },
    ],
  },
  {
    key: "material",
    label: "Material / Stock",
    uiType: "CARDS",
    helpText: "Thicker stock feels more premium.",
    values: [
      { label: "14pt Cardstock", value: "14pt", priceMod: 1 },
      { label: "16pt Soft Touch", value: "16pt-soft", priceMod: 1.22 },
      { label: "18pt Ultra Thick", value: "18pt", priceMod: 1.45 },
    ],
  },
  {
    key: "finish",
    label: "Finish",
    uiType: "SELECT",
    helpText: "Surface coating applied after printing.",
    values: [
      { label: "Gloss", value: "gloss", priceMod: 1 },
      { label: "Matte", value: "matte", priceMod: 1.05 },
      { label: "Soft Touch", value: "soft-touch", priceMod: 1.18 },
      { label: "Spot UV", value: "spot-uv", priceMod: 1.32 },
    ],
  },
  {
    key: "printed_side",
    label: "Printed Side",
    uiType: "CARDS",
    helpText: "Single or double sided printing.",
    values: [
      { label: "Front Only", value: "front", priceMod: 1 },
      { label: "Front and Back", value: "both", priceMod: 1.15 },
    ],
  },
  {
    key: "quantity",
    label: "Quantity",
    uiType: "SELECT",
    helpText: "Higher qty = volume discount.",
    values: [
      { label: "100", value: "100", priceMod: 1 },
      { label: "250", value: "250", priceMod: 0.9 },
      { label: "500", value: "500", priceMod: 0.82 },
      { label: "1,000", value: "1000", priceMod: 0.74 },
    ],
  },
  {
    key: "proof_copies",
    label: "Printed Proof Copies",
    uiType: "NUMBER",
    helpText: "Number of physical proofs mailed to you.",
    values: [
      { label: "0", value: "0", priceMod: 1 },
      { label: "1", value: "1", priceMod: 1.03 },
      { label: "2", value: "2", priceMod: 1.06 },
    ],
  },
  {
    key: "turnaround",
    label: "Printing Time",
    uiType: "SELECT",
    helpText: "Faster turnaround = rush fee.",
    values: [
      { label: "5 Business Days", value: "5-day", priceMod: 0.92 },
      { label: "3 Business Days", value: "3-day", priceMod: 1 },
      { label: "1 Business Day", value: "1-day", priceMod: 1.3 },
    ],
  },
];

const DESCRIPTION = `
<h3>Demo product for QA</h3>
<p>This product exists to exercise <strong>every</strong> field in the admin
Add Product form: SEO metadata, featured image, gallery, rich text description,
FAQs, product tabs and storefront option groups.</p>
<ul>
  <li>Seven option fields covering dropdown, cards and number types</li>
  <li>Two product tabs with select / text / number inputs</li>
  <li>Four FAQs rendered on the storefront FAQ tab</li>
</ul>
<p>Safe to delete any time from <em>Admin → Products</em>.</p>
`.trim();

async function pickCategory() {
  const preferred = ["business-cards", "stickers", "flyers"];
  for (const slug of preferred) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (cat) return cat;
  }
  const first = await prisma.category.findFirst({ orderBy: { name: "asc" } });
  if (first) return first;
  return prisma.category.create({
    data: {
      name: "Business Cards",
      slug: "business-cards",
      description: "Business Cards products",
    },
  });
}

async function main() {
  const category = await pickCategory();
  console.log(`Using category: ${category.name} (${category.slug})`);

  const data = {
    name: "Demo Full-Feature Product",
    slug: SLUG,
    description: DESCRIPTION,
    shortDescription:
      "QA demo card with every admin field filled: gallery, FAQs, tabs and 7 option groups.",
    seoTitle: "Demo Full-Feature Product | Printoe",
    seoDescription:
      "Internal QA product showcasing gallery images, FAQs, product tabs and all storefront option field types.",
    basePrice: 24.5,
    compareAt: 39.9,
    deliveryDays: 3,
    badge: "Demo",
    imageUrl: IMAGES[0],
    galleryUrls: GALLERY,
    faqs: FAQS,
    productTabs: PRODUCT_TABS,
    featured: true,
    active: true,
    categoryId: category.id,
  };

  const product = await prisma.product.upsert({
    where: { slug: SLUG },
    update: data,
    create: data,
  });

  // Replace option groups so re-running stays idempotent
  await prisma.productOptionGroup.deleteMany({
    where: { productId: product.id },
  });

  for (let gi = 0; gi < OPTION_GROUPS.length; gi++) {
    const g = OPTION_GROUPS[gi];
    const group = await prisma.productOptionGroup.create({
      data: {
        productId: product.id,
        key: g.key,
        label: g.label,
        uiType: g.uiType,
        required: true,
        sortOrder: gi,
        helpText: g.helpText ?? null,
      },
    });
    for (let vi = 0; vi < g.values.length; vi++) {
      const v = g.values[vi];
      await prisma.productOptionValue.create({
        data: {
          groupId: group.id,
          label: v.label,
          value: v.value,
          priceMod: v.priceMod,
          sortOrder: vi,
        },
      });
    }
  }

  console.log("Demo product ready:");
  console.log(`  name:    ${product.name}`);
  console.log(`  url:     /products/${product.slug}`);
  console.log(`  gallery: ${GALLERY.length} images`);
  console.log(`  faqs:    ${FAQS.length}`);
  console.log(`  tabs:    ${PRODUCT_TABS.length}`);
  console.log(`  options: ${OPTION_GROUPS.length} groups`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
