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
exports.BasketsController = void 0;
const common_1 = require("@nestjs/common");
const create_basket_dto_1 = require("./dto/create-basket.dto");
const update_basket_dto_1 = require("./dto/update-basket.dto");
const update_basket_status_dto_1 = require("./dto/update-basket-status.dto");
const baskets_service_1 = require("./baskets.service");
let BasketsController = class BasketsController {
    constructor(basketsService) {
        this.basketsService = basketsService;
    }
    async findAll(divisionId, search, active) {
        const parsedActive = active === undefined
            ? undefined
            : active === 'true'
                ? true
                : active === 'false'
                    ? false
                    : undefined;
        return this.basketsService.findAll({
            divisionId: divisionId ? Number(divisionId) : undefined,
            search,
            active: parsedActive,
        });
    }
    async findOne(id) {
        return this.basketsService.findOne(id);
    }
    async create(body) {
        return this.basketsService.create(body);
    }
    async update(id, body) {
        return this.basketsService.update(id, body);
    }
    async updateStatus(id, body) {
        return this.basketsService.updateStatus(id, body.active);
    }
};
exports.BasketsController = BasketsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('divisionId')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], BasketsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], BasketsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_basket_dto_1.CreateBasketDto]),
    __metadata("design:returntype", Promise)
], BasketsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_basket_dto_1.UpdateBasketDto]),
    __metadata("design:returntype", Promise)
], BasketsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_basket_status_dto_1.UpdateBasketStatusDto]),
    __metadata("design:returntype", Promise)
], BasketsController.prototype, "updateStatus", null);
exports.BasketsController = BasketsController = __decorate([
    (0, common_1.Controller)('baskets'),
    __metadata("design:paramtypes", [baskets_service_1.BasketsService])
], BasketsController);
//# sourceMappingURL=baskets.controller.js.map