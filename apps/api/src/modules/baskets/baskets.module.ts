import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BasketsController } from './baskets.controller';
import { BasketsService } from './baskets.service';

@Module({
  imports: [PrismaModule],
  controllers: [BasketsController],
  providers: [BasketsService],
  exports: [BasketsService],
})
export class BasketsModule {}