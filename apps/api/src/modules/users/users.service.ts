import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CareType, Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    divisionId?: number;
    search?: string;
    status?: boolean;
    role?: string;
    careAccess?: string;
  }) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (params.divisionId) {
      where.divisionId = params.divisionId;
    }

    if (typeof params.status === 'boolean') {
      where.status = params.status;
    }

    if (params.role) {
      where.role = params.role as UserRole;
    }

    if (params.careAccess) {
      where.careAccess = params.careAccess as CareType;
    }

    if (params.search?.trim()) {
      const search = params.search.trim();

      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      orderBy: [{ name: 'asc' }],
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
    const user = await this.prisma.user.findFirst({
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

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    await this.validateDivision(dto.divisionId, dto.role);
    this.validateRoleCareAccess(dto.role, dto.careAccess);

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese correo.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        divisionId: dto.divisionId ?? null,
        name: dto.name.trim(),
        email,
        passwordHash,
        role: dto.role,
        careAccess: dto.careAccess,
        status: dto.status ?? true,
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
  }

  async update(id: number, dto: UpdateUserDto) {
    const current = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!current) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const nextRole = dto.role ?? current.role;
    const nextCareAccess = dto.careAccess ?? current.careAccess;
    const nextDivisionId = dto.divisionId !== undefined ? dto.divisionId : current.divisionId;

    await this.validateDivision(nextDivisionId ?? undefined, nextRole);
    this.validateRoleCareAccess(nextRole, nextCareAccess);

    const nextEmail = dto.email?.trim().toLowerCase();
    if (nextEmail && nextEmail !== current.email) {
      const duplicated = await this.prisma.user.findFirst({
        where: {
          id: { not: id },
          email: nextEmail,
          deletedAt: null,
        },
      });

      if (duplicated) {
        throw new ConflictException('Ya existe otro usuario con ese correo.');
      }
    }

    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : undefined;

    return this.prisma.user.update({
      where: { id },
      data: {
        divisionId: nextDivisionId ?? null,
        name: dto.name?.trim() ?? current.name,
        email: nextEmail ?? current.email,
        passwordHash: passwordHash ?? current.passwordHash,
        role: nextRole,
        careAccess: nextCareAccess,
        status: dto.status ?? current.status,
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

  async updateStatus(id: number, status: boolean) {
    const current = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!current) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status },
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

  private async validateDivision(
    divisionId: number | undefined,
    role: UserRole,
  ) {
    if (role === UserRole.SUPER_ADMIN) {
      return;
    }

    if (!divisionId) {
      throw new BadRequestException(
        'Los usuarios que no son SUPER_ADMIN deben tener división asignada.',
      );
    }

    const division = await this.prisma.division.findFirst({
      where: {
        id: divisionId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!division) {
      throw new BadRequestException('La división seleccionada no existe.');
    }
  }

  private validateRoleCareAccess(role: UserRole, careAccess: CareType) {
    const rolesWithSegmentedAccess: UserRole[] = [
      UserRole.EXECUTIVE,
      UserRole.BUDGET_HEAD,
    ];

    if (!rolesWithSegmentedAccess.includes(role) && careAccess !== CareType.BOTH) {
      throw new BadRequestException(
        'Solo EXECUTIVE y BUDGET_HEAD pueden restringirse por módulo clínico.',
      );
    }
  }
}