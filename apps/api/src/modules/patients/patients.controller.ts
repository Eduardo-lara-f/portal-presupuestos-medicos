import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get('by-rut/:rut')
  async findByRut(
    @Param('rut') rut: string,
    @Query('divisionId', ParseIntPipe) divisionId: number,
  ) {
    return this.patientsService.findByRut(rut, divisionId);
  }

  @Post()
  async create(@Body() body: CreatePatientDto) {
    return this.patientsService.create(body);
  }
}