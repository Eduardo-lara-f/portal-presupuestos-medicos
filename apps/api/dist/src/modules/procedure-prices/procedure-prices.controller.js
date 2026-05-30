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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcedurePricesController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const create_procedure_price_dto_1 = require("./dto/create-procedure-price.dto");
const update_procedure_price_dto_1 = require("./dto/update-procedure-price.dto");
const update_procedure_price_status_dto_1 = require("./dto/update-procedure-price-status.dto");
const procedure_prices_service_1 = require("./procedure-prices.service");
let ProcedurePricesController = class ProcedurePricesController {
    constructor(procedurePricesService) {
        this.procedurePricesService = procedurePricesService;
    }
    async resolve(divisionId, procedureId, coverageType, isapreId, isaprePlanId, fonasaCode) {
        return this.procedurePricesService.resolve({
            divisionId,
            procedureId,
            coverageType,
            isapreId: isapreId ? Number(isapreId) : undefined,
            isaprePlanId: isaprePlanId ? Number(isaprePlanId) : undefined,
            fonasaCode,
        });
    }
    async findAll(divisionId, procedureId, coverageType, active, search) {
        const parsedActive = active === undefined
            ? undefined
            : active === 'true'
                ? true
                : active === 'false'
                    ? false
                    : undefined;
        const parsedCoverageType = coverageType && Object.values(client_1.CoverageType).includes(coverageType)
            ? coverageType
            : undefined;
        return this.procedurePricesService.findAll({
            divisionId: divisionId ? Number(divisionId) : undefined,
            procedureId: procedureId ? Number(procedureId) : undefined,
            coverageType: parsedCoverageType,
            active: parsedActive,
            search,
        });
    }
    async findOne(id) {
        return this.procedurePricesService.findOne(id);
    }
    async create(body) {
        return this.procedurePricesService.create(body);
    }
    async update(id, body) {
        return this.procedurePricesService.update(id, body);
    }
    async updateStatus(id, body) {
        return this.procedurePricesService.updateStatus(id, body.active);
    }
};
exports.ProcedurePricesController = ProcedurePricesController;
__decorate([
    (0, common_1.Get)('resolve'),
    __param(0, (0, common_1.Query)('divisionId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('procedureId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('coverageType', new common_1.ParseEnumPipe(client_1.CoverageType))),
    __param(3, (0, common_1.Query)('isapreId')),
    __param(4, (0, common_1.Query)('isaprePlanId')),
    __param(5, (0, common_1.Query)('fonasaCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ProcedurePricesController.prototype, "resolve", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('divisionId')),
    __param(1, (0, common_1.Query)('procedureId')),
    __param(2, (0, common_1.Query)('coverageType')),
    __param(3, (0, common_1.Query)('active')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ProcedurePricesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProcedurePricesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_procedure_price_dto_1.CreateProcedurePriceDto]),
    __metadata("design:returntype", Promise)
], ProcedurePricesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_procedure_price_dto_1.UpdateProcedurePriceDto]),
    __metadata("design:returntype", Promise)
], ProcedurePricesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_procedure_price_status_dto_1.UpdateProcedurePriceStatusDto]),
    __metadata("design:returntype", Promise)
], ProcedurePricesController.prototype, "updateStatus", null);
exports.ProcedurePricesController = ProcedurePricesController = __decorate([
    (0, common_1.Controller)('procedure-prices'),
    __metadata("design:paramtypes", [procedure_prices_service_1.ProcedurePricesService])
], ProcedurePricesController);
//# sourceMappingURL=procedure-prices.controller.js.map