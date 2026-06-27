import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { QuoteStatus } from '@prisma/client';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CreateQuoteItemDto } from './dto/create-quote-item.dto';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('divisionId') divisionId?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.quotesService.findAll({
      status: status as QuoteStatus | undefined,
      divisionId: divisionId ? Number(divisionId) : undefined,
      patientId: patientId ? Number(patientId) : undefined,
    });
  }

  @Post()
  async create(@Body() body: CreateQuoteDto) {
    return this.quotesService.create(body);
  }

  @Post(':id/items')
  async addItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateQuoteItemDto,
  ) {
    return this.quotesService.addItem(id, body);
  }

  @Patch(':id/items/:itemId')
  async updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() body: { quantity?: number },
  ) {
    return this.quotesService.updateItem(id, itemId, body);
  }

  @Delete(':id/items/:itemId')
  async deleteItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.quotesService.deleteItem(id, itemId);
  }

  @Delete(':id/groups/:groupItemId')
  async deleteGroup(
    @Param('id', ParseIntPipe) id: number,
    @Param('groupItemId', ParseIntPipe) groupItemId: number,
  ) {
    return this.quotesService.deleteGroup(id, groupItemId);
  }

  @Post(':id/packages')
  async addPackage(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      packageId: number;
      applyCampaign?: boolean;
      campaignId?: number;
      padFactor?: number;
    },
  ) {
    return this.quotesService.addPackage(id, body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: QuoteStatus,
  ) {
    return this.quotesService.updateStatus(id, status);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quotesService.findOne(id);
  }
}