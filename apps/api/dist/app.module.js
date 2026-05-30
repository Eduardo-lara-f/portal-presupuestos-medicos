"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("./prisma/prisma.module");
const divisions_module_1 = require("./modules/divisions/divisions.module");
const patients_module_1 = require("./modules/patients/patients.module");
const isapres_module_1 = require("./modules/isapres/isapres.module");
const procedures_module_1 = require("./modules/procedures/procedures.module");
const procedure_prices_module_1 = require("./modules/procedure-prices/procedure-prices.module");
const quotes_module_1 = require("./modules/quotes/quotes.module");
const pdf_module_1 = require("./pdf/pdf.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            divisions_module_1.DivisionsModule,
            patients_module_1.PatientsModule,
            isapres_module_1.IsapresModule,
            procedures_module_1.ProceduresModule,
            procedure_prices_module_1.ProcedurePricesModule,
            quotes_module_1.QuotesModule,
            pdf_module_1.PdfModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map