import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ProceduresService } from './procedures.service';

@Controller('procedures')
export class ProceduresController {
  constructor(private readonly proceduresService: ProceduresService) {}

  @Get()
  async findAll(
    @Query('divisionId', ParseIntPipe) divisionId: number,
    @Query('search') search?: string,
  ) {
    return this.proceduresService.findAll(divisionId, search);
  }
}