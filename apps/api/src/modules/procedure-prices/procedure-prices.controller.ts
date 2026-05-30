import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CoverageType } from '@prisma/client';
import { CreateProcedurePriceDto } from './dto/create-procedure-price.dto';
import { UpdateProcedurePriceDto } from './dto/update-procedure-price.dto';
import { UpdateProcedurePriceStatusDto } from './dto/update-procedure-price-status.dto';
import { ProcedurePricesService } from './procedure-prices.service';

@Controller('procedure-prices')
export class ProcedurePricesController {
  constructor(private readonly procedurePricesService: ProcedurePricesService) {}

  @Get('resolve')
  async resolve(
    @Query('divisionId', ParseIntPipe) divisionId: number,
    @Query('procedureId', ParseIntPipe) procedureId: number,
    @Query('coverageType', new ParseEnumPipe(CoverageType))
    coverageType: CoverageType,
    @Query('isapreId') isapreId?: string,
    @Query('isaprePlanId') isaprePlanId?: string,
    @Query('fonasaCode') fonasaCode?: string,
  ) {
    return this.procedurePricesService.resolve({
      divisionId,
      procedureId,
      coverageType,
      isapreId: isapreId ? Number(isapreId) : undefined,
      isaprePlanId: isaprePlanId ? Number(isaprePlanId) : undefined,
      fonasaCode,
    });
  }

  @Get()
  async findAll(
    @Query('divisionId') divisionId?: string,
    @Query('procedureId') procedureId?: string,
    @Query('coverageType') coverageType?: string,
    @Query('active') active?: string,
    @Query('search') search?: string,
  ) {
    const parsedActive =
      active === undefined
        ? undefined
        : active === 'true'
        ? true
        : active === 'false'
        ? false
        : undefined;

    const parsedCoverageType =
      coverageType && Object.values(CoverageType).includes(coverageType as CoverageType)
        ? (coverageType as CoverageType)
        : undefined;

    return this.procedurePricesService.findAll({
      divisionId: divisionId ? Number(divisionId) : undefined,
      procedureId: procedureId ? Number(procedureId) : undefined,
      coverageType: parsedCoverageType,
      active: parsedActive,
      search,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.procedurePricesService.findOne(id);
  }

  @Post()
  async create(@Body() body: CreateProcedurePriceDto) {
    return this.procedurePricesService.create(body);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProcedurePriceDto,
  ) {
    return this.procedurePricesService.update(id, body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProcedurePriceStatusDto,
  ) {
    return this.procedurePricesService.updateStatus(id, body.active);
  }
}