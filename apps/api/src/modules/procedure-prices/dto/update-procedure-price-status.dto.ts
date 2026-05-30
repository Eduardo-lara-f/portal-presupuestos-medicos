import { IsBoolean } from 'class-validator';

export class UpdateProcedurePriceStatusDto {
  @IsBoolean()
  active!: boolean;
}