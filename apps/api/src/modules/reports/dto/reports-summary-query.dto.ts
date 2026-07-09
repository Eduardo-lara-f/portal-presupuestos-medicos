export class ReportsSummaryQueryDto {
  fromDate?: string;
  toDate?: string;
  executiveId?: string;
  packageType?: 'PAD' | 'PACKAGE' | 'ALL';
}