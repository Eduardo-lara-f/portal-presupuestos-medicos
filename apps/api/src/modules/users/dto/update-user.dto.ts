

import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CareType, UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  divisionId?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(CareType)
  careAccess?: CareType;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class UpdateUserStatusDto {
  @IsBoolean()
  status!: boolean;
}