import { Module } from '@nestjs/common';
import { ProcedurePricesController } from './procedure-prices.controller';
import { ProcedurePricesService } from './procedure-prices.service';

@Module({
  controllers: [ProcedurePricesController],
  providers: [ProcedurePricesService],
})
export class ProcedurePricesModule {}