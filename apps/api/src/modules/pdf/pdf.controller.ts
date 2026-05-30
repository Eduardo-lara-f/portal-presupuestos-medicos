import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { GenerateBudgetPdfInput, PdfService } from './pdf.service';

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
}