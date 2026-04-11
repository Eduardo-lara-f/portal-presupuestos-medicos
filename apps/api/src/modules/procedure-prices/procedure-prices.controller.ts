import {
  Controller,
  Get,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { CoverageType } from '@prisma/client';
import { ProcedurePricesService } from './procedure-prices.service';

@Controller('procedure-prices')
export class ProcedurePricesController {
  constructor(private readonly procedurePricesService: ProcedurePricesService) {}

  @Get('resolve')
  async resolve(
    @Query('divisionId', ParseIntPipe) divisionId: number,
    @Query('procedureId', ParseIntPipe) procedureId: number,
    @Query('coverageType', new ParseEnumPipe(CoverageType)) coverageType: CoverageType,
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
}