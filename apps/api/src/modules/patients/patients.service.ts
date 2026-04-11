import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByRut(rut: string, divisionId: number) {
    return this.prisma.patient.findFirst({
      where: {
        rut,
        divisionId,
        deletedAt: null,
      },
      select: {
        id: true,
        divisionId: true,
        rut: true,
        firstName: true,
        lastName: true,
        middleName: true,
        birthDate: true,
        sex: true,
        email: true,
        phone: true,
        address: true,
      },
    });
  }

  async create(data: CreatePatientDto) {
    return this.prisma.patient.create({
      data: {
        divisionId: data.divisionId,
        rut: data.rut,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        sex: data.sex,
        email: data.email,
        phone: data.phone,
        address: data.address,
        deletedAt: null,
      },
      select: {
        id: true,
        divisionId: true,
        rut: true,
        firstName: true,
        lastName: true,
        middleName: true,
        birthDate: true,
        sex: true,
        email: true,
        phone: true,
        address: true,
      },
    });
  }
}