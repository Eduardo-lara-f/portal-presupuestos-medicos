import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    divisionId?: number;
    search?: string;
    active?: boolean;
  }) {
    const where: Prisma.MedicalPackageWhereInput = {
      deletedAt: null,
    };

    if (params.divisionId) {
      where.divisionId = params.divisionId;
    }

    if (typeof params.active === 'boolean') {
      where.active = params.active;
    }

    if (params.search?.trim()) {
      const search = params.search.trim();

      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.medicalPackage.findMany({
      where,
      orderBy: [{ divisionId: 'asc' }, { name: 'asc' }],
      include: {
        division: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        items: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            id: 'asc',
          },
          include: {
            procedure: {
              select: {
                id: true,
                code: true,
                name: true,
                category: true,
                careType: true,
                active: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.medicalPackage.findFirst({
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
        items: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            id: 'asc',
          },
          include: {
            procedure: {
              select: {
                id: true,
                code: true,
                name: true,
                category: true,
                careType: true,
                active: true,
              },
            },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Paquete no encontrado.');
    }

    return record;
  }

  private async validateProcedures(
    divisionId: number,
    procedureIds: number[],
  ) {
    if (!procedureIds.length) {
      throw new BadRequestException(
        'El paquete debe tener al menos una prestación.',
      );
    }

    const uniqueIds = [...new Set(procedureIds)];

    const procedures = await this.prisma.procedure.findMany({
      where: {
        id: { in: uniqueIds },
        divisionId,
        active: true,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (procedures.length !== uniqueIds.length) {
      throw new BadRequestException(
        'Una o más prestaciones no existen, están inactivas o no pertenecen a la división seleccionada.',
      );
    }
  }

  async create(dto: CreatePackageDto) {
    const code = dto.code.trim().toUpperCase();
    const name = dto.name.trim();

    const existing = await this.prisma.medicalPackage.findFirst({
      where: {
        divisionId: dto.divisionId,
        code,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un paquete con ese código en la división seleccionada.',
      );
    }

    await this.validateProcedures(
      dto.divisionId,
      dto.items.map((item) => item.procedureId),
    );

    return this.prisma.medicalPackage.create({
      data: {
        divisionId: dto.divisionId,
        code,
        name,
        description: dto.description?.trim() || null,
        active: true,
        items: {
          create: dto.items.map((item) => ({
            procedureId: item.procedureId,
            quantity: item.quantity,
            priceMode: item.priceMode?.trim() || 'AGREEMENT_PRICE',
            fixedPrice:
              item.fixedPrice !== undefined ? item.fixedPrice : null,
          })),
        },
      },
      include: {
        division: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        items: {
          where: {
            deletedAt: null,
          },
          include: {
            procedure: {
              select: {
                id: true,
                code: true,
                name: true,
                category: true,
                careType: true,
                active: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdatePackageDto) {
    const current = await this.prisma.medicalPackage.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        items: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    if (!current) {
      throw new NotFoundException('Paquete no encontrado.');
    }

    const nextDivisionId = dto.divisionId ?? current.divisionId;
    const nextCode = dto.code?.trim().toUpperCase() ?? current.code;

    const duplicated = await this.prisma.medicalPackage.findFirst({
      where: {
        id: { not: id },
        divisionId: nextDivisionId,
        code: nextCode,
        deletedAt: null,
      },
    });

    if (duplicated) {
      throw new ConflictException(
        'Ya existe otro paquete con ese código en la división seleccionada.',
      );
    }

    if (dto.items) {
      await this.validateProcedures(
        nextDivisionId,
        dto.items.map((item) => item.procedureId),
      );
    }

    return this.prisma.medicalPackage.update({
      where: { id },
      data: {
        divisionId: nextDivisionId,
        code: nextCode,
        name: dto.name?.trim() ?? current.name,
        description:
          dto.description !== undefined
            ? dto.description?.trim() || null
            : current.description,
        active: dto.active ?? current.active,
        items:
          dto.items !== undefined
            ? {
                deleteMany: {},
                create: dto.items.map((item) => ({
                  procedureId: item.procedureId,
                  quantity: item.quantity,
                  priceMode: item.priceMode?.trim() || 'AGREEMENT_PRICE',
                  fixedPrice:
                    item.fixedPrice !== undefined ? item.fixedPrice : null,
                })),
              }
            : undefined,
      },
      include: {
        division: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        items: {
          where: {
            deletedAt: null,
          },
          include: {
            procedure: {
              select: {
                id: true,
                code: true,
                name: true,
                category: true,
                careType: true,
                active: true,
              },
            },
          },
        },
      },
    });
  }

  async updateStatus(id: number, active: boolean) {
    const current = await this.prisma.medicalPackage.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!current) {
      throw new NotFoundException('Paquete no encontrado.');
    }

    return this.prisma.medicalPackage.update({
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
      },
    });
  }
}