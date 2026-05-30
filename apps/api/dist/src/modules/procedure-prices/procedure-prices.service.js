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
exports.ProcedurePricesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let ProcedurePricesService = class ProcedurePricesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async resolve(params) {
        const now = new Date();
        const where = {
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
        if (params.coverageType === client_1.CoverageType.ISAPRE_PLAN) {
            if (!params.isapreId || !params.isaprePlanId) {
                throw new common_1.BadRequestException('Para cobertura ISAPRE_PLAN debe indicar isapreId e isaprePlanId.');
            }
            where.isapreId = params.isapreId;
            where.isaprePlanId = params.isaprePlanId;
            where.fonasaCode = null;
        }
        if (params.coverageType === client_1.CoverageType.FONASA) {
            where.isapreId = null;
            where.isaprePlanId = null;
            where.fonasaCode = params.fonasaCode?.trim() || null;
        }
        if (params.coverageType === client_1.CoverageType.PARTICULAR ||
            params.coverageType === client_1.CoverageType.OTHER) {
            where.isapreId = null;
            where.isaprePlanId = null;
            where.fonasaCode = null;
        }
        const record = await this.prisma.procedurePrice.findFirst({
            where,
            orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
        });
        if (!record) {
            throw new common_1.NotFoundException('No existe un precio configurado para la combinación solicitada.');
        }
        return record;
    }
    async findAll(params) {
        const where = {
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
    async findOne(id) {
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
            throw new common_1.NotFoundException('Precio no encontrado.');
        }
        return record;
    }
    normalizeCoverageData(input) {
        const coverageType = input.coverageType;
        let isapreId = input.isapreId ?? null;
        let isaprePlanId = input.isaprePlanId ?? null;
        let fonasaCode = input.fonasaCode?.trim() || null;
        let payerLabel = input.payerLabel?.trim() || null;
        if (coverageType === client_1.CoverageType.ISAPRE_PLAN) {
            if (!isapreId || !isaprePlanId) {
                throw new common_1.BadRequestException('Para cobertura ISAPRE_PLAN debe indicar isapre y plan.');
            }
            fonasaCode = null;
            payerLabel = null;
        }
        if (coverageType === client_1.CoverageType.FONASA) {
            isapreId = null;
            isaprePlanId = null;
            payerLabel = null;
        }
        if (coverageType === client_1.CoverageType.PARTICULAR ||
            coverageType === client_1.CoverageType.OTHER) {
            isapreId = null;
            isaprePlanId = null;
            fonasaCode = null;
        }
        const effectiveFrom = input.effectiveFrom
            ? new Date(input.effectiveFrom)
            : null;
        const effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;
        if (effectiveFrom && effectiveTo && effectiveTo < effectiveFrom) {
            throw new common_1.BadRequestException('effectiveTo no puede ser menor que effectiveFrom.');
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
    async ensureNoDuplicate(normalized, ignoreId) {
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
            throw new common_1.ConflictException('Ya existe un precio con la misma combinación de división, prestación y cobertura.');
        }
    }
    async create(dto) {
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
    async update(id, dto) {
        const current = await this.prisma.procedurePrice.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });
        if (!current) {
            throw new common_1.NotFoundException('Precio no encontrado.');
        }
        const normalized = this.normalizeCoverageData({
            divisionId: dto.divisionId ?? current.divisionId,
            procedureId: dto.procedureId ?? current.procedureId,
            coverageType: dto.coverageType ?? current.coverageType,
            isapreId: dto.isapreId ?? current.isapreId ?? undefined,
            isaprePlanId: dto.isaprePlanId ?? current.isaprePlanId ?? undefined,
            fonasaCode: dto.fonasaCode !== undefined
                ? dto.fonasaCode
                : current.fonasaCode ?? undefined,
            payerLabel: dto.payerLabel !== undefined
                ? dto.payerLabel
                : current.payerLabel ?? undefined,
            price: dto.price ?? Number(current.price),
            currency: dto.currency ?? current.currency,
            effectiveFrom: dto.effectiveFrom !== undefined
                ? dto.effectiveFrom
                : current.effectiveFrom?.toISOString(),
            effectiveTo: dto.effectiveTo !== undefined
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
    async updateStatus(id, active) {
        const current = await this.prisma.procedurePrice.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });
        if (!current) {
            throw new common_1.NotFoundException('Precio no encontrado.');
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
};
exports.ProcedurePricesService = ProcedurePricesService;
exports.ProcedurePricesService = ProcedurePricesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProcedurePricesService);
//# sourceMappingURL=procedure-prices.service.js.map