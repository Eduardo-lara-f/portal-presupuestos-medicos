import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CoverageType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type ResolvePriceParams = {
  divisionId: number;
  procedureId: number;
  coverageType: CoverageType;
  isapreId?: number;
  isaprePlanId?: number;
  fonasaCode?: string;
};

@Injectable()
export class ProcedurePricesService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(params: ResolvePriceParams) {
    const { divisionId, procedureId, coverageType, isapreId, isaprePlanId, fonasaCode } = params;

    if (coverageType === CoverageType.ISAPRE_PLAN && !isaprePlanId) {
      throw new BadRequestException('isaprePlanId es obligatorio para coverageType=ISAPRE_PLAN');
    }

    if (coverageType === CoverageType.FONASA && !fonasaCode) {
      throw new BadRequestException('fonasaCode es obligatorio para coverageType=FONASA');
    }

    const price = await this.prisma.procedurePrice.findFirst({
      where: {
        divisionId,
        procedureId,
        coverageType,
        isapreId: isapreId ?? undefined,
        isaprePlanId: isaprePlanId ?? undefined,
        fonasaCode: fonasaCode ?? undefined,
        deletedAt: null,
        active: true,
      },
      orderBy: {
        id: 'desc',
      },
      select: {
        id: true,
        divisionId: true,
        procedureId: true,
        coverageType: true,
        isapreId: true,
        isaprePlanId: true,
        fonasaCode: true,
        payerLabel: true,
        price: true,
        currency: true,
        active: true,
      },
    });

    if (!price) {
      throw new NotFoundException('No se encontró precio para la combinación solicitada');
    }

    return price;
  }
}