import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CoverageType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProcedurePriceDto } from './dto/create-procedure-price.dto';
import { UpdateProcedurePriceDto } from './dto/update-procedure-price.dto';

@Injectable()
export class ProcedurePricesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalog(divisionId: number) {
    const prices = await this.prisma.procedurePrice.findMany({
      where: {
        divisionId,
        deletedAt: null,
        active: true,
      },
      select: {
        coverageType: true,
      },
      distinct: ['coverageType'],
    });

    const enabledCoverageTypes = new Set(
      prices.map((price) => price.coverageType),
    );

    const divisionIsapres = await this.prisma.divisionIsapre.findMany({
      where: {
        divisionId,
        active: true,
        deletedAt: null,
        isapre: {
          active: true,
          deletedAt: null,
        },
      },
      orderBy: {
        isapre: {
          name: 'asc',
        },
      },
      select: {
        isapre: {
          select: {
            id: true,
            name: true,
            code: true,
            active: true,
          },
        },
      },
    });

    const isapres = divisionIsapres.map((link) => link.isapre);
    const hasActiveDivisionIsapres = isapres.length > 0;

    const coverages = [
      {
        type: CoverageType.ISAPRE_PLAN,
        label: 'Isapre / Plan',
        enabled:
          enabledCoverageTypes.has(CoverageType.ISAPRE_PLAN) ||
          hasActiveDivisionIsapres,
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
        label: 'Otro pagador',
        enabled: enabledCoverageTypes.has(CoverageType.OTHER),
        requiresIsapre: false,
        requiresPlan: false,
        requiresFonasaCode: false,
        requiresPayerLabel: true,
      },
    ];


    return {
      divisionId,
      coverages,
      isapres,
    };
  }

  async resolve(params: {
    divisionId: number;
    procedureId: number;
    coverageType: CoverageType;
    isapreId?: number;
    isaprePlanId?: number;
    fonasaCode?: string;
  }) {
    const now = new Date();

    const where: Prisma.ProcedurePriceWhereInput = {
      deletedAt: null,
      active: true,
      divisionId: params.divisionId,
      procedureId: params.procedureId,
      coverageType: params.coverageType,
      OR: [
        {
          AND: [{ effectiveFrom: null }, { effectiveTo: null }],
        },
        {
          AND: [{ effectiveFrom: { lte: now } }, { effectiveTo: null }],
        },
        {
          AND: [{ effectiveFrom: null }, { effectiveTo: { gte: now } }],
        },
        {
          AND: [
            { effectiveFrom: { lte: now } },
            { effectiveTo: { gte: now } },
          ],
        },
      ],
    };

    if (params.coverageType === CoverageType.ISAPRE_PLAN) {
      if (!params.isapreId || !params.isaprePlanId) {
        throw new BadRequestException(
          'Para cobertura ISAPRE_PLAN debe indicar isapreId e isaprePlanId.',
        );
      }

      where.isapreId = params.isapreId;
      where.isaprePlanId = params.isaprePlanId;
      where.fonasaCode = null;
    }

    if (params.coverageType === CoverageType.FONASA) {
      where.isapreId = null;
      where.isaprePlanId = null;
      where.fonasaCode = params.fonasaCode?.trim() || null;
    }

    if (
      params.coverageType === CoverageType.PARTICULAR ||
      params.coverageType === CoverageType.OTHER
    ) {
      where.isapreId = null;
      where.isaprePlanId = null;
      where.fonasaCode = null;
    }

    const record = await this.prisma.procedurePrice.findFirst({
      where,
      orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
    });

    if (!record) {
      throw new NotFoundException(
        'No existe un precio configurado para la combinación solicitada.',
      );
    }

    return record;
  }

  async findAll(params: {
    divisionId?: number;
    procedureId?: number;
    coverageType?: CoverageType;
    active?: boolean;
    search?: string;
  }) {
    const where: Prisma.ProcedurePriceWhereInput = {
      deletedAt: null,
    };

    if (params.divisionId) {
      where.divisionId = params.divisionId;
    }

    if (params.procedureId) {
      where.procedureId = params.procedureId;
    }

    if (params.coverageType) {
      where.coverageType = params.coverageType;
    }

    if (typeof params.active === 'boolean') {
      where.active = params.active;
    }

    if (params.search?.trim()) {
      const search = params.search.trim();

      where.OR = [
        {
          procedure: {
            code: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          procedure: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          payerLabel: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          fonasaCode: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return this.prisma.procedurePrice.findMany({
      where,
      orderBy: [
        { divisionId: 'asc' },
        { procedureId: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        division: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        procedure: {
          select: {
            id: true,
            code: true,
            name: true,
            careType: true,
            active: true,
          },
        },
        isapre: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        isaprePlan: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.procedurePrice.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        division: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        procedure: {
          select: {
            id: true,
            code: true,
            name: true,
            careType: true,
            active: true,
          },
        },
        isapre: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        isaprePlan: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Precio no encontrado.');
    }

    return record;
  }

  private normalizeCoverageData(input: {
    divisionId: number;
    procedureId: number;
    coverageType: CoverageType;
    isapreId?: number;
    isaprePlanId?: number;
    fonasaCode?: string;
    payerLabel?: string;
    price: number;
    currency?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    active?: boolean;
  }) {
    const coverageType = input.coverageType;

    let isapreId: number | null = input.isapreId ?? null;
    let isaprePlanId: number | null = input.isaprePlanId ?? null;
    let fonasaCode: string | null = input.fonasaCode?.trim() || null;
    let payerLabel: string | null = input.payerLabel?.trim() || null;

    if (coverageType === CoverageType.ISAPRE_PLAN) {
      if (!isapreId || !isaprePlanId) {
        throw new BadRequestException(
          'Para cobertura ISAPRE_PLAN debe indicar isapre y plan.',
        );
      }

      fonasaCode = null;
      payerLabel = null;
    }

    if (coverageType === CoverageType.FONASA) {
      isapreId = null;
      isaprePlanId = null;
      payerLabel = null;
    }

    if (
      coverageType === CoverageType.PARTICULAR ||
      coverageType === CoverageType.OTHER
    ) {
      isapreId = null;
      isaprePlanId = null;
      fonasaCode = null;
    }

    const effectiveFrom = input.effectiveFrom
      ? new Date(input.effectiveFrom)
      : null;

    const effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;

    if (effectiveFrom && effectiveTo && effectiveTo < effectiveFrom) {
      throw new BadRequestException(
        'effectiveTo no puede ser menor que effectiveFrom.',
      );
    }

    return {
      divisionId: input.divisionId,
      procedureId: input.procedureId,
      coverageType,
      isapreId,
      isaprePlanId,
      fonasaCode,
      payerLabel,
      price: input.price,
      currency: input.currency?.trim() || 'CLP',
      effectiveFrom,
      effectiveTo,
      active: input.active ?? true,
    };
  }

  private async ensureNoDuplicate(
    normalized: {
      divisionId: number;
      procedureId: number;
      coverageType: CoverageType;
      isapreId: number | null;
      isaprePlanId: number | null;
      fonasaCode: string | null;
      payerLabel: string | null;
    },
    ignoreId?: number,
  ) {
    const duplicated = await this.prisma.procedurePrice.findFirst({
      where: {
        id: ignoreId ? { not: ignoreId } : undefined,
        deletedAt: null,
        divisionId: normalized.divisionId,
        procedureId: normalized.procedureId,
        coverageType: normalized.coverageType,
        isapreId: normalized.isapreId,
        isaprePlanId: normalized.isaprePlanId,
        fonasaCode: normalized.fonasaCode,
        payerLabel: normalized.payerLabel,
      },
    });

    if (duplicated) {
      throw new ConflictException(
        'Ya existe un precio con la misma combinación de división, prestación y cobertura.',
      );
    }
  }

  async create(dto: CreateProcedurePriceDto) {
    const normalized = this.normalizeCoverageData({
      ...dto,
      active: true,
    });

    await this.ensureNoDuplicate(normalized);

    return this.prisma.procedurePrice.create({
      data: normalized,
      include: {
        division: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        procedure: {
          select: {
            id: true,
            code: true,
            name: true,
            careType: true,
            active: true,
          },
        },
        isapre: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        isaprePlan: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateProcedurePriceDto) {
    const current = await this.prisma.procedurePrice.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!current) {
      throw new NotFoundException('Precio no encontrado.');
    }

    const normalized = this.normalizeCoverageData({
      divisionId: dto.divisionId ?? current.divisionId,
      procedureId: dto.procedureId ?? current.procedureId,
      coverageType: dto.coverageType ?? current.coverageType,
      isapreId: dto.isapreId ?? current.isapreId ?? undefined,
      isaprePlanId: dto.isaprePlanId ?? current.isaprePlanId ?? undefined,
      fonasaCode:
        dto.fonasaCode !== undefined
          ? dto.fonasaCode
          : current.fonasaCode ?? undefined,
      payerLabel:
        dto.payerLabel !== undefined
          ? dto.payerLabel
          : current.payerLabel ?? undefined,
      price: dto.price ?? Number(current.price),
      currency: dto.currency ?? current.currency,
      effectiveFrom:
        dto.effectiveFrom !== undefined
          ? dto.effectiveFrom
          : current.effectiveFrom?.toISOString(),
      effectiveTo:
        dto.effectiveTo !== undefined
          ? dto.effectiveTo
          : current.effectiveTo?.toISOString(),
      active: dto.active ?? current.active,
    });

    await this.ensureNoDuplicate(normalized, id);

    return this.prisma.procedurePrice.update({
      where: { id },
      data: normalized,
      include: {
        division: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        procedure: {
          select: {
            id: true,
            code: true,
            name: true,
            careType: true,
            active: true,
          },
        },
        isapre: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        isaprePlan: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async updateStatus(id: number, active: boolean) {
    const current = await this.prisma.procedurePrice.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!current) {
      throw new NotFoundException('Precio no encontrado.');
    }

    return this.prisma.procedurePrice.update({
      where: { id },
      data: { active },
      include: {
        division: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        procedure: {
          select: {
            id: true,
            code: true,
            name: true,
            careType: true,
            active: true,
          },
        },
        isapre: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        isaprePlan: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }
}