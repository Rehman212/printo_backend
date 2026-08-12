# Exact variation pricing import

UPrinting pricing is combination-based, not additive. Each complete selection is stored in `product_variation_prices`; option-level `priceAdd` is not used for imported products.

## Deploy

1. Apply migrations: `npx prisma migrate deploy`
2. Generate Prisma client: `npm run prisma:generate`
3. Build/restart API: `npm run build`

Admin import endpoints use the existing ADMIN guards:

- `POST /api/admin/products/:id/pricing-matrix/begin`
- `POST /api/admin/products/:id/pricing-matrix/chunk` (maximum 1,000 rows)
- `POST /api/admin/products/:id/pricing-matrix/complete`

The storefront uses `POST /api/products/:slug/price` to resolve the exact canonical selection key.
