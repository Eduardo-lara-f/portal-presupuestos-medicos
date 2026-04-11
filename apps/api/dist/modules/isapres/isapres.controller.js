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
exports.IsapresController = void 0;
const common_1 = require("@nestjs/common");
const isapres_service_1 = require("./isapres.service");
let IsapresController = class IsapresController {
    constructor(isapresService) {
        this.isapresService = isapresService;
    }
    async findByDivision(divisionId) {
        return this.isapresService.findByDivision(divisionId);
    }
    async findPlansByIsapre(id) {
        return this.isapresService.findPlansByIsapre(id);
    }
};
exports.IsapresController = IsapresController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('divisionId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], IsapresController.prototype, "findByDivision", null);
__decorate([
    (0, common_1.Get)(':id/plans'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], IsapresController.prototype, "findPlansByIsapre", null);
exports.IsapresController = IsapresController = __decorate([
    (0, common_1.Controller)('isapres'),
    __metadata("design:paramtypes", [isapres_service_1.IsapresService])
], IsapresController);
//# sourceMappingURL=isapres.controller.js.map