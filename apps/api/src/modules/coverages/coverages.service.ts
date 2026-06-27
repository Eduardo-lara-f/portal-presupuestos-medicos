import { Injectable } from '@nestjs/common';
import { CoverageType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CoveragesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalog(divisionId: number) {
    const [isapres, prices] = await Promise.all([
      this.prisma.isapre.findMany({
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
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          code: true,
        },
      }),
      this.prisma.procedurePrice.findMany({
        where: {
          divisionId,
          deletedAt: null,
          active: true,
        },
        select: {
          coverageType: true,
        },
        distinct: ['coverageType'],
      }),
    ]);

    const enabledCoverageTypes = new Set(prices.map((item) => item.coverageType));
    const hasIsapres = isapres.length > 0;

    return {
      divisionId,
      coverages: [
        {
          type: CoverageType.ISAPRE_PLAN,
          label: 'Isapre + plan',
          enabled: hasIsapres,
          requiresIsapre: true,
          requiresPlan: true,
          requiresFonasaCode: false,
          requiresPayerLabel: false,
        },
        {
          type: CoverageType.FONASA,
          label: 'Fonasa',
          enabled: enabledCoverageTypes.has(CoverageType.FONASA),
          requiresIsapre: false,
          requiresPlan: false,
          requiresFonasaCode: true,
          requiresPayerLabel: false,
        },
        {
          type: CoverageType.PARTICULAR,
          label: 'Particular',
          enabled: enabledCoverageTypes.has(CoverageType.PARTICULAR),
          requiresIsapre: false,
          requiresPlan: false,
          requiresFonasaCode: false,
          requiresPayerLabel: true,
        },
        {
          type: CoverageType.OTHER,
          label: 'Otro',
          enabled: enabledCoverageTypes.has(CoverageType.OTHER),
          requiresIsapre: false,
          requiresPlan: false,
          requiresFonasaCode: false,
          requiresPayerLabel: true,
        },
      ],
      isapres,
    };
  }
}