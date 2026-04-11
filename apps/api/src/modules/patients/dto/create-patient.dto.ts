export class CreatePatientDto {
  divisionId!: number;
  rut!: string;
  firstName!: string;
  lastName!: string;
  middleName?: string;
  birthDate?: string;
  sex?: string;
  email?: string;
  phone?: string;
  address?: string;
}