"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasketsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let BasketsService = class BasketsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const where = {
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
    async findOne(id) {
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
            throw new common_1.NotFoundException('Canasta no encontrada.');
        }
        return basket;
    }
    async validateProcedures(divisionId, procedureIds) {
        if (!procedureIds.length) {
            throw new common_1.BadRequestException('La canasta debe tener al menos una prestación.');
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
            throw new common_1.BadRequestException('Una o más prestaciones no existen, están inactivas o no pertenecen a la división seleccionada.');
        }
    }
    async create(dto) {
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
            throw new common_1.ConflictException('Ya existe una canasta con ese código en la división seleccionada.');
        }
        await this.validateProcedures(dto.divisionId, dto.items.map((item) => item.procedureId));
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
                        relevanceScore: item.relevanceScore !== undefined ? item.relevanceScore : null,
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
    async update(id, dto) {
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
            throw new common_1.NotFoundException('Canasta no encontrada.');
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
            throw new common_1.ConflictException('Ya existe otra canasta con ese código en la división seleccionada.');
        }
        if (dto.items) {
            await this.validateProcedures(nextDivisionId, dto.items.map((item) => item.procedureId));
        }
        return this.prisma.basket.update({
            where: { id },
            data: {
                divisionId: nextDivisionId,
                code: nextCode,
                name: dto.name?.trim() ?? current.name,
                description: dto.description !== undefined
                    ? dto.description?.trim() || null
                    : current.description,
                active: dto.active ?? current.active,
                items: dto.items !== undefined
                    ? {
                        deleteMany: {},
                        create: dto.items.map((item) => ({
                            procedureId: item.procedureId,
                            quantity: item.quantity,
                            relevanceScore: item.relevanceScore !== undefined
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
    async updateStatus(id, active) {
        const current = await this.prisma.basket.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });
        if (!current) {
            throw new common_1.NotFoundException('Canasta no encontrada.');
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
};
exports.BasketsService = BasketsService;
exports.BasketsService = BasketsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BasketsService);
//# sourceMappingURL=baskets.service.js.map