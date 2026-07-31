/**
 * Assign real product images across the full catalog and sync into DB via seed.
 * - Homepage showcase photos → /uploads/catalog/*.jpg
 * - Known staticecp.uprinting.com heroes kept
 * - Remaining products get category/slug-matched print images (no random Unsplash people shots)
 *
 * Usage: node scripts/apply-catalog-images.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CATALOG = path.join(ROOT, 'prisma', 'data', 'uprinting-catalog.json');
const SHOWCASE_SRC = path.join(ROOT, '..', 'printoe', 'public', 'home-showcase');
const CATALOG_UPLOADS = path.join(ROOT, '..', 'printoe', 'public', 'uploads', 'catalog');

const CDN = {
  stickers: 'https://staticecp.uprinting.com/9761/530x530/UP_Square_Stickers_PDP_Image_A_wBadge.jpg',
  labels: 'https://staticecp.uprinting.com/6904/530x530/Roll-Labels.jpg',
  yard: 'https://staticecp.uprinting.com/6896/530x530/Yard-Signs.jpg',
  window: 'https://staticecp.uprinting.com/5136/530x530/Window_Clings_Marketing_Materials_B.jpg',
  booklets: 'https://staticecp.uprinting.com/957/530x530/Bulk_Booklets_Marketing_Materials_A.jpg',
};

/** Local showcase files (copied into public/uploads/catalog). */
const LOCAL = {
  menus: '/uploads/catalog/menus.jpg',
  coasters: '/uploads/catalog/coasters.jpg',
  'bottle-labels': '/uploads/catalog/bottle-labels.jpg',
  'vinyl-banners': '/uploads/catalog/vinyl-banners.jpg',
  'table-tents': '/uploads/catalog/table-tents.jpg',
  drinkware: '/uploads/catalog/drinkware.jpg',
  pouches: '/uploads/catalog/pouches.jpg',
  'wall-decals': '/uploads/catalog/wall-decals.jpg',
  'trading-cards': '/uploads/catalog/trading-cards.jpg',
  'every-door-direct-mail': '/uploads/catalog/every-door-direct-mail.jpg',
  magazines: '/uploads/catalog/magazines.jpg',
  'waterproof-menus': '/uploads/catalog/waterproof-menus.jpg',
};

const SHOWCASE_FILES = [
  'menus.jpg',
  'coasters.jpg',
  'bottle-labels.jpg',
  'vinyl-banners.jpg',
  'table-tents.jpg',
  'drinkware.jpg',
  'pouches.jpg',
  'wall-decals.jpg',
  'trading-cards.jpg',
  'every-door-direct-mail.jpg',
  'magazines.jpg',
  'waterproof-menus.jpg',
];

const CATEGORY_DEFAULT = {
  apparel: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
  banners: LOCAL['vinyl-banners'],
  boxes: 'https://images.unsplash.com/photo-1607112812619-182cb1c7bb61?w=800&q=80',
  brochures: CDN.booklets,
  'business-cards': 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=800&q=80',
  flyers: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80',
  labels: CDN.labels,
  packaging: LOCAL.pouches,
  postcards: LOCAL['every-door-direct-mail'],
  'promotional-products': LOCAL.drinkware,
  signs: CDN.yard,
  stickers: CDN.stickers,
  'marketing-materials': LOCAL.menus,
  posters: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
};

/** Exact slug overrides (A–Z coverage for known heroes). */
const SLUG_IMAGE = {
  menus: LOCAL.menus,
  'dine-in-menus': LOCAL.menus,
  'take-out-menus': LOCAL.menus,
  'waterproof-menus': LOCAL['waterproof-menus'],
  coasters: LOCAL.coasters,
  'bottle-labels': LOCAL['bottle-labels'],
  'water-bottle-labels': LOCAL['bottle-labels'],
  'custom-labels': CDN.labels,
  'roll-labels': CDN.labels,
  'vinyl-banners': LOCAL['vinyl-banners'],
  'table-tents': LOCAL['table-tents'],
  drinkware: LOCAL.drinkware,
  pouches: LOCAL.pouches,
  'stand-up-pouches': LOCAL.pouches,
  'flat-pouches': LOCAL.pouches,
  'wall-decals': LOCAL['wall-decals'],
  'outdoor-wall-decals': LOCAL['wall-decals'],
  'trading-cards': LOCAL['trading-cards'],
  'eddm-postcards': LOCAL['every-door-direct-mail'],
  magazines: LOCAL.magazines,
  'custom-stickers': CDN.stickers,
  stickers: CDN.stickers,
  'die-cut-stickers': CDN.stickers,
  'vinyl-stickers': CDN.stickers,
  'yard-signs': CDN.yard,
  'window-clings': CDN.window,
  booklets: CDN.booklets,
  'bulk-booklets': CDN.booklets,
};

/** Keyword → image (checked against slug + name). */
const KEYWORD_RULES = [
  [/menu/, LOCAL.menus],
  [/coaster/, LOCAL.coasters],
  [/bottle.?label|water.?bottle/, LOCAL['bottle-labels']],
  [/roll.?label|label/, CDN.labels],
  [/vinyl.?banner|banner/, LOCAL['vinyl-banners']],
  [/table.?tent/, LOCAL['table-tents']],
  [/drinkware|tumbler|mug|bottle(?!.?label)|can.?cooler/, LOCAL.drinkware],
  [/pouch/, LOCAL.pouches],
  [/wall.?decal|decal/, LOCAL['wall-decals']],
  [/trading.?card/, LOCAL['trading-cards']],
  [/eddm|every.?door|direct.?mail/, LOCAL['every-door-direct-mail']],
  [/magazine|catalog|booklet/, LOCAL.magazines],
  [/sticker/, CDN.stickers],
  [/yard.?sign/, CDN.yard],
  [/window.?cling|cling/, CDN.window],
  [/postcard/, LOCAL['every-door-direct-mail']],
  [/brochure/, CDN.booklets],
  [/business.?card|name.?card/, CATEGORY_DEFAULT['business-cards']],
  [/flyer/, CATEGORY_DEFAULT.flyers],
  [/poster/, CATEGORY_DEFAULT.posters],
  [/box|mailer|carton/, CATEGORY_DEFAULT.boxes],
  [/bag|topper|tape|packaging/, LOCAL.pouches],
  [/tent|canopy/, 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&q=80'],
  [/t-?shirt|apparel|hoodie|polo|hat|jacket/, CATEGORY_DEFAULT.apparel],
  [/sign|a-?frame|flag|sandwich/, CDN.yard],
  [/notepad|form|carbonless/, LOCAL.menus],
];

function resolveImage(product) {
  const slug = (product.slug || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  const hay = `${slug} ${name}`;

  if (SLUG_IMAGE[slug]) return SLUG_IMAGE[slug];

  // Keep existing good CDN heroes
  if ((product.imageUrl || '').includes('staticecp.uprinting.com')) {
    return product.imageUrl;
  }

  for (const [re, img] of KEYWORD_RULES) {
    if (re.test(hay)) return img;
  }

  return CATEGORY_DEFAULT[product.categorySlug] || CDN.stickers;
}

function copyShowcase() {
  fs.mkdirSync(CATALOG_UPLOADS, { recursive: true });
  let copied = 0;
  for (const file of SHOWCASE_FILES) {
    const from = path.join(SHOWCASE_SRC, file);
    const to = path.join(CATALOG_UPLOADS, file);
    if (!fs.existsSync(from)) {
      console.warn('Missing showcase file:', from);
      continue;
    }
    fs.copyFileSync(from, to);
    copied++;
  }
  console.log(`Copied ${copied} showcase images → printoe/public/uploads/catalog`);
}

function main() {
  copyShowcase();

  const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  let local = 0;
  let cdn = 0;
  let other = 0;

  for (const p of catalog.products) {
    const imageUrl = resolveImage(p);
    p.imageUrl = imageUrl;
    p.galleryUrls = [imageUrl];
    if (imageUrl.startsWith('/uploads/')) local++;
    else if (imageUrl.includes('staticecp')) cdn++;
    else other++;
  }

  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`Updated ${catalog.products.length} products in uprinting-catalog.json`);
  console.log({ localCatalogUploads: local, staticecp: cdn, otherStock: other });
}

main();
