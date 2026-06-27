import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CareType, CoverageType } from '@prisma/client';
import { CreateQuoteItemDto } from './create-quote-item.dto';

export class CreateQuoteDto {
  @Type(() => Number)
  @IsNumber()
  divisionId!: number;

  @Type(() => Number)
  @IsNumber()
  patientId!: number;

  @IsEnum(CoverageType)
  coverageType!: CoverageType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  isapreId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  isaprePlanId?: number;

  @IsOptional()
  @IsString()
  fonasaCode?: string;

  @IsOptional()
  @IsString()
  payerLabel?: string;

  @IsEnum(CareType)
  careType!: CareType;

  @IsOptional()
  @IsString()
  notes?: string;

  @Type(() => Number)
  @IsNumber()
  createdByUserId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  validityDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discountTotal?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  items!: CreateQuoteItemDto[];
}