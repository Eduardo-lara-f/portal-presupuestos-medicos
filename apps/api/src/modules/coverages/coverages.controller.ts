import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { CoveragesService } from './coverages.service';

@Controller('coverages')
export class CoveragesController {
  constructor(private readonly coveragesService: CoveragesService) {}

  @Get('catalog')
  async getCatalog(
    @Query('divisionId', ParseIntPipe) divisionId: number,
  ) {
    return this.coveragesService.getCatalog(divisionId);
  }
}