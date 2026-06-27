import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CareType,
  CoverageType,
  Prisma,
  QuoteItemSourceType,
  QuoteStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    status?: QuoteStatus;
    divisionId?: number;
    patientId?: number;
  }) {
    const where: Prisma.QuoteWhereInput = {
      deletedAt: null,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.divisionId) {
      where.divisionId = params.divisionId;
    }

    if (params.patientId) {
      where.patientId = params.patientId;
    }

    return this.prisma.quote.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      include: {
        patient: {
          select: {
            id: true,
            rut: true,
            firstName: true,
            lastName: true,
            middleName: true,
          },
        },
        division: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        items: {
          where: { deletedAt: null },
          orderBy: { id: 'asc' },
        },
      },
    });
  }

  async create(data: CreateQuoteDto) {
    this.validateEnums(data);
    this.validateCoveragePayload(data);

    const subtotal = data.items.reduce((acc, item) => {
      return acc + Number(item.quantity) * Number(item.unitPrice);
    }, 0);

    const discountTotal = Number(data.discountTotal ?? 0);
    const total = subtotal - discountTotal;

    return this.prisma.$transaction(async (tx) => {
      return tx.quote.create({
        data: {
          divisionId: data.divisionId,
          patientId: data.patientId,
          coverageType: data.coverageType,
          isapreId: data.isapreId ?? null,
          isaprePlanId: data.isaprePlanId ?? null,
          fonasaCode: data.fonasaCode?.trim() || null,
          payerLabel: data.payerLabel?.trim() || null,
          careType: data.careType,
          status: QuoteStatus.DRAFT,
          validityDays: data.validityDays ?? 15,
          subtotal,
          discountTotal,
          total,
          notes: data.notes,
          createdByUserId: data.createdByUserId,
          deletedAt: null,
          items: {
            create: data.items.map((item) => ({
              sourceType: item.sourceType as QuoteItemSourceType,
              sourceId: item.sourceId,
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.quantity) * Number(item.unitPrice),
              type: item.type,
              parentId: item.parentId ?? null,
              editable: true,
              deletedAt: null,
            })),
          },
        },
        include: {
          items: {
            where: { deletedAt: null },
            orderBy: { id: 'asc' },
          },
        },
      });
    });
  }

  async addItem(
    quoteId: number,
    item: {
      sourceType: QuoteItemSourceType;
      sourceId: number;
      description: string;
      quantity: number;
      unitPrice: number;
      type: 'PROCEDURE' | 'BASKET' | 'PACKAGE' | 'MEDICAL_FEE';
      parentId?: number;
    },
  ) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      throw new BadRequestException('Cotización no encontrada');
    }

    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException('Cotización cerrada');
    }

    if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) < 1) {
      throw new BadRequestException('Cantidad inválida');
    }

    if (!Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) < 0) {
      throw new BadRequestException('Precio inválido');
    }

    if (item.parentId) {
      const parent = await this.prisma.quoteItem.findUnique({
        where: { id: item.parentId },
      });

      if (!parent) {
        throw new BadRequestException('Parent no existe');
      }

      if (parent.type === 'PROCEDURE') {
        throw new BadRequestException('PROCEDURE no puede tener hijos');
      }
    }

    if ((item.type === 'PACKAGE' || item.type === 'BASKET') && item.parentId) {
      throw new BadRequestException(`${item.type} no puede tener parent`);
    }

    const createdItem = await this.prisma.quoteItem.create({
      data: {
        quoteId,
        parentId: item.parentId ?? null,
        sourceType: item.sourceType,
        sourceId: Number(item.sourceId),
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.quantity) * Number(item.unitPrice),
        type: item.type,
        deletedAt: null,
      },
    });

    await this.recalculateQuoteTree(quoteId);

    return {
      id: createdItem.id,
      quoteId: createdItem.quoteId,
      parentId: createdItem.parentId,
      sourceType: createdItem.sourceType,
      sourceId: createdItem.sourceId,
      description: createdItem.description,
      quantity: Number(createdItem.quantity),
      unitPrice: Number(createdItem.unitPrice),
      totalPrice: Number(createdItem.totalPrice),
      type: createdItem.type,
    };
  }

  async addPackage(
    quoteId: number,
    data: {
      packageId: number;
      applyCampaign?: boolean;
      campaignId?: number;
      padFactor?: number;
    },
  ) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      throw new BadRequestException('Cotización no encontrada');
    }

    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException('Cotización cerrada');
    }

    const pkg = await this.prisma.medicalPackage.findFirst({
      where: {
        id: data.packageId,
        active: true,
        deletedAt: null,
      },
      include: {
        items: {
          where: { deletedAt: null },
          include: {
            procedure: true,
          },
        },
      },
    });

    if (!pkg) {
      throw new BadRequestException('Paquete no encontrado');
    }

    const isPad = pkg.packageType === 'PAD';
    const padFactor = isPad ? Number(data.padFactor ?? 0.5) : 1;

    if (isPad && ![0.25, 0.5].includes(padFactor)) {
      throw new BadRequestException('padFactor inválido');
    }

    let campaign: {
      id: number;
      discountPercentage: number;
    } | null = null;

    if (data.applyCampaign) {
      const foundCampaign = await this.prisma.campaign.findFirst({
        where: {
          id: data.campaignId,
          packageId: pkg.id,
          active: true,
        },
      });

      if (!foundCampaign) {
        throw new BadRequestException('Campaña no válida');
      }

      campaign = {
        id: foundCampaign.id,
        discountPercentage: Number(foundCampaign.discountPercentage),
      };
    }

    const createdParent = await this.prisma.$transaction(async (tx) => {
      const parent = await tx.quoteItem.create({
        data: {
          quoteId,
          sourceType: QuoteItemSourceType.PACKAGE,
          sourceId: pkg.id,
          description: pkg.name,
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          type: 'PACKAGE',
          editable: false,
          deletedAt: null,
        },
      });

      for (const pkgItem of pkg.items) {
        const procedureUnitPrice = await this.resolveProcedureUnitPrice(
          tx,
          quote,
          pkgItem.procedureId,
          pkgItem.fixedPrice,
        );

        const finalUnitPrice = Number(procedureUnitPrice) * padFactor;

        await tx.quoteItem.create({
          data: {
            quoteId,
            parentId: parent.id,
            sourceType: QuoteItemSourceType.PROCEDURE,
            sourceId: pkgItem.procedureId,
            description: pkgItem.procedure.name,
            quantity: Number(pkgItem.quantity),
            unitPrice: finalUnitPrice,
            totalPrice: finalUnitPrice * Number(pkgItem.quantity),
            type: 'PROCEDURE',
            editable: false,
            deletedAt: null,
          },
        });
      }

      if (!isPad) {
        const fees = await this.findMedicalFeesForQuote(
          tx,
          quote,
          pkg.items.map((i) => i.procedureId),
        );

        for (const fee of fees) {
          const discountRate = campaign
            ? campaign.discountPercentage / 100
            : 0;

          const feeUnitPrice = Number(fee.amount) * (1 - discountRate);

          await tx.quoteItem.create({
            data: {
              quoteId,
              parentId: parent.id,
              sourceType: QuoteItemSourceType.MANUAL,
              sourceId: fee.id,
              description: `Honorario ${fee.professional.firstName} ${fee.professional.lastName} - ${fee.procedure.name}`,
              quantity: 1,
              unitPrice: feeUnitPrice,
              totalPrice: feeUnitPrice,
              type: 'MEDICAL_FEE',
              editable: false,
              deletedAt: null,
            },
          });
        }
      }

      return parent;
    });

    await this.recalculateQuoteTree(quoteId);

    return {
      packageQuoteItemId: createdParent.id,
      isPad,
      goToSummary: isPad,
      campaignApplied: !!campaign,
    };
  }

  async updateStatus(quoteId: number, status: QuoteStatus) {
    if (!Object.values(QuoteStatus).includes(status)) {
      throw new BadRequestException('Estado inválido');
    }

    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        items: { where: { deletedAt: null } },
      },
    });

    if (!quote) {
      throw new BadRequestException('Cotización no encontrada');
    }

    if (quote.status === QuoteStatus.FINALIZED) {
      throw new BadRequestException('Ya está cerrada');
    }

    if (!quote.items.length) {
      throw new BadRequestException('Sin ítems');
    }

    await this.recalculateQuoteTree(quoteId);

    return this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        status,
      },
    });
  }

  async findOne(id: number) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!quote) {
      throw new BadRequestException('No existe');
    }

    return quote;
  }

  private validateEnums(data: CreateQuoteDto) {
    if (!Object.values(CoverageType).includes(data.coverageType)) {
      throw new BadRequestException('coverageType inválido');
    }

    if (!Object.values(CareType).includes(data.careType)) {
      throw new BadRequestException('careType inválido');
    }
  }

  private validateCoveragePayload(data: {
    coverageType: CoverageType;
    isapreId?: number;
    isaprePlanId?: number;
    fonasaCode?: string;
    payerLabel?: string;
  }) {
    if (data.coverageType === CoverageType.ISAPRE_PLAN) {
      if (!data.isapreId || !data.isaprePlanId) {
        throw new BadRequestException(
          'Para cobertura ISAPRE_PLAN debe indicar isapre y plan.',
        );
      }
    }

    if (data.coverageType === CoverageType.FONASA) {
      if (!data.fonasaCode?.trim()) {
        throw new BadRequestException(
          'Para cobertura FONASA debe indicar fonasaCode.',
        );
      }
    }

    if (
      data.coverageType === CoverageType.PARTICULAR ||
      data.coverageType === CoverageType.OTHER
    ) {
      if (!data.payerLabel?.trim()) {
        throw new BadRequestException(
          'Para cobertura PARTICULAR u OTHER debe indicar payerLabel.',
        );
      }
    }
  }

  private async resolveProcedureUnitPrice(
    tx: Prisma.TransactionClient,
    quote: {
      divisionId: number;
      coverageType: CoverageType;
      isapreId: number | null;
      isaprePlanId: number | null;
      fonasaCode: string | null;
      payerLabel: string | null;
    },
    procedureId: number,
    fixedPrice: Prisma.Decimal | number | null,
  ) {
    if (fixedPrice !== null && fixedPrice !== undefined) {
      return Number(fixedPrice);
    }

    const where: Prisma.ProcedurePriceWhereInput = {
      divisionId: quote.divisionId,
      procedureId,
      coverageType: quote.coverageType,
      active: true,
      deletedAt: null,
    };

    if (quote.coverageType === CoverageType.ISAPRE_PLAN) {
      where.isapreId = quote.isapreId;
      where.isaprePlanId = quote.isaprePlanId;
    }

    if (quote.coverageType === CoverageType.FONASA) {
      where.fonasaCode = quote.fonasaCode;
      where.isapreId = null;
      where.isaprePlanId = null;
    }

    if (
      quote.coverageType === CoverageType.PARTICULAR ||
      quote.coverageType === CoverageType.OTHER
    ) {
      where.payerLabel = quote.payerLabel;
      where.isapreId = null;
      where.isaprePlanId = null;
      where.fonasaCode = null;
    }

    const exact = await tx.procedurePrice.findFirst({
      where,
      orderBy: [{ effectiveFrom: 'desc' }, { updatedAt: 'desc' }],
    });

    if (exact) {
      return Number(exact.price);
    }

    const fallback = await tx.procedurePrice.findFirst({
      where: {
        divisionId: quote.divisionId,
        procedureId,
        active: true,
        deletedAt: null,
      },
      orderBy: [{ effectiveFrom: 'desc' }, { updatedAt: 'desc' }],
    });

    return Number(fallback?.price ?? 0);
  }

  private async findMedicalFeesForQuote(
    tx: Prisma.TransactionClient,
    quote: {
      divisionId: number;
      coverageType: CoverageType;
      isapreId: number | null;
      isaprePlanId: number | null;
    },
    procedureIds: number[],
  ) {
    const where: Prisma.MedicalFeeWhereInput = {
      divisionId: quote.divisionId,
      procedureId: { in: procedureIds },
      coverageType: quote.coverageType,
      active: true,
      deletedAt: null,
    };

    if (quote.coverageType === CoverageType.ISAPRE_PLAN) {
      where.isapreId = quote.isapreId;
      where.isaprePlanId = quote.isaprePlanId;
    }

    if (
      quote.coverageType === CoverageType.FONASA ||
      quote.coverageType === CoverageType.PARTICULAR ||
      quote.coverageType === CoverageType.OTHER
    ) {
      where.isapreId = null;
      where.isaprePlanId = null;
    }

    return tx.medicalFee.findMany({
      where,
      include: {
        professional: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        procedure: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  private async recalculateQuoteTree(quoteId: number) {
    const items = await this.prisma.quoteItem.findMany({
      where: { quoteId, deletedAt: null },
    });

    const map = new Map<number, any>();

    items.forEach((i) =>
      map.set(i.id, {
        ...i,
        totalPrice: Number(i.totalPrice),
        children: [],
      }),
    );

    const roots: any[] = [];

    items.forEach((item) => {
      if (item.parentId) {
        const parent = map.get(item.parentId);
        if (parent) parent.children.push(map.get(item.id));
      } else {
        roots.push(map.get(item.id));
      }
    });

    const calc = (node: any): number => {
      if (!node.children.length) {
        node.totalPrice = Number(node.quantity) * Number(node.unitPrice);
        return node.totalPrice;
      }

      const total = node.children.reduce(
        (acc: number, child: any) => acc + calc(child),
        0,
      );

      node.totalPrice = total;
      return total;
    };

    const subtotal = roots.reduce((acc, r) => acc + calc(r), 0);

    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
    });

    const total = subtotal - Number(quote?.discountTotal ?? 0);

    for (const node of map.values()) {
      await this.prisma.quoteItem.update({
        where: { id: node.id },
        data: {
          totalPrice: Number(node.totalPrice),
        },
      });
    }

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: { subtotal, total },
    });
  }

  async updateItem(
    quoteId: number,
    itemId: number,
    data: {
      quantity?: number;
    },
  ) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      throw new BadRequestException('Cotización no encontrada');
    }

    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException('Cotización cerrada');
    }

    const item = await this.prisma.quoteItem.findFirst({
      where: {
        id: itemId,
        quoteId,
        deletedAt: null,
      },
    });

    if (!item) {
      throw new BadRequestException('Ítem no encontrado');
    }

    if (
      item.editable === false ||
      item.type === 'PACKAGE' ||
      item.type === 'BASKET'
    ) {
      throw new BadRequestException('El ítem no puede editarse');
    }

    const childrenCount = await this.prisma.quoteItem.count({
      where: {
        parentId: item.id,
        deletedAt: null,
      },
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        'El ítem tiene hijos y no puede editarse directamente',
      );
    }

    const quantity = Number(data.quantity ?? item.quantity);

    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new BadRequestException('Cantidad inválida');
    }

    const updatedItem = await this.prisma.quoteItem.update({
      where: { id: item.id },
      data: {
        quantity,
        totalPrice: Number(item.unitPrice) * quantity,
      },
    });

    await this.recalculateQuoteTree(quoteId);

    return {
      id: updatedItem.id,
      quoteId: updatedItem.quoteId,
      parentId: updatedItem.parentId,
      sourceType: updatedItem.sourceType,
      sourceId: updatedItem.sourceId,
      description: updatedItem.description,
      quantity: Number(updatedItem.quantity),
      unitPrice: Number(updatedItem.unitPrice),
      totalPrice: Number(updatedItem.totalPrice),
      type: updatedItem.type,
    };
  }

  async deleteItem(quoteId: number, itemId: number) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      throw new BadRequestException('Cotización no encontrada');
    }

    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException('Cotización cerrada');
    }

    const item = await this.prisma.quoteItem.findFirst({
      where: {
        id: itemId,
        quoteId,
        deletedAt: null,
      },
    });

    if (!item) {
      throw new BadRequestException('Ítem no encontrado');
    }

    if (
      item.editable === false ||
      item.type === 'PACKAGE' ||
      item.type === 'BASKET'
    ) {
      throw new BadRequestException(
        'El ítem no puede eliminarse individualmente',
      );
    }

    const childrenCount = await this.prisma.quoteItem.count({
      where: {
        parentId: item.id,
        deletedAt: null,
      },
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        'El ítem tiene hijos y no puede eliminarse individualmente',
      );
    }

    await this.prisma.quoteItem.update({
      where: { id: item.id },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.recalculateQuoteTree(quoteId);

    return { success: true };
  }

  async deleteGroup(quoteId: number, groupItemId: number) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      throw new BadRequestException('Cotización no encontrada');
    }

    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException('Cotización cerrada');
    }

    const root = await this.prisma.quoteItem.findFirst({
      where: {
        id: groupItemId,
        quoteId,
        deletedAt: null,
      },
    });

    if (!root) {
      throw new BadRequestException('Grupo no encontrado');
    }

    if (!['PACKAGE', 'BASKET'].includes(String(root.type))) {
      throw new BadRequestException(
        'El grupo indicado no es eliminable como grupo',
      );
    }

    const items = await this.prisma.quoteItem.findMany({
      where: {
        quoteId,
        deletedAt: null,
      },
      orderBy: { id: 'asc' },
    });

    const idsToDelete = new Set<number>();
    idsToDelete.add(root.id);

    let changed = true;
    while (changed) {
      changed = false;
      for (const current of items) {
        if (
          current.parentId &&
          idsToDelete.has(current.parentId) &&
          !idsToDelete.has(current.id)
        ) {
          idsToDelete.add(current.id);
          changed = true;
        }
      }
    }

    await this.prisma.quoteItem.updateMany({
      where: {
        id: { in: Array.from(idsToDelete) },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.recalculateQuoteTree(quoteId);

    return { success: true };
  }
}