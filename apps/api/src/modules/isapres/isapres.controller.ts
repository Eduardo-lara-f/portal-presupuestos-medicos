import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { IsapresService } from './isapres.service';

@Controller('isapres')
export class IsapresController {
  constructor(private readonly isapresService: IsapresService) {}

  @Get()
  async findByDivision(
    @Query('divisionId', ParseIntPipe) divisionId: number,
  ) {
    return this.isapresService.findByDivision(divisionId);
  }

  @Get(':id/plans')
  async findPlansByIsapre(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.isapresService.findPlansByIsapre(id);
  }
}