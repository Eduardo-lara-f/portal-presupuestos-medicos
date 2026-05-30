import { IsBoolean } from 'class-validator';

export class UpdatePackageStatusDto {
  @IsBoolean()
  active!: boolean;
}