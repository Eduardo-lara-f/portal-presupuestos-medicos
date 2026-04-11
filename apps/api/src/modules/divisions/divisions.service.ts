import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DivisionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.division.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
      },
    });
  }
}