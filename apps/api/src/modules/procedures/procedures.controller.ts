import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CareType } from '@prisma/client';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureStatusDto } from './dto/update-procedure-status.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';
import { ProceduresService } from './procedures.service';

@Controller('procedures')
export class ProceduresController {
  constructor(private readonly proceduresService: ProceduresService) {}

@Get()
async findAll(
  @Query('divisionId') divisionId?: string,
  @Query('search') search?: string,
  @Query('careType') careType?: CareType,
  @Query('category') category?: string,
  @Query('active') active?: string,
) {
  const parsedActive: boolean | undefined =
    active === undefined
      ? undefined
      : active === 'true'
      ? true
      : active === 'false'
      ? false
      : undefined;

  return this.proceduresService.findAll({
    divisionId: divisionId ? Number(divisionId) : undefined,
    search,
    careType,
    category,
    active: parsedActive,
  });
}

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.proceduresService.findOne(id);
  }

  @Post()
  async create(@Body() body: CreateProcedureDto) {
    return this.proceduresService.create(body);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProcedureDto,
  ) {
    return this.proceduresService.update(id, body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProcedureStatusDto,
  ) {
    return this.proceduresService.updateStatus(id, body.active);
  }
}