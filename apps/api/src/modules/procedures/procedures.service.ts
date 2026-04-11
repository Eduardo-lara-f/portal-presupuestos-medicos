import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProceduresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(divisionId: number, search?: string) {
    return this.prisma.procedure.findMany({
      where: {
        divisionId,
        deletedAt: null,
        active: true,
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  code: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        divisionId: true,
        code: true,
        name: true,
        description: true,
        category: true,
        careType: true,
        active: true,
      },
    });
  }
}