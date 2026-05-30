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
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PatientsService = class PatientsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByRut(rut, divisionId) {
        return this.prisma.patient.findFirst({
            where: {
                rut,
                divisionId,
                deletedAt: null,
            },
            select: {
                id: true,
                divisionId: true,
                rut: true,
                firstName: true,
                lastName: true,
                middleName: true,
                birthDate: true,
                sex: true,
                email: true,
                phone: true,
                address: true,
            },
        });
    }
    async create(data) {
        return this.prisma.patient.create({
            data: {
                divisionId: data.divisionId,
                rut: data.rut,
                firstName: data.firstName,
                lastName: data.lastName,
                middleName: data.middleName,
                birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
                sex: data.sex,
                email: data.email,
                phone: data.phone,
                address: data.address,
                deletedAt: null,
            },
            select: {
                id: true,
                divisionId: true,
                rut: true,
                firstName: true,
                lastName: true,
                middleName: true,
                birthDate: true,
                sex: true,
                email: true,
                phone: true,
                address: true,
            },
        });
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PatientsService);
//# sourceMappingURL=patients.service.js.map