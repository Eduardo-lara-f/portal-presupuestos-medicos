import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { QuoteItemSourceType } from '@prisma/client';

export class CreateQuoteItemDto {
  @IsEnum(QuoteItemSourceType)
  sourceType!: QuoteItemSourceType;

  @Type(() => Number)
  @IsInt()
  sourceId!: number;

  @IsString()
  description!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsString()
  type!: 'PROCEDURE' | 'BASKET' | 'PACKAGE' | 'MEDICAL_FEE';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;
}