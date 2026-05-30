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
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { UpdatePackageStatusDto } from './dto/update-package-status.dto';
import { PackagesService } from './packages.service';

@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

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

    return this.packagesService.findAll({
      divisionId: divisionId ? Number(divisionId) : undefined,
      search,
      active: parsedActive,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.packagesService.findOne(id);
  }

  @Post()
  async create(@Body() body: CreatePackageDto) {
    return this.packagesService.create(body);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePackageDto,
  ) {
    return this.packagesService.update(id, body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePackageStatusDto,
  ) {
    return this.packagesService.updateStatus(id, body.active);
  }
}