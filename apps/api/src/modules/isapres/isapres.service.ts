import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IsapresService {
  constructor(private readonly prisma: PrismaService) {}

  async findByDivision(divisionId: number) {
    return this.prisma.isapre.findMany({
      where: {
        deletedAt: null,
        active: true,
        divisionLinks: {
          some: {
            divisionId,
            deletedAt: null,
            active: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        name: true,
        code: true,
        active: true,
      },
    });
  }

  async findPlansByIsapre(isapreId: number) {
    return this.prisma.isaprePlan.findMany({
      where: {
        isapreId,
        deletedAt: null,
        active: true,
      },
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        isapreId: true,
        name: true,
        code: true,
        active: true,
      },
    });
  }
}