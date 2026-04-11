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
exports.QuotesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let QuotesService = class QuotesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        try {
            console.log('quotes.create -> input:', JSON.stringify(data, null, 2));
            const subtotal = data.items.reduce((acc, item) => {
                return acc + Number(item.quantity) * Number(item.unitPrice);
            }, 0);
            const discountTotal = Number(data.discountTotal ?? 0);
            const total = subtotal - discountTotal;
            console.log('quotes.create -> totals:', {
                subtotal,
                discountTotal,
                total,
            });
            const quote = await this.prisma.$transaction(async (tx) => {
                return tx.quote.create({
                    data: {
                        divisionId: data.divisionId,
                        patientId: data.patientId,
                        coverageType: data.coverageType,
                        isapreId: data.isapreId,
                        isaprePlanId: data.isaprePlanId,
                        fonasaCode: data.fonasaCode,
                        payerLabel: data.payerLabel,
                        careType: data.careType,
                        status: client_1.QuoteStatus.DRAFT,
                        validityDays: data.validityDays ?? 15,
                        subtotal,
                        discountTotal,
                        total,
                        notes: data.notes,
                        createdByUserId: data.createdByUserId,
                        deletedAt: null,
                        items: {
                            create: data.items.map((item) => ({
                                sourceType: item.sourceType,
                                sourceId: item.sourceId,
                                description: item.description,
                                quantity: Number(item.quantity),
                                unitPrice: Number(item.unitPrice),
                                totalPrice: Number(item.quantity) * Number(item.unitPrice),
                                deletedAt: null,
                            })),
                        },
                    },
                    select: {
                        id: true,
                        divisionId: true,
                        patientId: true,
                        coverageType: true,
                        isapreId: true,
                        isaprePlanId: true,
                        careType: true,
                        status: true,
                        validityDays: true,
                        subtotal: true,
                        discountTotal: true,
                        total: true,
                        notes: true,
                        createdByUserId: true,
                        items: {
                            select: {
                                id: true,
                                sourceType: true,
                                sourceId: true,
                                description: true,
                                quantity: true,
                                unitPrice: true,
                                totalPrice: true,
                            },
                            orderBy: {
                                id: 'asc',
                            },
                        },
                    },
                });
            });
            console.log('quotes.create -> result:', quote);
            return quote;
        }
        catch (error) {
            console.error('quotes.create -> error:', error);
            throw error;
        }
    }
};
exports.QuotesService = QuotesService;
exports.QuotesService = QuotesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuotesService);
//# sourceMappingURL=quotes.service.js.map