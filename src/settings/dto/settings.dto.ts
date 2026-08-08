import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSiteSettingsDto {
  @IsOptional() @IsString() storeName?: string;
  @IsOptional() @IsString() tagline?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() logoUrl?: string | null;
  @IsOptional() @IsString() faviconUrl?: string | null;
  @IsOptional() @IsString() primaryColor?: string;
  @IsOptional() @IsString() supportEmail?: string;
  @IsOptional() @IsString() supportPhone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() businessHours?: string;
  @IsOptional() @IsString() websiteUrl?: string;
  @IsOptional() @IsString() seoTitleTemplate?: string;
  @IsOptional() @IsString() seoDefaultDescription?: string;
  @IsOptional() @IsString() seoOgImageUrl?: string | null;
  @IsOptional() @IsString() googleAnalyticsId?: string | null;
  @IsOptional() @IsString() googleSearchConsole?: string | null;
  @IsOptional() @IsString() googleTagManagerId?: string | null;
  @IsOptional() @IsString() metaPixelId?: string | null;
  @IsOptional() @IsString() headerHtml?: string | null;
  @IsOptional() @IsString() bodyHtml?: string | null;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() currencySymbol?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() taxNote?: string | null;
  @IsOptional() @IsString() shippingNote?: string | null;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;
  @IsOptional() @IsBoolean() emailOnOrders?: boolean;
  @IsOptional() @IsBoolean() emailOnQuotes?: boolean;
  @IsOptional() @IsBoolean() emailOnProofs?: boolean;
  @IsOptional() @IsString() adminNotifyEmails?: string | null;
  @IsOptional() @IsBoolean() requireProof?: boolean;
  @IsOptional() @IsBoolean() allowGuestCheckout?: boolean;
  @IsOptional() @IsString() socialInstagram?: string | null;
  @IsOptional() @IsString() socialFacebook?: string | null;
  @IsOptional() @IsString() socialLinkedin?: string | null;
  @IsOptional() @IsString() socialTwitter?: string | null;
  @IsOptional() @IsString() socialYoutube?: string | null;
  @IsOptional() @IsBoolean() maintenanceMode?: boolean;
  @IsOptional() @IsString() maintenanceMessage?: string;
}
