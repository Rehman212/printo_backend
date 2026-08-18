import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Raw shape produced by the UPrinting scraper (product-*.printoe.json) -
 * intentionally loose validation since attributes/prices carry whatever
 * fields that scrape run happened to capture.
 *
 * attributes/prices MUST carry @Type(() => Object): a bare `Array<{...}>`
 * annotation with no explicit element type leaves class-transformer's
 * design:type metadata as plain `Array`, and with enableImplicitConversion
 * on (see main.ts) it then reconstructs every nested plain object as an
 * *empty Array instance* with the real fields hung off as non-index
 * properties - which JSON.stringify silently drops. @Type(() => Object)
 * tells it each element is a plain object, not another Array.
 */
export class ImportScrapeDto {
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  default_selection?: Record<string, string>;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  product_image?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  video?: string;

  @IsOptional()
  @IsArray()
  errors?: unknown[];

  @IsArray()
  @Type(() => Object)
  attributes!: Array<{
    attribute_id?: string;
    attributeId?: string;
    name: string;
    /** "buttons" marks the synthesized linked-calculator type switcher (see preview_server.py) - renders as CARDS, not a dropdown. */
    field_type?: string;
    defaults_by_product?: Record<string, string>;
    hide_rules_by_product?: Record<string, Array<Record<string, string>>>;
    options: Array<{
      option_id?: string;
      optionId?: string;
      label: string;
      default?: boolean;
      available_product_ids?: string[];
      exclusion_rules_by_product?: Record<string, Array<Record<string, string>>>;
    }>;
  }>;

  @IsArray()
  @Type(() => Object)
  prices!: Array<{
    selection: Record<string, string>;
    price: number | string;
    unit_price?: number | string;
    unitPrice?: number | string;
    quantity: number;
    turnaround_days?: number;
    turnaroundDays?: number;
    in_stock?: string | boolean;
    inStock?: boolean;
  }>;

  /** Best-effort category name, e.g. derived from the source page - matched by name, auto-created if no match. */
  @IsOptional()
  @IsString()
  categoryHint?: string;
}
