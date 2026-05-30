import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateBasketDto } from './dto/create-basket.dto';
import { UpdateBasketDto } from './dto/update-basket.dto';
import { UpdateBasketStatusDto } from './dto/update-basket-status.dto';
import { BasketsService } from './baskets.service';

@Controller('baskets')
export class BasketsController {
  constructor(private readonly basketsService: BasketsService) {}

  @Get()
  async findAll(
    @Query('divisionId') divisionId?: string,
    @Query('search') search?: string,
    @Query('active') active?: string,
  ) {
    const parsedActive: boolean | undefined =
      active === undefined
        ? undefined
        : active === 'true'
        ? true
        : active === 'false'
        ? false
        : undefined;

    return this.basketsService.findAll({
      divisionId: divisionId ? Number(divisionId) : undefined,
      search,
      active: parsedActive,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.basketsService.findOne(id);
  }

  @Post()
  async create(@Body() body: CreateBasketDto) {
    return this.basketsService.create(body);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateBasketDto,
  ) {
    return this.basketsService.update(id, body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateBasketStatusDto,
  ) {
    return this.basketsService.updateStatus(id, body.active);
  }
}