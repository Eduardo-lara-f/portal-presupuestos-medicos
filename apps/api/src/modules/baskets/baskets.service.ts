import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBasketDto } from './dto/create-basket.dto';
import { UpdateBasketDto } from './dto/update-basket.dto';

@Injectable()
export class BasketsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    divisionId?: number;
    search?: string;
    active?: boolean;
  }) {
    const where: Prisma.BasketWhereInput = {
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

    return this.prisma.basket.findMany({
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
    const basket = await this.prisma.basket.findFirst({
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

    if (!basket) {
      throw new NotFoundException('Canasta no encontrada.');
    }

    return basket;
  }

  private async validateProcedures(
    divisionId: number,
    procedureIds: number[],
  ) {
    if (!procedureIds.length) {
      throw new BadRequestException(
        'La canasta debe tener al menos una prestación.',
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

  async create(dto: CreateBasketDto) {
    const code = dto.code.trim().toUpperCase();
    const name = dto.name.trim();

    const existing = await this.prisma.basket.findFirst({
      where: {
        divisionId: dto.divisionId,
        code,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe una canasta con ese código en la división seleccionada.',
      );
    }

    await this.validateProcedures(
      dto.divisionId,
      dto.items.map((item) => item.procedureId),
    );

    return this.prisma.basket.create({
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
            relevanceScore:
              item.relevanceScore !== undefined ? item.relevanceScore : null,
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

  async update(id: number, dto: UpdateBasketDto) {
    const current = await this.prisma.basket.findFirst({
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
      throw new NotFoundException('Canasta no encontrada.');
    }

    const nextDivisionId = dto.divisionId ?? current.divisionId;
    const nextCode = dto.code?.trim().toUpperCase() ?? current.code;

    const duplicated = await this.prisma.basket.findFirst({
      where: {
        id: { not: id },
        divisionId: nextDivisionId,
        code: nextCode,
        deletedAt: null,
      },
    });

    if (duplicated) {
      throw new ConflictException(
        'Ya existe otra canasta con ese código en la división seleccionada.',
      );
    }

    if (dto.items) {
      await this.validateProcedures(
        nextDivisionId,
        dto.items.map((item) => item.procedureId),
      );
    }

    return this.prisma.basket.update({
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
                  relevanceScore:
                    item.relevanceScore !== undefined
                      ? item.relevanceScore
                      : null,
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
    const current = await this.prisma.basket.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!current) {
      throw new NotFoundException('Canasta no encontrada.');
    }

    return this.prisma.basket.update({
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