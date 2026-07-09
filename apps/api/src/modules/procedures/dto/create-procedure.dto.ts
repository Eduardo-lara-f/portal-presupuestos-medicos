import { CareType, CatalogItemType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProcedureDto {
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

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(CatalogItemType)
  itemType?: CatalogItemType;

  @IsOptional()
  @IsEnum(CareType)
  careType?: CareType;
}