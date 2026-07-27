import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProofStatus, QuoteStatus } from '@prisma/client';

function toEnumUpper(value: unknown) {
  return typeof value === 'string' ? value.toUpperCase() : value;
}

export class UpdateProofStatusDto {
  @Transform(({ value }) => toEnumUpper(value))
  @IsEnum(ProofStatus)
  status!: ProofStatus;
}

export class UpdateQuoteStatusDto {
  @Transform(({ value }) => toEnumUpper(value))
  @IsEnum(QuoteStatus)
  status!: QuoteStatus;
}

export class CreateQuoteDto {
  @IsString()
  @MinLength(2)
  customerName!: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsString()
  @MinLength(2)
  productName!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
