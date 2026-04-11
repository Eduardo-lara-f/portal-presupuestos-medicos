export class CreateQuoteItemDto {
  sourceType!: string;
  sourceId?: number;
  description!: string;
  quantity!: number;
  unitPrice!: number;
}