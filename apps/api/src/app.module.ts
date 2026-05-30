import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { DivisionsModule } from './modules/divisions/divisions.module';
import { PatientsModule } from './modules/patients/patients.module';
import { IsapresModule } from './modules/isapres/isapres.module';
import { ProceduresModule } from './modules/procedures/procedures.module';
import { ProcedurePricesModule } from './modules/procedure-prices/procedure-prices.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { AuthModule } from './modules/auth/auth.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { BasketsModule } from './modules/baskets/baskets.module';
import { PackagesModule } from './modules/packages/packages.module';

@Module({
  imports: [
    PrismaModule,
    DivisionsModule,
    PatientsModule,
    IsapresModule,
    ProceduresModule,
    ProcedurePricesModule,
    QuotesModule,
    AuthModule,
    PdfModule,
    BasketsModule,
    PackagesModule,
  ],
})
export class AppModule {}