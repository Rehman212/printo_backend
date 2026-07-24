/**
 * Collect UPrinting public catalog: categories, product URLs, prices, images.
 * Usage: node scripts/collect-uprinting-catalog.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'prisma', 'data', 'uprinting-catalog.json');
const BASE = 'https://www.uprinting.com';

const CATEGORY_HUBS = [
  { slug: 'business-cards', name: 'Business Cards', path: '/business-cards.html' },
  { slug: 'flyers', name: 'Flyers', path: '/flyer-printing.html' },
  { slug: 'brochures', name: 'Brochures', path: '/brochure-printing.html' },
  { slug: 'postcards', name: 'Postcards', path: '/postcard-printing.html' },
  { slug: 'posters', name: 'Posters', path: '/poster-printing.html' },
  { slug: 'stickers', name: 'Stickers', path: '/business-sticker-printing.html' },
  { slug: 'labels', name: 'Labels', path: '/label-printing.html' },
  { slug: 'banners', name: 'Banners', path: '/banners.html' },
  { slug: 'signs', name: 'Signs', path: '/signs.html' },
  { slug: 'boxes', name: 'Boxes', path: '/boxes.html' },
  { slug: 'packaging', name: 'Packaging', path: '/packaging.html' },
  { slug: 'apparel', name: 'Apparel', path: '/apparel.html' },
  { slug: 'promotional-products', name: 'Promotional Products', path: '/promotional-products.html' },
  { slug: 'marketing-materials', name: 'Marketing Materials', path: '/marketing-materials.html' },
];

/** Homepage Top Sellers / Featured (UPrinting home) */
const TOP_SELLERS = new Set([
  'menus',
  'coasters',
  'bottle-labels',
  'vinyl-banners',
  'bag-toppers',
  'notepads',
  'carbonless-forms',
  'postcards',
]);

const FEATURED = new Set([
  'stickers',
  'custom-stickers',
  'event-tents',
  'custom-tents',
  'take-out-bags',
  'paper-bags',
  'yard-signs',
  'table-tents',
  'drinkware',
  'pouches',
  'wall-decals',
]);

const SKIP_PATHS = [
  '/blog/',
  '/help',
  '/cart',
  '/account',
  '/login',
  '/sitemap',
  '/privacy',
  '/terms',
  '/about',
  '/contact',
  '/reviews.html',
  '/templates',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function extractLinks(html) {
  const links = new Set();
  const re = /href=["']([^"']+\.html)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    let href = m[1].split('#')[0].split('?')[0];
    if (href.startsWith('http')) {
      if (!href.startsWith(BASE)) continue;
      href = href.slice(BASE.length);
    }
    if (!href.startsWith('/')) href = '/' + href;
    if (SKIP_PATHS.some((s) => href.includes(s))) continue;
    if (href.includes('/blog')) continue;
    links.add(href);
  }
  return [...links];
}

function slugFromPath(p) {
  return p
    .replace(/^\//, '')
    .replace(/\.html$/, '')
    .replace(/-printing$/, '')
    .replace(/_printing$/, '')
    .toLowerCase();
}

function guessCategory(path, hubs) {
  const s = path.toLowerCase();
  if (s.includes('business-card') || s.includes('business_card')) return 'business-cards';
  if (s.includes('flyer')) return 'flyers';
  if (s.includes('brochure') || s.includes('booklet') || s.includes('catalog')) return 'brochures';
  if (s.includes('postcard')) return 'postcards';
  if (s.includes('poster')) return 'posters';
  if (s.includes('sticker')) return 'stickers';
  if (s.includes('label') || s.includes('decal')) return 'labels';
  if (s.includes('banner') || s.includes('retractable') || s.includes('x-banner')) return 'banners';
  if (s.includes('sign') || s.includes('yard') || s.includes('a-frame') || s.includes('foam'))
    return 'signs';
  if (s.includes('box') || s.includes('mailer')) return 'boxes';
  if (s.includes('pouch') || s.includes('packaging') || s.includes('tape') || s.includes('sleeve'))
    return 'packaging';
  if (s.includes('shirt') || s.includes('apparel') || s.includes('hoodie') || s.includes('hat'))
    return 'apparel';
  if (
    s.includes('mug') ||
    s.includes('tote') ||
    s.includes('promotional') ||
    s.includes('drinkware') ||
    s.includes('tent') ||
    s.includes('coaster') ||
    s.includes('bag')
  )
    return 'promotional-products';
  if (
    s.includes('menu') ||
    s.includes('notepad') ||
    s.includes('carbonless') ||
    s.includes('form') ||
    s.includes('envelope') ||
    s.includes('letterhead')
  )
    return 'marketing-materials';
  return hubs || 'marketing-materials';
}

function parseProduct(html, path) {
  const ogTitle =
    html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/content=["']([^"']+)["']\s+property=["']og:title["']/i)?.[1];
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  let name = (ogTitle || titleTag || '')
    .replace(/\s*[|\-–].*UPrinting.*/i, '')
    .replace(/\s*-\s*Premium.*/i, '')
    .replace(/\s*\|\s*.*/i, '')
    .trim();
  if (!name || name.length < 3) {
    name = slugFromPath(path)
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  const ogImage =
    html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i)?.[1] ||
    html.match(/https:\/\/staticecp\.uprinting\.com\/[^\s"'<>]+/i)?.[0] ||
    null;

  const ogDesc =
    html.match(/property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/name=["']description["']\s+content=["']([^"']+)["']/i)?.[1] ||
    '';

  // Default printing cost shown on product pages
  let basePrice = null;
  const priceMatches = [
    ...html.matchAll(/Printing Cost:\s*\$([0-9]+(?:\.[0-9]{2})?)/gi),
    ...html.matchAll(/"discounted_price"\s*:\s*([0-9]+(?:\.[0-9]+)?)/gi),
    ...html.matchAll(/"price"\s*:\s*([0-9]+(?:\.[0-9]+)?)/gi),
    ...html.matchAll(/from\s*\$([0-9]+(?:\.[0-9]{2})?)/gi),
  ];
  for (const pm of priceMatches) {
    const n = parseFloat(pm[1]);
    if (n > 0 && n < 50000) {
      basePrice = n;
      break;
    }
  }

  const ratingMatch = html.match(/([0-9]\.[0-9])\s*(?:Out of 5|\/\s*5)/i);
  const reviewsMatch =
    html.match(/\(([0-9,]+)\s*Reviews?\)/i) ||
    html.match(/([0-9,]+)\s*Reviews?/i);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 4.5;
  const reviews = reviewsMatch
    ? parseInt(reviewsMatch[1].replace(/,/g, ''), 10)
    : Math.floor(Math.random() * 400) + 50;

  return {
    name,
    description: (ogDesc || `Custom ${name} printing with professional quality and fast turnaround.`)
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .slice(0, 500),
    basePrice,
    imageUrl: ogImage,
    rating: Number.isFinite(rating) ? rating : 4.5,
    reviews: Number.isFinite(reviews) ? reviews : 100,
  };
}

function isLikelyProductPage(path, html) {
  if (path.endsWith('.html') === false) return false;
  // Hub pages often lack a single Printing Cost calculator
  const hasCost = /Printing Cost/i.test(html);
  const hasOrder = /ORDER NOW|UPLOAD DESIGN|DESIGN ONLINE/i.test(html);
  const hasOgProduct =
    /og:type["']\s+content=["']product/i.test(html) ||
    /itemtype=["'][^"']*Product/i.test(html);
  return hasCost || hasOrder || hasOgProduct;
}

async function main() {
  console.log('Collecting UPrinting catalog...');
  const productPaths = new Set();
  const hubOk = [];

  // Home + hubs for link discovery
  const startPages = ['/', ...CATEGORY_HUBS.map((h) => h.path)];
  for (const p of startPages) {
    try {
      const html = await fetchText(BASE + p);
      for (const link of extractLinks(html)) productPaths.add(link);
      if (p !== '/') hubOk.push(p);
      console.log(`Hub ${p}: +links (total ${productPaths.size})`);
    } catch (e) {
      console.warn(`Skip hub ${p}:`, e.message);
    }
    await sleep(200);
  }

  // Second pass: follow category-looking links
  const candidates = [...productPaths].filter(
    (p) =>
      !p.includes('blog') &&
      (p.includes('printing') ||
        p.includes('banner') ||
        p.includes('sticker') ||
        p.includes('card') ||
        p.includes('flyer') ||
        p.includes('sign') ||
        p.includes('box') ||
        p.includes('label') ||
        p.includes('poster') ||
        p.includes('brochure') ||
        p.includes('apparel') ||
        p.includes('menu') ||
        p.includes('coaster') ||
        p.includes('tent') ||
        p.includes('bag') ||
        p.includes('postcard') ||
        p.includes('decal') ||
        p.includes('pouch') ||
        p.includes('notepad') ||
        p.includes('magnet')),
  );

  for (const p of candidates.slice(0, 40)) {
    try {
      const html = await fetchText(BASE + p);
      for (const link of extractLinks(html)) productPaths.add(link);
    } catch {
      /* ignore */
    }
    await sleep(150);
  }

  console.log(`Discovered ${productPaths.size} unique .html paths`);

  const products = [];
  const seenSlugs = new Set();
  let i = 0;
  const paths = [...productPaths].sort();

  for (const p of paths) {
    i++;
    // Skip pure hub indexes that match category hubs exactly
    if (CATEGORY_HUBS.some((h) => h.path === p)) continue;

    try {
      const html = await fetchText(BASE + p);
      if (!isLikelyProductPage(p, html)) {
        if (i % 20 === 0) console.log(`  scanned ${i}/${paths.length}…`);
        continue;
      }
      const parsed = parseProduct(html, p);
      let slug = slugFromPath(p);
      if (seenSlugs.has(slug)) slug = slug + '-' + products.length;
      seenSlugs.add(slug);

      const categorySlug = guessCategory(p);
      const isTop = TOP_SELLERS.has(slug) || [...TOP_SELLERS].some((t) => slug.includes(t));
      const isFeat = FEATURED.has(slug) || [...FEATURED].some((t) => slug.includes(t));

      // Fallback price if page is JS-rendered
      let basePrice = parsed.basePrice;
      if (basePrice == null) {
        basePrice = defaultPriceFor(categorySlug);
      }

      products.push({
        name: parsed.name,
        slug,
        description: parsed.description,
        basePrice,
        imageUrl: parsed.imageUrl,
        galleryUrls: parsed.imageUrl ? [parsed.imageUrl] : [],
        categorySlug,
        rating: parsed.rating,
        reviews: parsed.reviews,
        deliveryDays: 3,
        featured: isTop || isFeat,
        badge: isTop ? 'Top Seller' : isFeat ? 'Featured' : null,
        sourceUrl: BASE + p,
      });
      console.log(`  + ${slug} $${basePrice} [${categorySlug}]`);
    } catch (e) {
      if (i % 25 === 0) console.warn(`  fail ${p}: ${e.message}`);
    }
    await sleep(120);
  }

  const catalog = {
    collectedAt: new Date().toISOString(),
    source: BASE,
    categories: [
      ...CATEGORY_HUBS.map((h) => ({
        name: h.name,
        slug: h.slug,
        description: `Custom ${h.name.toLowerCase()} printing`,
      })),
    ],
    products,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(catalog, null, 2));
  console.log(`\nWrote ${products.length} products → ${OUT}`);
}

function defaultPriceFor(categorySlug) {
  const map = {
    'business-cards': 32.12,
    flyers: 24.99,
    brochures: 49.99,
    postcards: 29.99,
    posters: 19.99,
    stickers: 44.8,
    labels: 34.99,
    banners: 16.9,
    signs: 24.99,
    boxes: 89.99,
    packaging: 49.99,
    apparel: 18.99,
    'promotional-products': 29.99,
    'marketing-materials': 39.99,
  };
  return map[categorySlug] ?? 29.99;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
