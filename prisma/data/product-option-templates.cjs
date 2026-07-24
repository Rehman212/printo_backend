/**
 * UPrinting-style option groups by category + product-specific overrides.
 * Used by prisma/seed.ts to attach configurators to every catalog product.
 */

function qtyTurnaround(qtys, turns) {
  const defaultTurns = turns || [
    ['3 Business Days', '3-day', 1],
    ['1 Business Day', '1-day', 1.3],
    ['5 Business Days', '5-day', 0.92],
  ];
  return [
    {
      key: 'quantity',
      label: 'Quantity',
      uiType: 'SELECT',
      helpText: 'Higher qty = volume discount.',
      values: qtys.map(([label, value, priceMod]) => ({ label, value, priceMod })),
    },
    {
      key: 'turnaround',
      label: 'Printing Time',
      uiType: 'SELECT',
      helpText: 'Faster turnaround = rush fee.',
      values: defaultTurns.map(([label, value, priceMod]) => ({
        label,
        value,
        priceMod,
      })),
    },
  ];
}

function pack(sizeValues, materialValues, finishValues, qtys, extra = []) {
  return [
    ...extra,
    { key: 'size', label: 'Size', uiType: 'SELECT', values: sizeValues },
    {
      key: 'material',
      label: 'Material / Stock',
      uiType: 'SELECT',
      values: materialValues,
    },
    { key: 'finish', label: 'Finish', uiType: 'SELECT', values: finishValues },
    ...qtyTurnaround(qtys),
  ];
}

const CATEGORY_OPTION_TEMPLATES = {
  stickers: [
    {
      key: 'sticker_type',
      label: 'Sticker Type',
      uiType: 'CARDS',
      values: [
        { label: 'Die-Cut Singles', value: 'die-cut', priceMod: 1, meta: { icon: 'Scissors' } },
        { label: 'Roll', value: 'roll', priceMod: 1.05, meta: { icon: 'RefreshCw' } },
        { label: 'Sheet', value: 'sheet', priceMod: 0.95, meta: { icon: 'LayoutGrid' } },
        { label: 'Kiss-Cut Singles', value: 'kiss-cut', priceMod: 1.08, meta: { icon: 'Square' } },
      ],
    },
    {
      key: 'shape',
      label: 'Shape',
      uiType: 'SELECT',
      values: [
        { label: 'Square / Rectangle', value: 'square-rectangle', priceMod: 1 },
        { label: 'Circle', value: 'circle', priceMod: 1.05 },
        { label: 'Oval', value: 'oval', priceMod: 1.06 },
        { label: 'Custom Contour', value: 'custom', priceMod: 1.18 },
      ],
    },
    {
      key: 'size',
      label: 'Size',
      uiType: 'SELECT',
      values: [
        { label: '2" × 2"', value: '2x2', priceMod: 1 },
        { label: '3" × 3"', value: '3x3', priceMod: 1.2 },
        { label: '4" × 4"', value: '4x4', priceMod: 1.45 },
      ],
    },
    {
      key: 'material',
      label: 'Material',
      uiType: 'SELECT',
      values: [
        { label: 'White Paper', value: 'white-paper', priceMod: 1 },
        { label: 'White Vinyl', value: 'white-vinyl', priceMod: 1.15 },
        { label: 'Clear Vinyl', value: 'clear-vinyl', priceMod: 1.25 },
        { label: 'Holographic', value: 'holographic', priceMod: 1.4 },
      ],
    },
    {
      key: 'finish',
      label: 'Finish',
      uiType: 'SELECT',
      values: [
        { label: 'Gloss Coating', value: 'gloss', priceMod: 1 },
        { label: 'Matte Coating', value: 'matte', priceMod: 1.05 },
        { label: 'No Coating', value: 'none', priceMod: 0.95 },
      ],
    },
    ...qtyTurnaround([
      ['250', '250', 1],
      ['500', '500', 0.92],
      ['1,000', '1000', 0.85],
      ['2,500', '2500', 0.78],
    ]),
  ],

  banners: pack(
    [
      { label: "2' × 4'", value: '2x4', priceMod: 1 },
      { label: "3' × 6'", value: '3x6', priceMod: 1.45 },
      { label: "4' × 8'", value: '4x8', priceMod: 2.1 },
    ],
    [
      { label: '13oz Vinyl', value: '13oz', priceMod: 1 },
      { label: '18oz Scrim', value: '18oz', priceMod: 1.2 },
      { label: 'Mesh', value: 'mesh', priceMod: 1.15 },
    ],
    [
      { label: 'Hemmed + Grommets', value: 'hem-grommets', priceMod: 1 },
      { label: 'Pole Pockets', value: 'pole-pockets', priceMod: 1.12 },
      { label: 'Hemmed Only', value: 'hemmed', priceMod: 0.95 },
    ],
    [
      ['1', '1', 1],
      ['2', '2', 0.95],
      ['5', '5', 0.88],
    ],
  ),

  'business-cards': pack(
    [
      { label: '3.5" × 2"', value: 'standard', priceMod: 1 },
      { label: '3.5" × 2" Rounded', value: 'rounded', priceMod: 1.08 },
      { label: 'Square 2.5"', value: 'square', priceMod: 1.12 },
    ],
    [
      { label: '14pt Gloss', value: '14pt-gloss', priceMod: 1 },
      { label: '14pt Matte', value: '14pt-matte', priceMod: 0.98 },
      { label: '16pt Soft Touch', value: '16pt-soft', priceMod: 1.15 },
      { label: '16pt Spot UV', value: '16pt-uv', priceMod: 1.25 },
    ],
    [
      { label: 'Gloss', value: 'gloss', priceMod: 1 },
      { label: 'Matte', value: 'matte', priceMod: 0.95 },
      { label: 'Soft Touch', value: 'soft-touch', priceMod: 1.1 },
      { label: 'Spot UV', value: 'spot-uv', priceMod: 1.2 },
    ],
    [
      ['100', '100', 1],
      ['250', '250', 0.9],
      ['500', '500', 0.82],
      ['1,000', '1000', 0.75],
    ],
    [
      {
        key: 'printed_side',
        label: 'Printed Side',
        uiType: 'SELECT',
        values: [
          { label: 'Front Only', value: 'front', priceMod: 1 },
          { label: 'Front and Back', value: 'both', priceMod: 1.15 },
        ],
      },
    ],
  ),

  flyers: pack(
    [
      { label: '8.5" × 11"', value: 'letter', priceMod: 1 },
      { label: '5.5" × 8.5"', value: 'half', priceMod: 0.75 },
      { label: '11" × 17"', value: 'tabloid', priceMod: 1.45 },
    ],
    [
      { label: '100lb Gloss Text', value: '100lb-gloss', priceMod: 1 },
      { label: '100lb Matte', value: '100lb-matte', priceMod: 1.05 },
      { label: '14pt Cardstock', value: '14pt', priceMod: 1.2 },
    ],
    [
      { label: 'Gloss', value: 'gloss', priceMod: 1 },
      { label: 'Matte', value: 'matte', priceMod: 1.05 },
      { label: 'No Coating', value: 'none', priceMod: 0.95 },
    ],
    [
      ['100', '100', 1],
      ['250', '250', 0.9],
      ['500', '500', 0.82],
      ['1,000', '1000', 0.75],
    ],
  ),

  brochures: [
    {
      key: 'fold',
      label: 'Fold Type',
      uiType: 'SELECT',
      values: [
        { label: 'Tri-Fold', value: 'tri-fold', priceMod: 1 },
        { label: 'Bi-Fold', value: 'bi-fold', priceMod: 0.95 },
        { label: 'Z-Fold', value: 'z-fold', priceMod: 1.08 },
      ],
    },
    ...pack(
      [
        { label: '8.5" × 11"', value: 'letter', priceMod: 1 },
        { label: '11" × 17"', value: 'tabloid', priceMod: 1.4 },
      ],
      [
        { label: '100lb Gloss Text', value: '100lb-gloss', priceMod: 1 },
        { label: '100lb Matte', value: '100lb-matte', priceMod: 1.05 },
      ],
      [
        { label: 'Gloss', value: 'gloss', priceMod: 1 },
        { label: 'Matte', value: 'matte', priceMod: 1.05 },
      ],
      [
        ['100', '100', 1],
        ['250', '250', 0.9],
        ['500', '500', 0.82],
      ],
    ),
  ],

  posters: pack(
    [
      { label: '11" × 17"', value: '11x17', priceMod: 1 },
      { label: '18" × 24"', value: '18x24', priceMod: 1.55 },
      { label: '24" × 36"', value: '24x36', priceMod: 2.2 },
    ],
    [
      { label: 'Semi-Gloss Paper', value: 'semi-gloss', priceMod: 1 },
      { label: 'Photo Paper', value: 'photo', priceMod: 1.25 },
      { label: 'Foam Board Mount', value: 'foam', priceMod: 1.8 },
    ],
    [
      { label: 'Gloss', value: 'gloss', priceMod: 1 },
      { label: 'Matte', value: 'matte', priceMod: 1.05 },
    ],
    [
      ['1', '1', 1],
      ['5', '5', 0.9],
      ['10', '10', 0.82],
      ['25', '25', 0.75],
    ],
  ),

  labels: [
    {
      key: 'label_type',
      label: 'Label Type',
      uiType: 'SELECT',
      values: [
        { label: 'Roll Labels', value: 'roll', priceMod: 1 },
        { label: 'Sheet Labels', value: 'sheet', priceMod: 0.95 },
        { label: 'Cut-to-size Singles', value: 'singles', priceMod: 1.05 },
      ],
    },
    ...pack(
      [
        { label: '2" × 1"', value: '2x1', priceMod: 1 },
        { label: '3" × 2"', value: '3x2', priceMod: 1.25 },
        { label: '4" × 2"', value: '4x2', priceMod: 1.45 },
      ],
      [
        { label: 'White Paper', value: 'paper', priceMod: 1 },
        { label: 'White Vinyl / BOPP', value: 'vinyl', priceMod: 1.2 },
        { label: 'Clear', value: 'clear', priceMod: 1.3 },
      ],
      [
        { label: 'Gloss', value: 'gloss', priceMod: 1 },
        { label: 'Matte', value: 'matte', priceMod: 1.05 },
      ],
      [
        ['250', '250', 1],
        ['500', '500', 0.9],
        ['1,000', '1000', 0.82],
        ['2,500', '2500', 0.75],
      ],
    ),
  ],

  packaging: pack(
    [
      { label: 'Small', value: 'small', priceMod: 1 },
      { label: 'Medium', value: 'medium', priceMod: 1.35 },
      { label: 'Large', value: 'large', priceMod: 1.7 },
    ],
    [
      { label: 'Kraft', value: 'kraft', priceMod: 1 },
      { label: 'White', value: 'white', priceMod: 1.15 },
      { label: 'Barrier Film', value: 'barrier', priceMod: 1.4 },
    ],
    [
      { label: 'Full Color Outside', value: 'outside', priceMod: 1 },
      { label: 'Inside + Outside', value: 'both', priceMod: 1.4 },
    ],
    [
      ['50', '50', 1],
      ['100', '100', 0.92],
      ['250', '250', 0.85],
    ],
  ),

  boxes: pack(
    [
      { label: 'Small Product Box', value: 'small', priceMod: 1 },
      { label: 'Medium Mailer Box', value: 'medium', priceMod: 1.4 },
      { label: 'Large Shipping Box', value: 'large', priceMod: 1.85 },
    ],
    [
      { label: 'E-Flute Corrugated', value: 'eflute', priceMod: 1 },
      { label: 'Cardstock Carton', value: 'cardstock', priceMod: 1.1 },
    ],
    [
      { label: 'Matte Laminate', value: 'matte', priceMod: 1 },
      { label: 'Gloss Laminate', value: 'gloss', priceMod: 1.05 },
      { label: 'Soft Touch', value: 'soft', priceMod: 1.2 },
    ],
    [
      ['50', '50', 1],
      ['100', '100', 0.9],
      ['250', '250', 0.82],
    ],
  ),

  apparel: [
    {
      key: 'garment',
      label: 'Garment',
      uiType: 'SELECT',
      values: [
        { label: 'Unisex Tee', value: 'tee', priceMod: 1 },
        { label: 'Hoodie', value: 'hoodie', priceMod: 1.8 },
        { label: 'Polo', value: 'polo', priceMod: 1.35 },
      ],
    },
    {
      key: 'size',
      label: 'Size',
      uiType: 'SELECT',
      values: [
        { label: 'S', value: 's', priceMod: 1 },
        { label: 'M', value: 'm', priceMod: 1 },
        { label: 'L', value: 'l', priceMod: 1 },
        { label: 'XL', value: 'xl', priceMod: 1.05 },
        { label: '2XL', value: '2xl', priceMod: 1.1 },
      ],
    },
    {
      key: 'print_method',
      label: 'Print Method',
      uiType: 'SELECT',
      values: [
        { label: 'Screen Print', value: 'screen', priceMod: 1 },
        { label: 'DTG', value: 'dtg', priceMod: 1.15 },
        { label: 'Embroidery', value: 'embroidery', priceMod: 1.4 },
      ],
    },
    ...qtyTurnaround([
      ['12', '12', 1],
      ['24', '24', 0.95],
      ['48', '48', 0.9],
      ['100', '100', 0.85],
    ]),
  ],

  'promotional-products': pack(
    [
      { label: 'Standard', value: 'standard', priceMod: 1 },
      { label: 'Premium', value: 'premium', priceMod: 1.35 },
    ],
    [
      { label: 'Default Material', value: 'default', priceMod: 1 },
      { label: 'Premium Material', value: 'premium', priceMod: 1.25 },
    ],
    [
      { label: '1-Color Imprint', value: '1color', priceMod: 1 },
      { label: 'Full Color', value: 'full', priceMod: 1.3 },
    ],
    [
      ['50', '50', 1],
      ['100', '100', 0.92],
      ['250', '250', 0.85],
      ['500', '500', 0.78],
    ],
  ),

  'marketing-materials': pack(
    [
      { label: '8.5" × 11"', value: 'letter', priceMod: 1 },
      { label: '5.5" × 8.5"', value: 'half', priceMod: 0.8 },
      { label: '11" × 17"', value: 'tabloid', priceMod: 1.4 },
    ],
    [
      { label: '100lb Paper', value: '100lb', priceMod: 1 },
      { label: '14pt Cardstock', value: '14pt', priceMod: 1.2 },
      { label: 'Laminated', value: 'laminated', priceMod: 1.35 },
    ],
    [
      { label: 'Gloss', value: 'gloss', priceMod: 1 },
      { label: 'Matte', value: 'matte', priceMod: 1.05 },
    ],
    [
      ['25', '25', 1],
      ['50', '50', 0.95],
      ['100', '100', 0.88],
      ['250', '250', 0.8],
    ],
  ),

  signs: [
    {
      key: 'display_options',
      label: 'Display Options',
      uiType: 'SELECT',
      values: [
        { label: 'Sign Only', value: 'sign-only', priceMod: 1 },
        { label: 'Sign + Ground Stake', value: 'with-stake', priceMod: 1.25 },
      ],
    },
    {
      key: 'shape',
      label: 'Shape',
      uiType: 'SELECT',
      values: [
        { label: 'Rectangle/Square', value: 'rectangle', priceMod: 1 },
        { label: 'Oval', value: 'oval', priceMod: 1.08 },
        { label: 'Circle', value: 'circle', priceMod: 1.08 },
        { label: 'House', value: 'house', priceMod: 1.12 },
        { label: 'Arrow', value: 'arrow', priceMod: 1.12 },
        { label: 'Custom', value: 'custom', priceMod: 1.25 },
      ],
    },
    {
      key: 'size',
      label: 'Size (H × W)',
      uiType: 'SELECT',
      values: [
        { label: '12" × 18"', value: '12x18', priceMod: 1 },
        { label: '12" × 24"', value: '12x24', priceMod: 1.2 },
        { label: '18" × 24"', value: '18x24', priceMod: 1.45 },
        { label: '24" × 18"', value: '24x18', priceMod: 1.45 },
        { label: '36" × 24"', value: '36x24', priceMod: 2.1 },
      ],
    },
    {
      key: 'printed_side',
      label: 'Printed Side',
      uiType: 'SELECT',
      values: [
        { label: 'Front Only', value: 'front', priceMod: 1 },
        { label: 'Front and Back', value: 'both', priceMod: 1.35 },
      ],
    },
    {
      key: 'material',
      label: 'Material',
      uiType: 'SELECT',
      values: [
        { label: '3/16" Corrugated Plastic', value: 'coroplast', priceMod: 1 },
      ],
    },
    {
      key: 'grommets',
      label: 'Grommets',
      uiType: 'SELECT',
      values: [
        { label: 'None', value: 'none', priceMod: 1 },
        { label: 'Two grommets on top', value: 'two-top', priceMod: 1.08 },
        { label: 'Grommet on each corner', value: 'corners', priceMod: 1.12 },
      ],
    },
    ...qtyTurnaround(
      [
        ['1', '1', 1],
        ['5', '5', 0.95],
        ['10', '10', 0.9],
        ['25', '25', 0.85],
        ['50', '50', 0.8],
        ['100', '100', 0.75],
      ],
      [
        ['2 Business Days', '2-day', 1],
        ['1 Business Day', '1-day', 1.25],
      ],
    ),
  ],

  postcards: pack(
    [
      { label: '4" × 6"', value: '4x6', priceMod: 1 },
      { label: '5" × 7"', value: '5x7', priceMod: 1.15 },
      { label: '6" × 9"', value: '6x9', priceMod: 1.35 },
      { label: '6" × 11" (EDDM)', value: '6x11', priceMod: 1.5 },
    ],
    [
      { label: '14pt Cardstock', value: '14pt', priceMod: 1 },
      { label: '16pt Cardstock', value: '16pt', priceMod: 1.12 },
      { label: '17pt Uncoated', value: '17pt', priceMod: 1.18 },
    ],
    [
      { label: 'Gloss', value: 'gloss', priceMod: 1 },
      { label: 'Matte', value: 'matte', priceMod: 1.05 },
      { label: 'UV High Gloss', value: 'uv', priceMod: 1.15 },
    ],
    [
      ['100', '100', 1],
      ['250', '250', 0.9],
      ['500', '500', 0.82],
      ['1,000', '1000', 0.75],
    ],
    [
      {
        key: 'printed_side',
        label: 'Printed Side',
        uiType: 'SELECT',
        values: [
          { label: 'Front Only', value: 'front', priceMod: 1 },
          { label: 'Front and Back', value: 'both', priceMod: 1.15 },
        ],
      },
    ],
  ),
};

/** Product slug → exact UPrinting-style fields (overrides category defaults) */
const PRODUCT_OPTION_OVERRIDES = {
  'yard-signs': CATEGORY_OPTION_TEMPLATES.signs,
  'coroplast-yard-signs': CATEGORY_OPTION_TEMPLATES.signs,
  menus: [
    {
      key: 'menu_type',
      label: 'Menu Type',
      uiType: 'CARDS',
      values: [
        { label: 'Laminated', value: 'laminated', priceMod: 1, meta: { icon: 'Square' } },
        { label: 'Multipage', value: 'multipage', priceMod: 1.35, meta: { icon: 'LayoutGrid' } },
        { label: 'Disposable', value: 'disposable', priceMod: 0.85, meta: { icon: 'FileText' } },
      ],
    },
    {
      key: 'size',
      label: 'Size (before folding)',
      uiType: 'SELECT',
      values: [
        { label: '8.5" × 11"', value: 'letter', priceMod: 1 },
        { label: '5.5" × 8.5"', value: 'half', priceMod: 0.8 },
        { label: '4.25" × 11"', value: 'slim', priceMod: 0.85 },
        { label: '11" × 17"', value: 'tabloid', priceMod: 1.4 },
      ],
    },
    {
      key: 'lamination',
      label: 'Lamination / Coating',
      uiType: 'SELECT',
      values: [
        { label: '3 mil Gloss (Sealed)', value: '3mil-gloss', priceMod: 1 },
        { label: '3 mil Matte (Sealed)', value: '3mil-matte', priceMod: 1.05 },
        { label: 'Gloss', value: 'gloss', priceMod: 0.95 },
        { label: 'Matte', value: 'matte', priceMod: 0.98 },
        { label: 'High Gloss UV', value: 'uv', priceMod: 1.12 },
        { label: 'Uncoated', value: 'uncoated', priceMod: 0.9 },
      ],
    },
    {
      key: 'paper',
      label: 'Paper Type',
      uiType: 'SELECT',
      values: [
        { label: '100 lb. Paper', value: '100lb', priceMod: 1 },
        { label: '70 lb. Paper Uncoated', value: '70lb', priceMod: 0.92 },
        { label: '10 pt. Cardstock', value: '10pt', priceMod: 1.1 },
        { label: '14 pt. Cardstock', value: '14pt', priceMod: 1.2 },
        { label: '16 pt. Cardstock', value: '16pt', priceMod: 1.3 },
      ],
    },
    {
      key: 'folding',
      label: 'Folding',
      uiType: 'SELECT',
      values: [
        { label: 'None', value: 'none', priceMod: 1 },
        { label: 'Half Fold', value: 'half', priceMod: 1.05 },
        { label: 'Tri-Fold / Letter Fold', value: 'tri', priceMod: 1.1 },
        { label: 'Z-Fold', value: 'z', priceMod: 1.12 },
      ],
    },
    {
      key: 'printed_side',
      label: 'Printed Side',
      uiType: 'SELECT',
      values: [
        { label: 'Front Only', value: 'front', priceMod: 1 },
        { label: 'Front and Back', value: 'both', priceMod: 1.15 },
        { label: 'Outside Only', value: 'outside', priceMod: 1.1 },
        { label: 'Outside and Inside', value: 'out-in', priceMod: 1.25 },
      ],
    },
    ...qtyTurnaround(
      [
        ['25', '25', 1],
        ['50', '50', 0.95],
        ['100', '100', 0.88],
        ['250', '250', 0.8],
        ['500', '500', 0.72],
      ],
      [
        ['6 Business Days', '6-day', 1],
        ['4 Business Days', '4-day', 1.1],
        ['2 Business Days', '2-day', 1.3],
      ],
    ),
  ],
  'dine-in-menus': null, // filled below
  'take-out-menus': null,
  coasters: [
    {
      key: 'shape',
      label: 'Shape',
      uiType: 'SELECT',
      values: [
        { label: 'Round', value: 'round', priceMod: 1 },
        { label: 'Square', value: 'square', priceMod: 1 },
      ],
    },
    {
      key: 'size',
      label: 'Size',
      uiType: 'SELECT',
      values: [
        { label: '3.5"', value: '3-5', priceMod: 1 },
        { label: '4"', value: '4', priceMod: 1.1 },
      ],
    },
    {
      key: 'material',
      label: 'Material',
      uiType: 'SELECT',
      values: [
        { label: 'Pulpboard', value: 'pulpboard', priceMod: 1 },
        { label: 'Hardboard', value: 'hardboard', priceMod: 1.4 },
      ],
    },
    ...qtyTurnaround([
      ['100', '100', 1],
      ['250', '250', 0.9],
      ['500', '500', 0.82],
      ['1,000', '1000', 0.75],
    ]),
  ],
};

PRODUCT_OPTION_OVERRIDES['dine-in-menus'] = PRODUCT_OPTION_OVERRIDES.menus;
PRODUCT_OPTION_OVERRIDES['take-out-menus'] = PRODUCT_OPTION_OVERRIDES.menus;

function getOptionTemplate(slug, categorySlug) {
  if (PRODUCT_OPTION_OVERRIDES[slug]) return PRODUCT_OPTION_OVERRIDES[slug];
  return (
    CATEGORY_OPTION_TEMPLATES[categorySlug] ||
    CATEGORY_OPTION_TEMPLATES['marketing-materials']
  );
}

module.exports = {
  CATEGORY_OPTION_TEMPLATES,
  PRODUCT_OPTION_OVERRIDES,
  getOptionTemplate,
};
