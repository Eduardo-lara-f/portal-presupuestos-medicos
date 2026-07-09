import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Prisma,
  QuoteItemSourceType,
  QuoteStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportsSummaryQueryDto } from './dto/reports-summary-query.dto';


const ALLOWED_REPORT_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.DIVISION_ADMIN,
  UserRole.BUDGET_HEAD,
];

type AuthorizedReportsUser = {
  id: number;
  role: UserRole;
  divisionId: number;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFilters(userId: number) {
    const user = await this.getAuthorizedReportsUser(userId);

    const executives = await this.prisma.user.findMany({
      where: {
        divisionId: user.divisionId,
        deletedAt: null,
        status: true,
        role: {
          in: [
            UserRole.SUPER_ADMIN,
            UserRole.DIVISION_ADMIN,
            UserRole.BUDGET_HEAD,
            UserRole.EXECUTIVE,
          ],
        },
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return {
      divisionId: user.divisionId,
      executives,
      packageTypes: [
        { value: 'ALL', label: 'Todos' },
        { value: 'PAD', label: 'PAD' },
        { value: 'CONVENTIONAL', label: 'No PAD' },
      ],
    };
  }

  async getSummary(userId: number, query: ReportsSummaryQueryDto) {
    const user = await this.getAuthorizedReportsUser(userId);

    const dateFilter = this.buildDateFilter(query.fromDate, query.toDate);
    const executiveId = this.parseOptionalNumber(query.executiveId);

    const quoteWhere: Prisma.QuoteWhereInput = {
      divisionId: user.divisionId,
      ...(dateFilter ? { createdAt: dateFilter } : {}),
      ...(executiveId ? { createdByUserId: executiveId } : {}),
    };

    const quoteItemWhere: Prisma.QuoteItemWhereInput = {
      quote: quoteWhere,
    };

    const issuedQuoteWhere: Prisma.QuoteWhereInput = {
      ...quoteWhere,
      status: {
        in: [QuoteStatus.FINALIZED, QuoteStatus.SENT],
      },
    };

    const [
      totalQuotes,
      finalizedQuotes,
      draftQuotes,
      sentQuotes,
      totalAmountResult,
      issuedAmountResult,
      packageItems,
      basketItems,
      executiveBreakdown,
      packageBreakdown,
      recentQuotes,
    ] = await Promise.all([
      this.prisma.quote.count({ where: quoteWhere }),
      this.prisma.quote.count({
        where: {
          ...quoteWhere,
          status: QuoteStatus.FINALIZED,
        },
      }),
      this.prisma.quote.count({
        where: {
          ...quoteWhere,
          status: QuoteStatus.DRAFT,
        },
      }),
      this.prisma.quote.count({
        where: {
          ...quoteWhere,
          status: QuoteStatus.SENT,
        },
      }),
      this.prisma.quote.aggregate({
        where: quoteWhere,
        _sum: {
          total: true,
        },
      }),
      this.prisma.quote.aggregate({
        where: issuedQuoteWhere,
        _sum: {
          total: true,
        },
      }),
      this.countPackageItems(quoteItemWhere, query.packageType),
      this.prisma.quoteItem.count({
        where: {
          ...quoteItemWhere,
          sourceType: QuoteItemSourceType.BASKET,
        },
      }),
      this.getExecutiveBreakdown(quoteWhere),
      this.getPackageBreakdown(quoteItemWhere, query.packageType),
      this.getRecentQuotes(quoteWhere),
    ]);

    const issuedQuotes = finalizedQuotes + sentQuotes;
    const totalCreatedAmount = Number(totalAmountResult._sum.total ?? 0);
    const totalIssuedAmount = Number(issuedAmountResult._sum.total ?? 0);
    const averageIssuedAmount =
      issuedQuotes > 0 ? totalIssuedAmount / issuedQuotes : 0;
    const completionRate = totalQuotes > 0 ? issuedQuotes / totalQuotes : 0;

    return {
      filters: {
        divisionId: user.divisionId,
        fromDate: query.fromDate ?? null,
        toDate: query.toDate ?? null,
        executiveId: executiveId ?? null,
        packageType: query.packageType ?? 'ALL',
      },
      totals: {
        totalQuotes,
        createdQuotes: totalQuotes,
        issuedQuotes,
        finalizedQuotes,
        sentQuotes,
        draftQuotes,
        unfinishedQuotes: draftQuotes,
        packageItems,
        basketItems,
        totalAmount: totalCreatedAmount,
        totalCreatedAmount,
        totalIssuedAmount,
        averageIssuedAmount,
        completionRate,
      },
      executiveBreakdown,
      packageBreakdown,
      recentQuotes,
    };
  }

  private buildDateFilter(
    fromDate?: string,
    toDate?: string,
  ): Prisma.DateTimeFilter | null {
    const filter: Prisma.DateTimeFilter = {};

    if (fromDate) {
      filter.gte = new Date(`${fromDate}T00:00:00.000Z`);
    }

    if (toDate) {
      filter.lte = new Date(`${toDate}T23:59:59.999Z`);
    }

    return Object.keys(filter).length > 0 ? filter : null;
  }

  private parseOptionalNumber(value?: string): number | null {
    if (!value) {
      return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  private async countPackageItems(
    baseWhere: Prisma.QuoteItemWhereInput,
    packageType?: ReportsSummaryQueryDto['packageType'],
  ) {
    const items = await this.prisma.quoteItem.findMany({
      where: {
        ...baseWhere,
        sourceType: QuoteItemSourceType.PACKAGE,
      },
      select: {
        sourceId: true,
      },
    });

    if (!packageType || packageType === 'ALL') {
      return items.length;
    }

    const packageIds = items
      .map((item) => item.sourceId)
      .filter((id): id is number => Boolean(id));

    if (packageIds.length === 0) {
      return 0;
    }

    const packages = await this.prisma.medicalPackage.findMany({
      where: {
        id: {
          in: packageIds,
        },
      },
      select: {
        id: true,
        packageType: true,
      },
    });

    const allowedPackageIds = new Set(
      packages
        .filter((medicalPackage) => medicalPackage.packageType === packageType)
        .map((medicalPackage) => medicalPackage.id),
    );

    return items.filter((item) => allowedPackageIds.has(item.sourceId)).length;
  }

  private async getExecutiveBreakdown(quoteWhere: Prisma.QuoteWhereInput) {
    const rows = await this.prisma.quote.groupBy({
      by: ['createdByUserId'],
      where: quoteWhere,
      _count: {
        _all: true,
      },
      _sum: {
        total: true,
      },
      orderBy: {
        _count: {
          createdByUserId: 'desc',
        },
      },
    });

    const userIds = rows
      .map((row) => row.createdByUserId)
      .filter((id): id is number => Boolean(id));

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const usersById = new Map(
      users.map((executive) => [executive.id, executive]),
    );

    return rows.map((row) => {
      const executive = row.createdByUserId
        ? usersById.get(row.createdByUserId)
        : null;

      return {
        executiveId: row.createdByUserId,
        executiveName: executive?.name ?? 'Sin ejecutivo',
        executiveEmail: executive?.email ?? null,
        totalQuotes: row._count._all,
        totalAmount: Number(row._sum.total ?? 0),
      };
    });
  }

  private async getPackageBreakdown(
    baseWhere: Prisma.QuoteItemWhereInput,
    packageType?: ReportsSummaryQueryDto['packageType'],
  ) {
    const items = await this.prisma.quoteItem.findMany({
      where: {
        ...baseWhere,
        sourceType: QuoteItemSourceType.PACKAGE,
      },
      select: {
        id: true,
        sourceId: true,
        totalPrice: true,
      },
    });

    const packageIds = items
      .map((item) => item.sourceId)
      .filter((id): id is number => Boolean(id));

    const packages = packageIds.length
      ? await this.prisma.medicalPackage.findMany({
          where: {
            id: {
              in: packageIds,
            },
          },
          select: {
            id: true,
            name: true,
            packageType: true,
            padCoverageMode: true,
          },
        })
      : [];

    const packagesById = new Map(
      packages.map((medicalPackage) => [
        medicalPackage.id,
        medicalPackage,
      ]),
    );

    const summary = new Map<
      string,
      {
        packageId: number | null;
        packageName: string;
        packageType: string | null;
        padCoverageMode: string | null;
        totalItems: number;
        totalAmount: number;
      }
    >();

    for (const item of items) {
      const medicalPackage = item.sourceId
        ? packagesById.get(item.sourceId)
        : null;

      if (
        packageType &&
        packageType !== 'ALL' &&
        medicalPackage?.packageType !== packageType
      ) {
        continue;
      }

      const key = medicalPackage?.id
        ? String(medicalPackage.id)
        : `manual-${item.id}`;

      const current = summary.get(key) ?? {
        packageId: medicalPackage?.id ?? null,
        packageName: medicalPackage?.name ?? 'Paquete no identificado',
        packageType: medicalPackage?.packageType ?? null,
        padCoverageMode: medicalPackage?.padCoverageMode ?? null,
        totalItems: 0,
        totalAmount: 0,
      };

      current.totalItems += 1;
      current.totalAmount += Number(item.totalPrice ?? 0);
      summary.set(key, current);
    }

    return Array.from(summary.values()).sort(
      (a, b) => b.totalItems - a.totalItems,
    );
  }

  private async getRecentQuotes(quoteWhere: Prisma.QuoteWhereInput) {
    const quotes = await this.prisma.quote.findMany({
      where: quoteWhere,
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        createdByUserId: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const userIds = quotes
      .map((quote) => quote.createdByUserId)
      .filter((id): id is number => Boolean(id));

    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: {
            id: {
              in: userIds,
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      : [];

    const usersById = new Map(
      users.map((executive) => [executive.id, executive]),
    );

    return quotes.map((quote) => ({
      ...quote,
      createdByUser: quote.createdByUserId
        ? usersById.get(quote.createdByUserId) ?? null
        : null,
    }));
  }

  private async getAuthorizedReportsUser(
    userId: number,
  ): Promise<AuthorizedReportsUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        divisionId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no autorizado.');
    }

    if (!ALLOWED_REPORT_ROLES.includes(user.role)) {
      throw new ForbiddenException('No tienes permiso para ver reportería.');
    }

    if (user.divisionId === null) {
      throw new ForbiddenException('El usuario no tiene una división asociada.');
    }

    return {
      id: user.id,
      role: user.role,
      divisionId: user.divisionId,
    };
  }
}