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
        const { divisionId, procedureId, coverageType, isapreId, isaprePlanId, fonasaCode } = params;
        if (coverageType === client_1.CoverageType.ISAPRE_PLAN && !isaprePlanId) {
            throw new common_1.BadRequestException('isaprePlanId es obligatorio para coverageType=ISAPRE_PLAN');
        }
        if (coverageType === client_1.CoverageType.FONASA && !fonasaCode) {
            throw new common_1.BadRequestException('fonasaCode es obligatorio para coverageType=FONASA');
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
            throw new common_1.NotFoundException('No se encontró precio para la combinación solicitada');
        }
        return price;
    }
};
exports.ProcedurePricesService = ProcedurePricesService;
exports.ProcedurePricesService = ProcedurePricesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProcedurePricesService);
//# sourceMappingURL=procedure-prices.service.js.map