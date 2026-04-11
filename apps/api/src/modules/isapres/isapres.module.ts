import { Module } from '@nestjs/common';
import { IsapresController } from './isapres.controller';
import { IsapresService } from './isapres.service';

@Module({
  controllers: [IsapresController],
  providers: [IsapresService],
})
export class IsapresModule {}