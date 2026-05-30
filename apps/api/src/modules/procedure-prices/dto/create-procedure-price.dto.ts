import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { CoverageType } from '@prisma/client';

export class CreateProcedurePriceDto {
  @Type(() => Number)
  @IsInt()
  divisionId!: number;

  @Type(() => Number)
  @IsInt()
  procedureId!: number;

  @IsEnum(CoverageType)
  coverageType!: CoverageType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  isapreId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  isaprePlanId?: number;

  @IsOptional()
  @IsString()
  fonasaCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  payerLabel?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}