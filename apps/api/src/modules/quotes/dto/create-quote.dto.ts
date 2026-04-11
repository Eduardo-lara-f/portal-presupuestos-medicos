import { CreateQuoteItemDto } from './create-quote-item.dto';

export class CreateQuoteDto {
  divisionId!: number;
  patientId!: number;
  coverageType!: string;
  isapreId?: number;
  isaprePlanId?: number;
  fonasaCode?: string;
  payerLabel?: string;
  careType!: string;
  notes?: string;
  createdByUserId!: number;
  validityDays?: number;
  discountTotal?: number;
  items!: CreateQuoteItemDto[];
}