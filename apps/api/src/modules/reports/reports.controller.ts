import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { ReportsSummaryQueryDto } from './dto/reports-summary-query.dto';

type AuthenticatedRequest = {
  user: {
    id: number;
    email: string;
    role: string;
  };
};

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  async getSummary(
    @Req() req: AuthenticatedRequest,
    @Query() query: ReportsSummaryQueryDto,
  ) {
    return this.reportsService.getSummary(req.user.id, query);
  }

  @Get('filters')
  async getFilters(@Req() req: AuthenticatedRequest) {
    return this.reportsService.getFilters(req.user.id);
  }
}