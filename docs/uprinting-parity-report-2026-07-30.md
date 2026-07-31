# Printoe × UPrinting Work Report

**Session range only:** Shop Now hover → baaki saari category flyouts/pages  
**Project:** `D:\printoe`  
**Date:** 30 July 2026  

Yeh report **sirf is conversation** ka kaam cover karti hai (jo screenshots mein “yahan se yahan tak” bola gaya). Purana dashboard / pehle ke reports ka mix nahi.

---

## 1. Shop Now hover (Top Sellers + Featured)

### Request
Hover pe **Shop Now** aaye jaisa `uprinting.com` pe.

### What was done
| File | Change |
|------|--------|
| `src/components/home/ShopShowcase.tsx` | Top Sellers: blur + scale, dark green **SHOP NOW** overlay, title lift |
| `src/components/home/FeaturedProducts.tsx` | Same hover pattern |

### Behavior
- Hover → image blur + slight zoom  
- Center button `#1b5e20`, white **SHOP NOW**  
- Title soft white shadow  

---

## 2. Custom Product Builder (calculator, not editor)

### Request
Builder `/editor` pe na jaaye; UPrinting jaisi **dropdown calculator page** pe jaaye. Menus/dropdowns apni marzi se nahi — UPrinting jaisi.

### Decision
- Menu item → `/custom-printing`  
- `/editor` sirf “Create Your Design Online” CTA  

### New files
| Path | Role |
|------|------|
| `src/app/custom-printing/page.tsx` | Route |
| `src/components/products/CustomProductBuilder.tsx` | Gallery + Offset/Signs + fields + CTAs |
| `src/lib/custom-printing-options.ts` | Option sets + price estimate |

### Layout
- Breadcrumb: Home / Custom Printing  
- Left: image, thumbnails, green check features  
- Right: title, stars, **Offset | Signs**, Width/Height/Paper/Folding/… dropdowns  
- Upload → `/upload`, Design Online → `/editor`  
- Calculator column width later increased (~46–48%)  

---

## 3. Popular Products sidebar + header menus

### Request
Sidebar + top nav UPrinting jaisi; destinations sahi pages pe.

### Shared nav
| File | Role |
|------|------|
| `src/lib/uprinting-nav.ts` | Categories, mega-menu children, footer links, CATEGORY_SUBMENUS |

### Sidebar (`ShopShowcase.tsx`)
- Header gray bar andar box mein  
- Hover `#e8f4fc`  
- Order: Builder → Apparel → … → Stickers  
- Footer: Custom Quote, Direct Mail, Design Service, See More Products  
- Builder → `/custom-printing`  

### Header (`Header.tsx`)
- Mega-dropdowns: Marketing Materials, Stickers & Labels, Boxes & Packaging, Signs & Banners, Apparel & Promo, Featured Collections  
- Mobile accordion same children  

### Support
| Route | Role |
|-------|------|
| `/direct-mail` | Direct Mail landing |
| `/services` | Design Service (+ Builder CTA) |

Footer / Services links cleaned so Builder ≠ Design Studio.

---

## 4. Apparel

### Request
Apparel submenu + T-Shirts page layout.

### Flyout
T-Shirts, Polo Shirts, Jackets, Sweatshirts, Hats, Workwear  

### Files
| Path | Role |
|------|------|
| `src/lib/apparel-catalog.ts` | Data |
| `src/components/products/ApparelCategoryPage.tsx` | Hero + sidebar + grid |
| `src/app/products/apparel/[slug]/page.tsx` | e.g. `/products/apparel/t-shirts` |

### Page
Purple hero, brand bar, left subtype list, product cards + pagination.

---

## 5. Banners

### Request
Banners submenu + har link ka page design.

### Flyout (16)
Vinyl, Retractable, X Banner Stands, Table, Step and Repeat, Mesh, Pole, Fabric, Table Top, Deluxe/Premium Retractable, Tension displays, Backdrops, Curved Pop-Up, …

### Files
| Path | Role |
|------|------|
| `src/lib/banners-catalog.ts` | Products + fields |
| `src/components/products/BannerProductPage.tsx` | PDP configurator |
| `src/app/products/banners/[slug]/page.tsx` | `/products/banners/...` |

### Page
Gallery + features | Size/Material/Grommets (or Retractable styles) | green Printing Cost | Upload Design (+ Design Online).

---

## 6. Boxes

### Request
Boxes submenu + pages.

### Flyout
Mailer, Product, Shipping, Folding Cartons, Wine Mailer  

### Files
| Path | Role |
|------|------|
| `src/lib/boxes-catalog.ts` | Data + family tabs |
| `src/components/products/BoxesProductPage.tsx` | Rush bar + customize UI |
| `src/app/products/boxes/[slug]/page.tsx` | `/products/boxes/...` |

### Page
Rush banner, Mailer/Product/Shipping tabs, **Customize & Check Prices**, dropdowns, custom L×W×D, `$ each` + subtotal, Upload Design.

---

## 7. Business Cards

### Request
Business Cards submenu (Popular / Premium / Shape) + pages.

### Flyout
- **Popular:** Standard, Square, Rounded Corner  
- **Premium:** Foil, Metal, Metallic Print, Plastic, Painted Edge, Raised Foil, Raised Spot UV, Silk, Spot UV, Velvet  
- **Shape:** Slim, Square Rounded Corner, Folded, Leaf, Slim Rounded Corner, Circle  

### Files
| Path | Role |
|------|------|
| `src/lib/business-cards-catalog.ts` | All types + sections |
| `src/components/products/BusinessCardsProductPage.tsx` | Type tabs + options |
| `src/app/products/business-cards/[slug]/page.tsx` | `/products/business-cards/...` |

### Page
Gallery, Standard/Die-Cut/Foil/Plastic/Silk tabs (jahan applicable), size/paper/qty, green price, Upload / Design Online.

---

## 8. Baaki categories (akhir wali request)

### Request
Aisa hi baaki bhi add karo; har page ka layout khud dekh ke banao.

### Shared
| Path | Role |
|------|------|
| `src/lib/shop-catalog.ts` | Flyouts + products (Flyers → Stickers + Brochures) |
| `src/components/products/ShopProductPage.tsx` | Generic UPrinting PDP |
| `src/lib/shop-category-route.tsx` | Shared route factory |

### Routes
```
/products/flyers/[slug]
/products/brochures/[slug]
/products/labels/[slug]
/products/packaging/[slug]
/products/postcards/[slug]
/products/promotional-products/[slug]
/products/signs/[slug]
/products/stickers/[slug]
```

### Flyouts
| Category | Content |
|----------|---------|
| Flyers | Business, Die-Cut, Foil, Silk, Metallic |
| Labels | Custom Labels + Shop by Type / Material / Use |
| Packaging | Custom Boxes, Tape, Bags, Pouches, … |
| Postcards | Standard, Folded, EDDM, Foil, Silk, Die-Cut, … |
| Promotional Products | Apparel (→ T-Shirts), Bags, Drinkware, Pens, … |
| Signs | Outdoor, A-Frame, Acrylic, Flags, Decals, … |
| Stickers | Custom Stickers + Type / Material |
| Brochures | Bi-Fold, Tri-Fold, Booklets, Z-Fold, Gate Fold |

Har page: gallery, dropdowns, green Printing Cost, Upload + Design Online.

`ShopShowcase` ab in static flyouts ko section headers ke sath render karta hai (Labels/Stickers pe gear header).

---

## 9. Files created (is session)

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

### Files updated
```
src/components/home/ShopShowcase.tsx
src/components/home/FeaturedProducts.tsx
src/components/layout/Header.tsx
src/components/layout/Footer.tsx
src/components/services/ServicesPage.tsx
```

---

## 10. Verify (isi range)

1. Top Sellers / Featured → hover Shop Now  
2. Builder → `/custom-printing`  
3. Apparel → T-Shirts  
4. Banners / Boxes / Business Cards pehli links  
5. Flyers, Labels, Stickers flyout + page  

---

*End — Shop Now se lekar baaki categories tak, is session only.*
