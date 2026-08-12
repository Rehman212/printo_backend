import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VariationPriceRowDto {
  @IsObject()
  selection!: Record<string, string>;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  turnaroundDays?: number;

  @IsOptional()
  @IsBoolean()
  inStock?: boolean;
}

export class VariationPriceChunkDto {
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => VariationPriceRowDto)
  rows!: VariationPriceRowDto[];
}

export class BeginPricingMatrixDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  sourceUrl?: string;
}

export class CompletePricingMatrixDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedRows!: number;
}
