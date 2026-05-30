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
exports.PackagesController = void 0;
const common_1 = require("@nestjs/common");
const create_package_dto_1 = require("./dto/create-package.dto");
const update_package_dto_1 = require("./dto/update-package.dto");
const update_package_status_dto_1 = require("./dto/update-package-status.dto");
const packages_service_1 = require("./packages.service");
let PackagesController = class PackagesController {
    constructor(packagesService) {
        this.packagesService = packagesService;
    }
    async findAll(divisionId, search, active) {
        const parsedActive = active === undefined
            ? undefined
            : active === 'true'
                ? true
                : active === 'false'
                    ? false
                    : undefined;
        return this.packagesService.findAll({
            divisionId: divisionId ? Number(divisionId) : undefined,
            search,
            active: parsedActive,
        });
    }
    async findOne(id) {
        return this.packagesService.findOne(id);
    }
    async create(body) {
        return this.packagesService.create(body);
    }
    async update(id, body) {
        return this.packagesService.update(id, body);
    }
    async updateStatus(id, body) {
        return this.packagesService.updateStatus(id, body.active);
    }
};
exports.PackagesController = PackagesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('divisionId')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_package_dto_1.CreatePackageDto]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_package_dto_1.UpdatePackageDto]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_package_status_dto_1.UpdatePackageStatusDto]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "updateStatus", null);
exports.PackagesController = PackagesController = __decorate([
    (0, common_1.Controller)('packages'),
    __metadata("design:paramtypes", [packages_service_1.PackagesService])
], PackagesController);
//# sourceMappingURL=packages.controller.js.map