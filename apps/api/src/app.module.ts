import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { DivisionsModule } from './modules/divisions/divisions.module';
import { PatientsModule } from './modules/patients/patients.module';
import { IsapresModule } from './modules/isapres/isapres.module';
import { ProceduresModule } from './modules/procedures/procedures.module';
import { ProcedurePricesModule } from './modules/procedure-prices/procedure-prices.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { BasketsModule } from './modules/baskets/baskets.module';
import { PackagesModule } from './modules/packages/packages.module';
import { ReportsModule } from './modules/reports/reports.module';
import { StorageModule } from './modules/storage/storage.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    DivisionsModule,
    PatientsModule,
    IsapresModule,
    ProceduresModule,
    ProcedurePricesModule,
    QuotesModule,
    AuthModule,
    UsersModule,
    PdfModule,
    BasketsModule,
    PackagesModule,
    ReportsModule,
    StorageModule,
  ],
})
export class AppModule {}