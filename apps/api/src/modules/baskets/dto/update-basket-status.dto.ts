import { IsBoolean } from 'class-validator';

export class UpdateBasketStatusDto {
  @IsBoolean()
  active!: boolean;
}