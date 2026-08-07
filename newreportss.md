# Printoe — Work Report

_Session date: Aug 5–6, 2026_

This report covers everything done in this session, from the Teardrop Flags
pricing fix through the admin pricing redesign. Two repos are involved:

- **Backend / scripts:** `d:\printo_backend`
- **Frontend (Next.js storefront + admin):** `D:\printoe`

---

## 1. Teardrop Flags — exact pricing

**Problem:** Har option change par price UPrinting jaisa exact nahi tha; formula guesswork tha.

**Kya kiya:**
- UPrinting ka raw HTML CloudFront 403 deta hai aur attribute IDs strip ho jaate hain, isliye scraping possible nahi thi. Verified live price points par engine calibrate kiya.
- Confirmed live prices se model derive kiya:
  - Flag & Pole · 9 ft · Front Only · Ground Spike · no bag · qty 1 · 6 BD = **$128.12**
  - Flag Only · 9 ft · Front Only · qty 1 · 6 BD = **$47.20**
  - Flag & Pole · bag=Yes · qty 5 = **$742.63** → yaani 5 × ($128.12 + $20.406). Quantity ek flat multiplier hai, carrying bag ek flat per-unit adder.
- Package ko absolute base price banaya (Flag & Pole $128.12, Flag Only $47.20); fake sqrt quantity-discount hataya; base attachment aur carrying bag ko flat adders banaya.

**Files:**
- `d:\printo_backend\scripts\sync-teardrop-flags-options.cjs`
- `D:\printoe\src\lib\products-api.ts` (calculator me `priceAdd` support)
- `D:\printoe\src\types\index.ts` (`priceAdd` meta)

**Note:** Kuch options (11.2 ft, Front and Back, baaki base attachments, 4/2-day turnaround) ke exact numbers abhi estimate hain — inko admin panel se ya live prices milne par exact kiya ja sakta hai.

---

## 2. Admin option pricing — meta round-trip bug fix

**Problem:** Admin editor product save karte waqt `meta` (absolute base, flat adders, `hideGroups`, `labelWhen`) poori tarah drop kar deta tha — matlab kisi product ko admin se "Update in database" karte hi saari exact pricing mit jaati thi.

**Kya kiya:**
- Editor ab `meta` ko API se load karta hai aur save par wapas bhejta hai.
- Har choice par pricing mode: **× multiply**, **+ add $**, **= fixed $**.
- Real admin login se PATCH karke verify kiya ke `absoluteBasePrice`, `priceAdd`, `hideGroups`, `labelWhen` sab bach jaate hain.

**Files:** `D:\printoe\src\components\admin\AdminProductOptionEditor.tsx`

---

## 3. Custom Wall Decals — re-sync

Sync gayab ho gaya tha (generic yard-sign options wapas aa gaye the); dobara apply kiya aur prices verify kiye:
- 16×20 qty1 = $18.12, qty3 = $35.54, qty50 = $444.91, 24×36 = $32.93

**File:** `d:\printo_backend\scripts\sync-wall-decals-from-uprinting.cjs`

---

## 4. Navigation menus — UPrinting-aligned

Har category ko screenshots ke mutabiq complete kiya. Missing items add kiye + har naye item ke liye working product page banaya (koi 404 nahi).

| Menu | Kya add hua |
|---|---|
| **Banners** | Awesome X-Banner Stand ($47.02) |
| **Business Cards** | Popular / Premium / Shape structure; Shape me Half-Circle, Oval, Single Rounded Corner, Die-Cut; "See All Business Cards ›" footer |
| **Labels** | Shop by Popular Use: Address, Beer, Candle, Food, Jar, Lip Balm, QR Code, Return Address, Name, Shipping & Mailing, Warning, Water Bottle, Wine |
| **Packaging** | Wrapping Paper |
| **Postcards** | Pehle se complete; EDDM label ko `®` diya |
| **Promotional Products** | Pehle se complete (koi change nahi) |
| **Stickers** | Shop by Popular Use: Bulk, Bumper, Campaign & Political, Name, Envelope Seals, QR Code, Safety, Sealing |

**Files:** `D:\printoe\src\lib\uprinting-nav.ts`, `D:\printoe\src\lib\shop-catalog.ts`, `D:\printoe\src\lib\business-cards-catalog.ts`, `D:\printoe\src\lib\banners-catalog.ts`, `D:\printoe\src\components\home\ShopShowcase.tsx`

---

## 5. Header nav restyle + Marketing Materials mega menu

**Restyle:** "All Products" aur chevrons hataye; links blue (`#1b4f9c`), centered, hover par pink.

**Mega menu:** Marketing Materials par full-width 8-column mega panel (Business Cards, Brochures & Flyers, Booklets and Catalogs, Postcards, Cards & Events, Forms & Stationery, Marketing & Promotion, Branded Office Supplies) — har column me image, heading, links, aur `Best Seller` / `New` badges.

- Jo 18 items ki koi page nahi thi (Rack Cards, Catalogs, Invitations, Letterhead, Folders, etc.) unke liye naya `marketing` category + `/products/marketing/[slug]` route banaya.
- Sabhi 34 mega-menu links verify kiye — sab resolve hote hain.
- Hover behaviour fix: panel nav bar ka DOM child hai taake hover par band na ho.

**Files:** `D:\printoe\src\components\layout\Header.tsx`, `D:\printoe\src\lib\uprinting-nav.ts`, `D:\printoe\src\lib\shop-catalog.ts`, `D:\printoe\src\app\products\marketing\[slug]\page.tsx`

---

## 6. Broken images fix

**Problem:** Mega menu me "Branded Office Supplies" aur baaki jagah images hide ho rahi thin.

**Do wajah milin aur dono theek kiye:**
1. Ek Unsplash URL 404 de rahi thi — wohi URL 3 files me 10 jagah thi. Sab verified working URLs se replace ki. Mega menu ke liye guess-work photos ki jagah asli catalogue product images use kiye (topic-matched).
2. `next.config.ts` me 3 image hosts whitelisted nahi thay — `s2.uprinting.com` (10), `s3.uprinting.com` (9), `printoe.com` (36). `**.uprinting.com` aur `printoe.com` add kiye.

Project ki tamaam 31 image URLs verify kiye — ab ek bhi broken nahi.

> `next.config.ts` badla hai → **dev server restart zaroori** hai (sirf refresh se image hosts effect nahi karenge).

**Files:** `D:\printoe\next.config.ts`, `D:\printoe\src\lib\uprinting-nav.ts`, `D:\printoe\src\lib\shop-catalog.ts`, `D:\printoe\src\lib\business-cards-catalog.ts`, `D:\printoe\src\lib\data.ts`

---

## 7. Admin pricing redesign — fields aur pricing alag

**Problem:** Pricing har option ke andar mix thi; developer/admin ke liye confusing thi, aur Width×Height pricing admin me kahin set hi nahi hoti thi.

**Kya kiya — 2 alag wizard steps:**

**Step "Customer fields"** — sirf sawal jo customer answer karta hai (Width, Height, Material, Quantity). Koi pricing yahan nahi. Accordion layout: har field collapsed row, click par khulti hai, up/down se reorder.

**Step "Pricing"** — product-level pricing model:
- **Fixed / option pricing** — predefined sizes/packages (cards, flags).
- **Width × Height** — banners, decals, custom printing:

```text
Price = Setup cost + (Width × Height × Area rate)
Minimum price se neeche nahi jaati
```

  Admin sirf Width field, Height field, Setup cost, Area rate, Minimum price chunta hai — saath live price example.
- **Option price adjustments** (optional, collapsed): per-choice × multiply / + add $ / = fixed $.

**Backward compatible:** pricing existing `meta` field me store hoti hai — koi DB migration nahi. Calculator purane synced products (jaise Wall Decals ka `areaPricing`) ko bhi support karta hai.

**Verify kiya (sab pass):**
- area 2×2 = $18.00, 3.25×2 = $23.00
- area + flat add-on + qty discount = $103.50
- fixed option base replace = $50.00
- `npx tsc --noEmit` clean
- `npm run build` — 208 pages successfully generated

**Files:**
- `D:\printoe\src\components\admin\AdminProductOptionEditor.tsx` (fields-only)
- `D:\printoe\src\components\admin\AdminProductPricingEditor.tsx` (naya)
- `D:\printoe\src\components\admin\AdminProducts.tsx` (naya Pricing wizard step)
- `D:\printoe\src\lib\products-api.ts` (area + add + fixed + legacy support)
- `D:\printoe\src\types\index.ts` (`pricingConfig`, `priceAdd`, `dimension` meta)

---

## Pending / follow-ups

- Teardrop Flags ke non-default options (11.2 ft, Front and Back, base attachments, 4/2-day) ke exact live prices — abhi estimate hain.
- Baaki nav groups (Stickers & Labels, Boxes & Packaging, etc.) abhi simple dropdown hain; chahein to mega menu banaye ja sakte hain.
- `next.config.ts` change ke liye dev server restart.
