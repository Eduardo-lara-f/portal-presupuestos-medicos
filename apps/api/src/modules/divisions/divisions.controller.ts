import { Controller, Get } from '@nestjs/common';
import { DivisionsService } from './divisions.service';

@Controller('divisions')
export class DivisionsController {
  constructor(private readonly divisionsService: DivisionsService) {}

  @Get()
  async findAll() {
    return this.divisionsService.findAll();
  }
}