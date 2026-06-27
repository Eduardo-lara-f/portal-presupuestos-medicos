import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CoveragesController } from './coverages.controller';
import { CoveragesService } from './coverages.service';

@Module({
  imports: [PrismaModule],
  controllers: [CoveragesController],
  providers: [CoveragesService],
  exports: [CoveragesService],
})
export class CoveragesModule {}