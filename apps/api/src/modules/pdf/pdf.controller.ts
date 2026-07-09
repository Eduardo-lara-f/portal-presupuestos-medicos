import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import {
  GenerateAndUploadBudgetPdfInput,
  GenerateBudgetPdfInput,
  PdfService,
} from './pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('budget')
  async generateBudgetPdf(
    @Body() body: GenerateBudgetPdfInput,
    @Res() res: Response,
  ) {
    console.log('BODY PDF:', JSON.stringify(body, null, 2));

    const pdfBuffer = await this.pdfService.generateBudgetPdf(body);
    const fileName = `presupuesto-${Date.now()}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Post('budget/upload')
  async generateAndUploadBudgetPdf(@Body() body: GenerateAndUploadBudgetPdfInput) {
    console.log('BODY PDF S3:', JSON.stringify(body, null, 2));

    return this.pdfService.generateAndUploadBudgetPdf(body);
  }
}