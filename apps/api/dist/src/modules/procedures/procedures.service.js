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
exports.ProceduresService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let ProceduresService = class ProceduresService {
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
        if (params.careType) {
            where.careType = params.careType;
        }
        if (params.category?.trim()) {
            where.category = params.category.trim().toUpperCase();
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
    async findOne(id) {
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
            throw new common_1.NotFoundException('Prestación no encontrada.');
        }
        return procedure;
    }
    async create(dto) {
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
            throw new common_1.ConflictException('Ya existe una prestación con ese código en la división seleccionada.');
        }
        return this.prisma.procedure.create({
            data: {
                divisionId: dto.divisionId,
                code,
                name,
                description: dto.description?.trim() || null,
                category: dto.category?.trim().toUpperCase() || null,
                careType: dto.careType ?? client_1.CareType.BOTH,
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
    async update(id, dto) {
        const current = await this.prisma.procedure.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });
        if (!current) {
            throw new common_1.NotFoundException('Prestación no encontrada.');
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
            throw new common_1.ConflictException('Ya existe otra prestación con ese código en la división seleccionada.');
        }
        return this.prisma.procedure.update({
            where: { id },
            data: {
                divisionId: dto.divisionId ?? current.divisionId,
                code: nextCode,
                name: dto.name?.trim() ?? current.name,
                description: dto.description !== undefined
                    ? dto.description?.trim() || null
                    : current.description,
                category: dto.category !== undefined
                    ? dto.category?.trim().toUpperCase() || null
                    : current.category,
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
    async updateStatus(id, active) {
        const current = await this.prisma.procedure.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });
        if (!current) {
            throw new common_1.NotFoundException('Prestación no encontrada.');
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
};
exports.ProceduresService = ProceduresService;
exports.ProceduresService = ProceduresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProceduresService);
//# sourceMappingURL=procedures.service.js.map