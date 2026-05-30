import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class UpdatePackageItemDto {
  @Type(() => Number)
  @IsInt()
  procedureId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  priceMode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fixedPrice?: number;
}

export class UpdatePackageDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  divisionId?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePackageItemDto)
  items?: UpdatePackageItemDto[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}