import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CareType, CatalogItemType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';

@Injectable()
export class ProceduresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    divisionId?: number;
    search?: string;
    careType?: CareType;
    category?: string;
    itemType?: CatalogItemType;
    active?: boolean;
  }) {
    const where: Prisma.ProcedureWhereInput = {
      deletedAt: null,
    };

    if (params.divisionId) {
      where.divisionId = params.divisionId;
    }

    if (params.careType) {
      where.careType = params.careType;
    }

    if (params.category?.trim()) {
      where.category = params.category.trim().toUpperCase();
    }

    if (params.itemType) {
      where.itemType = params.itemType;
    }

    if (typeof params.active === 'boolean') {
      where.active = params.active;
    }

    if (params.search?.trim()) {
      const search = params.search.trim();

      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.procedure.findMany({
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
      },
    });
  }

  async findOne(id: number) {
    const procedure = await this.prisma.procedure.findFirst({
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
      },
    });

    if (!procedure) {
      throw new NotFoundException('Prestación no encontrada.');
    }

    return procedure;
  }

  async create(dto: CreateProcedureDto) {
    const code = dto.code.trim().toUpperCase();
    const name = dto.name.trim();

    const existing = await this.prisma.procedure.findFirst({
      where: {
        divisionId: dto.divisionId,
        code,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe una prestación con ese código en la división seleccionada.',
      );
    }

    return this.prisma.procedure.create({
      data: {
        divisionId: dto.divisionId,
        code,
        name,
        description: dto.description?.trim() || null,
        category: dto.category?.trim().toUpperCase() || null,
        itemType: dto.itemType ?? CatalogItemType.PROCEDURE,
        careType: dto.careType ?? CareType.BOTH,
        active: true,
      },
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

  async update(id: number, dto: UpdateProcedureDto) {
    const current = await this.prisma.procedure.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!current) {
      throw new NotFoundException('Prestación no encontrada.');
    }

    const nextDivisionId = dto.divisionId ?? current.divisionId;
    const nextCode = dto.code?.trim().toUpperCase() ?? current.code;

    const duplicated = await this.prisma.procedure.findFirst({
      where: {
        id: { not: id },
        divisionId: nextDivisionId,
        code: nextCode,
        deletedAt: null,
      },
    });

    if (duplicated) {
      throw new ConflictException(
        'Ya existe otra prestación con ese código en la división seleccionada.',
      );
    }

    return this.prisma.procedure.update({
      where: { id },
      data: {
        divisionId: dto.divisionId ?? current.divisionId,
        code: nextCode,
        name: dto.name?.trim() ?? current.name,
        description:
          dto.description !== undefined
            ? dto.description?.trim() || null
            : current.description,
        category:
          dto.category !== undefined
            ? dto.category?.trim().toUpperCase() || null
            : current.category,
        itemType: dto.itemType ?? current.itemType,
        careType: dto.careType ?? current.careType,
        active: dto.active ?? current.active,
      },
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

  async updateStatus(id: number, active: boolean) {
    const current = await this.prisma.procedure.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!current) {
      throw new NotFoundException('Prestación no encontrada.');
    }

    return this.prisma.procedure.update({
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