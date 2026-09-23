-- Ensure singleton site_settings exists with columns the Prisma client expects.
-- Table was historically created outside migrations / with an older shape.

CREATE TABLE IF NOT EXISTS "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "storeName" TEXT NOT NULL DEFAULT 'Printoe',
    "tagline" TEXT NOT NULL DEFAULT 'Enterprise print, perfected.',
    "description" TEXT NOT NULL DEFAULT 'Custom business cards, packaging, banners, and more — print that looks as good as it sells.',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#e6007a',
    "supportEmail" TEXT NOT NULL DEFAULT 'hello@printoe.com',
    "supportPhone" TEXT NOT NULL DEFAULT '+1 (888) 555-0199',
    "address" TEXT NOT NULL DEFAULT '450 Market Street, Suite 1200, San Francisco, CA 94105',
    "businessHours" TEXT NOT NULL DEFAULT 'Mon–Fri 9am–6pm PT',
    "websiteUrl" TEXT NOT NULL DEFAULT 'https://printoe.com',
    "seoTitleTemplate" TEXT NOT NULL DEFAULT '%s | Printoe',
    "seoDefaultDescription" TEXT NOT NULL DEFAULT 'Custom printing for business cards, packaging, banners, apparel, and more.',
    "seoOgImageUrl" TEXT,
    "googleAnalyticsId" TEXT,
    "googleSearchConsole" TEXT,
    "googleTagManagerId" TEXT,
    "metaPixelId" TEXT,
    "headerHtml" TEXT,
    "bodyHtml" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "currencySymbol" TEXT NOT NULL DEFAULT '$',
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "taxNote" TEXT,
    "shippingNote" TEXT,
    "minOrderAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emailOnOrders" BOOLEAN NOT NULL DEFAULT true,
    "emailOnQuotes" BOOLEAN NOT NULL DEFAULT true,
    "emailOnProofs" BOOLEAN NOT NULL DEFAULT true,
    "adminNotifyEmails" TEXT,
    "requireProof" BOOLEAN NOT NULL DEFAULT true,
    "allowGuestCheckout" BOOLEAN NOT NULL DEFAULT false,
    "socialInstagram" TEXT,
    "socialFacebook" TEXT,
    "socialLinkedin" TEXT,
    "socialTwitter" TEXT,
    "socialYoutube" TEXT,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT NOT NULL DEFAULT 'We''re upgrading our systems. Please check back shortly.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "storeName" TEXT NOT NULL DEFAULT 'Printoe';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "tagline" TEXT NOT NULL DEFAULT 'Enterprise print, perfected.';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT 'Custom business cards, packaging, banners, and more — print that looks as good as it sells.';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "faviconUrl" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT NOT NULL DEFAULT '#e6007a';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "supportEmail" TEXT NOT NULL DEFAULT 'hello@printoe.com';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "supportPhone" TEXT NOT NULL DEFAULT '+1 (888) 555-0199';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "address" TEXT NOT NULL DEFAULT '450 Market Street, Suite 1200, San Francisco, CA 94105';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "businessHours" TEXT NOT NULL DEFAULT 'Mon–Fri 9am–6pm PT';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT NOT NULL DEFAULT 'https://printoe.com';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "seoTitleTemplate" TEXT NOT NULL DEFAULT '%s | Printoe';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "seoDefaultDescription" TEXT NOT NULL DEFAULT 'Custom printing for business cards, packaging, banners, apparel, and more.';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "seoOgImageUrl" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "googleAnalyticsId" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "googleSearchConsole" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "googleTagManagerId" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "metaPixelId" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "headerHtml" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "bodyHtml" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "currencySymbol" TEXT NOT NULL DEFAULT '$';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "taxNote" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "shippingNote" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "minOrderAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "emailOnOrders" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "emailOnQuotes" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "emailOnProofs" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "adminNotifyEmails" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "requireProof" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "allowGuestCheckout" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "socialInstagram" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "socialFacebook" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "socialLinkedin" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "socialTwitter" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "socialYoutube" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "maintenanceMode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "maintenanceMessage" TEXT NOT NULL DEFAULT 'We''re upgrading our systems. Please check back shortly.';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

INSERT INTO "site_settings" ("id")
VALUES ('default')
ON CONFLICT ("id") DO NOTHING;
