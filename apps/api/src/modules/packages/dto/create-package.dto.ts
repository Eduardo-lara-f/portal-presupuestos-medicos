import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreatePackageItemDto {
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

export class CreatePackageDto {
  @Type(() => Number)
  @IsInt()
  divisionId!: number;

  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageItemDto)
  items!: CreatePackageItemDto[];
}