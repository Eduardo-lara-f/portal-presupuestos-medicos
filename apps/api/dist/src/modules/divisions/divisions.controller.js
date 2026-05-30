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
exports.DivisionsController = void 0;
const common_1 = require("@nestjs/common");
const divisions_service_1 = require("./divisions.service");
let DivisionsController = class DivisionsController {
    constructor(divisionsService) {
        this.divisionsService = divisionsService;
    }
    async findAll() {
        return this.divisionsService.findAll();
    }
};
exports.DivisionsController = DivisionsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DivisionsController.prototype, "findAll", null);
exports.DivisionsController = DivisionsController = __decorate([
    (0, common_1.Controller)('divisions'),
    __metadata("design:paramtypes", [divisions_service_1.DivisionsService])
], DivisionsController);
//# sourceMappingURL=divisions.controller.js.map