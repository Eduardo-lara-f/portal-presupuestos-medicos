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

export class UpdateBasketItemDto {
  @Type(() => Number)
  @IsInt()
  procedureId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  relevanceScore?: number;
}

export class UpdateBasketDto {
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
  @Type(() => UpdateBasketItemDto)
  items?: UpdateBasketItemDto[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}