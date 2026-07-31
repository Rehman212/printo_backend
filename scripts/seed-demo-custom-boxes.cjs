const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DESCRIPTION = `
<h1>Custom Product Boxes for Brands That Ship</h1>
<p>Protect every order with <strong>custom printed product boxes</strong> that look sharp on arrival and hold up in transit. Choose a style below — mailer, product, or shipping — and configure size, material, and quantity in seconds.</p>
<blockquote>With one custom box, you can brand the unboxing experience and cut packaging waste.</blockquote>
<h2>Why Printoe boxes</h2>
<ul>
  <li>Full-color CMYK printing inside and out</li>
  <li>Recycled kraft and white SBS stocks</li>
  <li>Free artwork preflight on every order</li>
  <li>Rush turnaround available for launches</li>
</ul>
<h3>File tips</h3>
<p>Upload PDF, AI, or EPS with bleed. We check fonts, resolution, and dielines before print.</p>
`.trim();

async function main() {
  const category =
    (await prisma.category.findFirst({ where: { slug: "apparel" } })) ||
    (await prisma.category.findFirst({ where: { slug: "packaging" } })) ||
    (await prisma.category.findFirst({ where: { slug: "boxes" } })) ||
    (await prisma.category.findFirst());

  if (!category) {
    throw new Error("No category found. Seed categories first.");
  }

  const slug = "demo-custom-boxes";
  const faqs = [
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
        "Absolutely. Switch tabs or options anytime — the printing cost updates instantly.",
    },
    {
      question: "What is the minimum order?",
      answer: "Most box styles start at 25 units. Volume discounts apply at higher qty.",
    },
  ];

  const productTabs = [
    {
      id: "tab_mailer",
      label: "Mailer Boxes",
      price: 18.5,
      fields: [
        {
          id: "field_mailer_size",
          label: "Box size",
          type: "select",
          options: ["6×6×2", "8×6×3 | 3", "10×8×4 | 6", "12×10×5 | 10"],
          helpText: "Outside dimensions in inches",
        },
        {
          id: "field_mailer_stock",
          label: "Material",
          type: "select",
          options: ["Kraft E-flute", "White E-flute | 2.5", "Premium white B-flute | 5"],
        },
        {
          id: "field_mailer_qty",
          label: "Quantity",
          type: "select",
          options: ["25", "50 | 8", "100 | 18", "250 | 40"],
          helpText: "Higher qty = volume pricing baked into add-ons",
        },
      ],
    },
    {
      id: "tab_product",
      label: "Product Boxes",
      price: 24.0,
      fields: [
        {
          id: "field_prod_style",
          label: "Box style",
          type: "select",
          options: ["Tuck end", "Auto-lock bottom | 4", "Magnetic closure | 12"],
        },
        {
          id: "field_prod_size",
          label: "Size",
          type: "select",
          options: ["Small", "Medium | 5", "Large | 11", "X-Large | 18"],
        },
        {
          id: "field_prod_print",
          label: "Print sides",
          type: "select",
          options: ["Outside only", "Outside + inside | 7"],
        },
        {
          id: "field_prod_qty",
          label: "Quantity",
          type: "select",
          options: ["50", "100 | 10", "250 | 28", "500 | 55"],
        },
      ],
    },
    {
      id: "tab_shipping",
      label: "Shipping Boxes",
      price: 32.75,
      fields: [
        {
          id: "field_ship_strength",
          label: "Board strength",
          type: "select",
          options: ["32 ECT", "44 ECT | 6", "Double wall | 14"],
        },
        {
          id: "field_ship_size",
          label: "Dimensions",
          type: "select",
          options: ["12×9×6", "16×12×8 | 8", "18×14×12 | 15", "24×18×18 | 25"],
        },
        {
          id: "field_ship_print",
          label: "Branding",
          type: "select",
          options: ["1-color logo", "Full color | 9", "Full color + tape | 16"],
        },
        {
          id: "field_ship_qty",
          label: "Quantity",
          type: "select",
          options: ["25", "50 | 12", "100 | 30"],
        },
      ],
    },
    {
      id: "tab_rigid",
      label: "Rigid Boxes",
      price: 45.0,
      fields: [
        {
          id: "field_rigid_lid",
          label: "Lid style",
          type: "select",
          options: ["Lift-off lid", "Hinged | 8", "Drawer | 15"],
        },
        {
          id: "field_rigid_finish",
          label: "Finish",
          type: "select",
          options: ["Matte soft-touch", "Gloss lamination | 4", "Spot UV | 9"],
        },
        {
          id: "field_rigid_insert",
          label: "Insert",
          type: "select",
          options: ["None", "Foam insert | 6", "Custom tray | 14"],
        },
        {
          id: "field_rigid_qty",
          label: "Quantity",
          type: "select",
          options: ["25", "50 | 20", "100 | 48"],
        },
      ],
    },
  ];

  const imageUrl =
    "https://images.unsplash.com/photo-1607083206869-4c79714e0e0a?w=1200&q=80";

  const data = {
    name: "Demo Custom Boxes",
    description: DESCRIPTION,
    shortDescription:
      "Test product with 4 tabs — Mailer, Product, Shipping & Rigid — each with its own price and fields.",
    seoTitle: "Demo Custom Boxes | Printoe Test Product",
    seoDescription:
      "UPrinting-style demo: switch Mailer, Product, Shipping, or Rigid tabs and watch price update live.",
    basePrice: 18.5,
    deliveryDays: 3,
    badge: "Demo",
    imageUrl,
    galleryUrls: [imageUrl],
    featured: true,
    active: true,
    categoryId: category.id,
    faqs,
    productTabs,
  };

  const product = await prisma.product.upsert({
    where: { slug },
    create: { slug, ...data },
    update: data,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        id: product.id,
        slug: product.slug,
        category: category.slug,
        tabs: productTabs.map((t) => ({ label: t.label, price: t.price })),
        url: `/products/${product.slug}`,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
