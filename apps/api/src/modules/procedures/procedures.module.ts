import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProceduresController } from './procedures.controller';
import { ProceduresService } from './procedures.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProceduresController],
  providers: [ProceduresService],
  exports: [ProceduresService],
})
export class ProceduresModule {}