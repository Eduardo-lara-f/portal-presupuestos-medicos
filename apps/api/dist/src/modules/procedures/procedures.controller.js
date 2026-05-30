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
exports.ProceduresController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const create_procedure_dto_1 = require("./dto/create-procedure.dto");
const update_procedure_status_dto_1 = require("./dto/update-procedure-status.dto");
const update_procedure_dto_1 = require("./dto/update-procedure.dto");
const procedures_service_1 = require("./procedures.service");
let ProceduresController = class ProceduresController {
    constructor(proceduresService) {
        this.proceduresService = proceduresService;
    }
    async findAll(divisionId, search, careType, category, active) {
        const parsedActive = active === undefined
            ? undefined
            : active === 'true'
                ? true
                : active === 'false'
                    ? false
                    : undefined;
        return this.proceduresService.findAll({
            divisionId: divisionId ? Number(divisionId) : undefined,
            search,
            careType,
            category,
            active: parsedActive,
        });
    }
    async findOne(id) {
        return this.proceduresService.findOne(id);
    }
    async create(body) {
        return this.proceduresService.create(body);
    }
    async update(id, body) {
        return this.proceduresService.update(id, body);
    }
    async updateStatus(id, body) {
        return this.proceduresService.updateStatus(id, body.active);
    }
};
exports.ProceduresController = ProceduresController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('divisionId')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('careType')),
    __param(3, (0, common_1.Query)('category')),
    __param(4, (0, common_1.Query)('active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ProceduresController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProceduresController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_procedure_dto_1.CreateProcedureDto]),
    __metadata("design:returntype", Promise)
], ProceduresController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_procedure_dto_1.UpdateProcedureDto]),
    __metadata("design:returntype", Promise)
], ProceduresController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_procedure_status_dto_1.UpdateProcedureStatusDto]),
    __metadata("design:returntype", Promise)
], ProceduresController.prototype, "updateStatus", null);
exports.ProceduresController = ProceduresController = __decorate([
    (0, common_1.Controller)('procedures'),
    __metadata("design:paramtypes", [procedures_service_1.ProceduresService])
], ProceduresController);
//# sourceMappingURL=procedures.controller.js.map