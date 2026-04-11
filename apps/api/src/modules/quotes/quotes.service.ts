import { Injectable } from '@nestjs/common';
import { CareType, CoverageType, QuoteItemSourceType, QuoteStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateQuoteDto) {
    try {
      console.log('quotes.create -> input:', JSON.stringify(data, null, 2));

      const subtotal = data.items.reduce((acc, item) => {
        return acc + Number(item.quantity) * Number(item.unitPrice);
      }, 0);

      const discountTotal = Number(data.discountTotal ?? 0);
      const total = subtotal - discountTotal;

      console.log('quotes.create -> totals:', {
        subtotal,
        discountTotal,
        total,
      });

      const quote = await this.prisma.$transaction(async (tx) => {
        return tx.quote.create({
          data: {
            divisionId: data.divisionId,
            patientId: data.patientId,
            coverageType: data.coverageType as CoverageType,
            isapreId: data.isapreId,
            isaprePlanId: data.isaprePlanId,
            fonasaCode: data.fonasaCode,
            payerLabel: data.payerLabel,
            careType: data.careType as CareType,
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
                deletedAt: null,
              })),
            },
          },
          select: {
            id: true,
            divisionId: true,
            patientId: true,
            coverageType: true,
            isapreId: true,
            isaprePlanId: true,
            careType: true,
            status: true,
            validityDays: true,
            subtotal: true,
            discountTotal: true,
            total: true,
            notes: true,
            createdByUserId: true,
            items: {
              select: {
                id: true,
                sourceType: true,
                sourceId: true,
                description: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
              },
              orderBy: {
                id: 'asc',
              },
            },
          },
        });
      });

      console.log('quotes.create -> result:', quote);
      return quote;
    } catch (error) {
      console.error('quotes.create -> error:', error);
      throw error;
    }
  }
}