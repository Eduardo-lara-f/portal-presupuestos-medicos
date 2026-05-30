import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProcedurePricesController } from './procedure-prices.controller';
import { ProcedurePricesService } from './procedure-prices.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProcedurePricesController],
  providers: [ProcedurePricesService],
  exports: [ProcedurePricesService],
})
export class ProcedurePricesModule {}