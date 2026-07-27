# Printoe / printo_backend — Daily Work Report

**Date:** Monday, July 27, 2026  
**Projects:**  
- Backend: `D:\printo_backend` (NestJS + Prisma + PostgreSQL, API `:4000`)  
- Frontend: `D:\printoe` (Next.js storefront + admin + customer dashboard, `:3000`)  
**Reference:** [UPrinting.com](https://www.uprinting.com/) style catalog & ops UX  

---

## Summary

Aaj catalog empty / filter bugs se le kar cart images, admin uploads, admin ops dashboard, CRM DB confirmation, customer dashboard (DB-backed), aur storefront pe **Saved Designs** exposure tak ka full stack work complete hua.

---

## 1. Products listing empty (`/products`) — ~10:42 AM

### Problem
- `http://localhost:3000/products` pe products nahi dikh rahe the.
- User chahte the ke UPrinting jaisi products DB + frontend pe hon.

### Root cause
- Database mein products practically empty / seed missing the.
- Frontend price filter `priceMax: 200` mehengi products ko hide kar raha tha.

### Fix
| Item | Detail |
|------|--------|
| DB seed | **189 products**, **14 categories** (UPrinting-style: business cards, stickers, banners, signs, packaging, apparel, etc.) |
| Price filter | `priceMax` **$200 → $1000** |
| Page size | Listing **6 → 12** products per page |
| Verify | `GET http://localhost:4000/api/products` → 189 products |

---

## 2. Cart — Event Tents galat / placeholder image — ~10:53 AM

### Problem
- Cart mein Event Tents ki image galat / placeholder (crowd photo) dikh rahi thi.

### Root cause
- Cart UI / mapping `imageUrl` properly pass nahi kar raha tha.
- Catalog mein Event Tents ke liye wrong Unsplash image thi.

### Fix
- Cart types + API mapping + store: `imageUrl` support.
- Event Tents image real tent/canopy photo se replace.
- Existing cart / product rows DB mein update.

**Verify:** `http://localhost:3000/cart`

---

## 3. Admin product image upload — save nahi hoti thi — ~10:59–11:13 AM

### Problem
- Admin se product image preview hoti thi lekin:
  - `uploads` folder mein file save nahi hoti thi
  - DB mein `imageUrl` persist nahi hota tha

### Root cause
- Admin sirf `data:` / preview URL use kar raha tha; real upload endpoint missing / discard on save.

### Fix
| Layer | Change |
|-------|--------|
| Backend | `POST /api/admin/uploads` → writes to `UPLOADS_DIR` (e.g. `D:\printoe\public\uploads`) |
| Frontend | Next.js `POST /api/uploads` (primary path) |
| Admin UI | `uploadAdminImage` → frontend then backend fallback; edit mode pe product `imageUrl` PATCH |
| Data | Demoo / affected products ke liye real uploaded file path DB mein set |

---

## 4. Admin Artwork Proofs + Admin Dashboard functional — ~11:18 AM

### Problem
- Proof **Approve** ke baad toast aata tha lekin UI phir bhi Approve dikhati thi.
- Overall Admin dashboard mock / incomplete tha; UPrinting-style ops chahiye thi.

### Root cause
- Proofs mock data (`admin-data.ts`) pe the; real DB status nahi.

### Fix
- Prisma: `ProofStatus` on `Order`, `Quote` model, AdminOps APIs:
  - `GET /admin/stats`, customers, proofs, quotes, etc.
- Frontend Admin sections / overview real APIs se wired.
- Proofs: Approved / Reopen correctly show hote hain.

---

## 5. CRM Menu save — DB confirmation — ~11:28 AM

### Question
- CRM mein banaya hua menu DB mein save hua ya nahi?

### Answer
**Haan — DB mein save hota hai.**  
Tables: `menus` + `menu_items` (user ka footer menu `mhor3r` confirm save).

---

## 6. Admin Dashboard overall DB-backed status — ~11:30 AM

### Status (as of today)

| Area | DB-backed? |
|------|------------|
| Products, categories | Yes |
| CRM menus / posts / pages | Yes |
| Orders, proofs, quotes, customers (admin) | Yes |
| Admin Settings | Mostly **localStorage** (abhi stub / client-only) |
| Stored payment methods / multi-user team | Stubs / not fully real |

---

## 7. Customer Dashboard (`/dashboard`) — functional + DB — ~11:31 AM

### Problem
- Customer dashboard almost mock tha (`lib/data`).
- Har menu functional + DB save chahiye tha (admin jaisa overall user flow).

### Fix
**Prisma models:** `WishlistItem`, `SupportTicket`, `SavedDesign`  

**APIs:** `/api/customer/*`  
- overview, quotes, downloads, invoices, notifications, wishlist, tickets, designs  

**Frontend:**  
- `DashboardSection.tsx` + `DashboardOverview.tsx` real APIs pe  
- Quote page: **Save quote to account**  
- Product listing heart → wishlist API  

**Still stub / honest empty:** payment methods, team invites; admin settings pattern alag.

---

## 8. Saved Designs missing on storefront — ~11:44 AM

### Problem
- Dashboard sidebar mein Saved Designs tha, lekin product page / header pe option nahi dikh raha tha.
- User: sidebar menus jahan apply hone chahiye wahan frontend pe bhi dikhain.

### Fix
| Place | What was added |
|-------|----------------|
| Product detail | **Save Design** button + link to `/dashboard/saved-designs` |
| Design Studio (`/editor`) | Real **Save design** → `createCustomerDesign` API |
| Header **Your Account** dropdown | Dashboard, Orders, Saved Designs, Wishlist, Quotations, Log out |
| Mobile menu | Same account links |
| Dashboard Saved Designs | Save ke baad list optimistic / immediate update |

---

## End-of-day architecture map

```
Storefront (:3000)          API (:4000)              PostgreSQL (u_printing)
─────────────────          ──────────              ─────────────────────
Products / Cart     →      /api/products, cart  →  products, cart_items
Admin uploads       →      /api/uploads + admin →  uploads + product.imageUrl
Admin ops           →      /api/admin/*         →  orders, quotes, proofs…
Customer hub        →      /api/customer/*      →  wishlist, tickets, designs…
CRM                 →      admin CRM APIs       →  menus, menu_items, posts…
```

---

## How to verify (checklist)

1. [ ] `http://localhost:3000/products` — products list (hard refresh)
2. [ ] `http://localhost:3000/cart` — Event Tents / items real images
3. [ ] Admin product edit — image upload → file in `public/uploads` + DB `imageUrl`
4. [ ] Admin Artwork Proofs — Approve → status Approved (not stuck on Approve)
5. [ ] CRM Menus — create/edit → rows in `menus` / `menu_items`
6. [ ] `http://localhost:3000/dashboard` — orders, wishlist, tickets, saved designs load from API
7. [ ] Product page → Save Design → appears under Account → Saved Designs
8. [ ] Header → Your Account dropdown shows Saved Designs etc.

---

## Known / remaining (not fully done today)

- Admin **Settings** still largely localStorage  
- Payment methods / team invites still stubs  
- Design Studio saves **metadata** (name / product), not full canvas JSON layers yet  
- Port **4000** `EADDRINUSE` / Prisma `EPERM` jab Nest query engine lock kare — process stop karke regenerate/restart  

---

## Timeline (today)

| Time (UTC-7) | Topic |
|--------------|--------|
| 10:42 | Products empty → seed 189 + filter fix |
| 10:53 | Cart Event Tents image |
| 10:59–11:13 | Admin image upload → uploads + DB |
| 11:18 | Admin proofs + ops dashboard DB |
| 11:28–11:30 | CRM menu DB confirm + admin DB status |
| 11:31 | Customer dashboard DB + APIs |
| 11:44 | Saved Designs on storefront + account menu |
| 11:51 | This daily report |

---

*Report generated from today’s Cursor session work on Printoe / printo_backend.*
