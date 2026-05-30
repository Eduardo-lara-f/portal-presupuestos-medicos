import { IsBoolean } from 'class-validator';

export class UpdateProcedureStatusDto {
  @IsBoolean()
  active!: boolean;
}