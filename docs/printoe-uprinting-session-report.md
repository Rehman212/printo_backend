# Printoe × UPrinting — Session Work Report

**Project:** `D:\printoe`  
**Date:** 30 July 2026  
**Range:** Shop Now hover → saari remaining category flyouts/pages  

Yeh **nayi file** hai. Sirf is conversation ka kaam — top se bottom.

---

## 1. Shop Now hover

**Request:** Hover pe Shop Now jaisa `uprinting.com`.

**Done:**
- `src/components/home/ShopShowcase.tsx` — Top Sellers blur + green SHOP NOW
- `src/components/home/FeaturedProducts.tsx` — same effect

---

## 2. Custom Product Builder

**Request:** Builder editor pe nahi; UPrinting calculator page pe.

**Done:**
- Route: `/custom-printing`
- `src/app/custom-printing/page.tsx`
- `src/components/products/CustomProductBuilder.tsx`
- `src/lib/custom-printing-options.ts`
- Offset | Signs, dropdowns, Upload / Design Online
- Menu Builder → `/custom-printing` (ab `/editor` nahi)
- Calculator box width bari

---

## 3. Popular Products sidebar + header

**Request:** Menus UPrinting jaisi.

**Done:**
- `src/lib/uprinting-nav.ts` — categories, mega-menus, footer links
- `ShopShowcase.tsx` — gray header, hover `#e8f4fc`, Design Service, Direct Mail, See More Products
- `Header.tsx` — mega-dropdowns (Marketing Materials, Stickers & Labels, Boxes & Packaging, Signs & Banners, Apparel & Promo, Featured Collections)
- `/direct-mail` page
- `/services` Design Service CTA updated
- Footer Builder / Custom Printing links cleaned

---

## 4. Apparel

**Request:** Apparel submenu + T-Shirts page.

**Flyout:** T-Shirts, Polo, Jackets, Sweatshirts, Hats, Workwear

**Files:**
- `src/lib/apparel-catalog.ts`
- `src/components/products/ApparelCategoryPage.tsx`
- `src/app/products/apparel/[slug]/page.tsx`

**Page:** hero + left sidebar + product grid + pagination

---

## 5. Banners

**Request:** Banners submenu + har page design.

**Flyout:** Vinyl, Retractable, X Banner, Table, Step and Repeat, Mesh, Pole, Fabric, Table Top, Deluxe/Premium Retractable, Tension displays, Backdrops, Curved Pop-Up, …

**Files:**
- `src/lib/banners-catalog.ts`
- `src/components/products/BannerProductPage.tsx`
- `src/app/products/banners/[slug]/page.tsx`

**Page:** gallery + configurator + green price + Upload Design

---

## 6. Boxes

**Request:** Boxes submenu + pages.

**Flyout:** Mailer, Product, Shipping, Folding Cartons, Wine Mailer

**Files:**
- `src/lib/boxes-catalog.ts`
- `src/components/products/BoxesProductPage.tsx`
- `src/app/products/boxes/[slug]/page.tsx`

**Page:** rush bar, tabs, Customize & Check Prices, L×W×D, Upload Design

---

## 7. Business Cards

**Request:** Business Cards submenu + pages.

**Flyout:**
- Popular: Standard, Square, Rounded Corner
- Premium: Foil, Metal, Metallic Print, Plastic, Painted Edge, Raised Foil, Raised Spot UV, Silk, Spot UV, Velvet
- Shape: Slim, Square Rounded Corner, Folded, Leaf, Slim Rounded Corner, Circle

**Files:**
- `src/lib/business-cards-catalog.ts`
- `src/components/products/BusinessCardsProductPage.tsx`
- `src/app/products/business-cards/[slug]/page.tsx`

**Page:** type tabs + dropdowns + green price + Upload / Design Online

---

## 8. Baaki categories

**Request:** Baaki bhi aisa hi; pages khud dekh ke banao.

**Shared:**
- `src/lib/shop-catalog.ts`
- `src/components/products/ShopProductPage.tsx`
- `src/lib/shop-category-route.tsx`

**Routes:**
- `/products/flyers/[slug]`
- `/products/brochures/[slug]`
- `/products/labels/[slug]`
- `/products/packaging/[slug]`
- `/products/postcards/[slug]`
- `/products/promotional-products/[slug]`
- `/products/signs/[slug]`
- `/products/stickers/[slug]`

**Flyouts:**
| Category | Items |
|----------|--------|
| Flyers | Business, Die-Cut, Foil, Silk, Metallic |
| Labels | Custom Labels + Type / Material / Use |
| Packaging | Boxes, Tape, Bags, Pouches, … |
| Postcards | Standard, Folded, EDDM, Foil, Silk, … |
| Promo | Apparel, Drinkware, Pens, … |
| Signs | Outdoor, A-Frame, Flags, Decals, … |
| Stickers | Custom Stickers + Type / Material |
| Brochures | Bi-Fold, Tri-Fold, Booklets, … |

Har page: gallery, dropdowns, green Printing Cost, Upload + Design Online.

---

## 9. Naye files list

```
src/app/custom-printing/page.tsx
src/app/direct-mail/page.tsx
src/app/products/apparel/[slug]/page.tsx
src/app/products/banners/[slug]/page.tsx
src/app/products/boxes/[slug]/page.tsx
src/app/products/business-cards/[slug]/page.tsx
src/app/products/flyers/[slug]/page.tsx
src/app/products/brochures/[slug]/page.tsx
src/app/products/labels/[slug]/page.tsx
src/app/products/packaging/[slug]/page.tsx
src/app/products/postcards/[slug]/page.tsx
src/app/products/promotional-products/[slug]/page.tsx
src/app/products/signs/[slug]/page.tsx
src/app/products/stickers/[slug]/page.tsx

src/components/products/CustomProductBuilder.tsx
src/components/products/ApparelCategoryPage.tsx
src/components/products/BannerProductPage.tsx
src/components/products/BoxesProductPage.tsx
src/components/products/BusinessCardsProductPage.tsx
src/components/products/ShopProductPage.tsx

src/lib/custom-printing-options.ts
src/lib/uprinting-nav.ts
src/lib/apparel-catalog.ts
src/lib/banners-catalog.ts
src/lib/boxes-catalog.ts
src/lib/business-cards-catalog.ts
src/lib/shop-catalog.ts
src/lib/shop-category-route.tsx
```

**Updated:** ShopShowcase, FeaturedProducts, Header, Footer, ServicesPage

---

## 10. Check

1. Hover Shop Now  
2. Builder → `/custom-printing`  
3. Apparel → T-Shirts  
4. Banners / Boxes / Business Cards  
5. Flyers / Labels / Stickers flyouts + pages  

---

*Nayi file — is session only (Shop Now → baaki categories).*
