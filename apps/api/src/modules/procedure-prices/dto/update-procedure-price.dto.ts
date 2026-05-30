import { Type } from 'class-transformer';
import {
  IsBoolean,
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

export class UpdateProcedurePriceDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  divisionId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  procedureId?: number;

  @IsOptional()
  @IsEnum(CoverageType)
  coverageType?: CoverageType;

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

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}