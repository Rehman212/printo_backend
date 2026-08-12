ALTER TABLE "products"
ADD COLUMN "pricingMatrixEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "pricingSourceUrl" TEXT,
ADD COLUMN "pricingImportedAt" TIMESTAMP(3);

CREATE TABLE "product_variation_prices" (
    "id" BIGSERIAL NOT NULL,
    "productId" TEXT NOT NULL,
    "selectionKey" TEXT NOT NULL,
    "selection" JSONB NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "turnaroundDays" INTEGER,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_variation_prices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_variation_prices_productId_selectionKey_key"
ON "product_variation_prices"("productId", "selectionKey");
CREATE INDEX "product_variation_prices_productId_idx"
ON "product_variation_prices"("productId");
ALTER TABLE "product_variation_prices"
ADD CONSTRAINT "product_variation_prices_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
