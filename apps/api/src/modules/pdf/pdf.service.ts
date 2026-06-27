import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

type PdfBudgetItem = {
  section: 'PROCEDURE' | 'SUPPLY' | 'DRUG' | 'BED';
  code: string;
  name: string;
  quantity: number;
  appliedFactor: number;
  unitPrice: number;
  totalPrice: number;
};

export type GenerateBudgetPdfInput = {
  quotationNumber?: string;
  divisionName: string;
  careType: 'AMBULATORY' | 'SURGICAL';
  patient: {
    rut: string;
    fullName: string;
    email?: string;
    phone?: string;
  };
  coverage?: {
    type?: string;
    label?: string;
    detailLabel?: string;
    coverageName?: string;
    isapreName?: string;
    planName?: string;
    fonasaCode?: string;
    payerLabel?: string;
  };
  items: PdfBudgetItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  notes?: string;
  generatedAt?: string;
};

@Injectable()
export class PdfService {
  async generateBudgetPdf(data: GenerateBudgetPdfInput): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();
      const html = this.buildHtml(data ?? ({} as GenerateBudgetPdfInput));

      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
      });

      await page.emulateMediaType('screen');

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '24px',
          right: '24px',
          bottom: '24px',
          left: '24px',
        },
      });

      return Buffer.from(pdf);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('PDF generation error:', error);

      throw new InternalServerErrorException(
        `No se pudo generar el PDF: ${message}`,
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private buildHtml(data: GenerateBudgetPdfInput): string {
    const safeData = data ?? ({} as GenerateBudgetPdfInput);

    const generatedAt =
      safeData.generatedAt ??
      new Date().toLocaleString('es-CL', {
        dateStyle: 'short',
        timeStyle: 'short',
      });

    const patient = safeData.patient ?? {
      rut: '-',
      fullName: '-',
      email: '-',
      phone: '-',
    };

    const coverage = safeData.coverage ?? {};
    const coverageName =
      coverage.coverageName ??
      coverage.label ??
      coverage.isapreName ??
      coverage.payerLabel ??
      coverage.type ??
      '-';
    const coverageDetail =
      coverage.detailLabel ??
      coverage.planName ??
      coverage.fonasaCode ??
      coverage.payerLabel ??
      '-';

    const items = Array.isArray(safeData.items) ? safeData.items : [];

    const itemsRows = items
      .map(
        (item) => `
          <tr>
            <td>${this.escapeHtml(item.section)}</td>
            <td>${this.escapeHtml(item.code)}</td>
            <td>${this.escapeHtml(item.name)}</td>
            <td style="text-align:right;">${this.escapeHtml(item.quantity)}</td>
            <td style="text-align:right;">${this.formatFactor(item.appliedFactor)}</td>
            <td style="text-align:right;">${this.formatCurrency(item.unitPrice)}</td>
            <td style="text-align:right;">${this.formatCurrency(item.totalPrice)}</td>
          </tr>
        `,
      )
      .join('');

    return `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Presupuesto médico</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #1f2937;
              font-size: 12px;
              margin: 0;
            }

            .page {
              padding: 8px;
            }

            .header {
              background: linear-gradient(135deg, #0F4C81, #2C8ED6);
              color: white;
              padding: 20px;
              border-radius: 12px;
              margin-bottom: 20px;
            }

            .header h1 {
              margin: 0 0 6px 0;
              font-size: 24px;
            }

            .header p {
              margin: 2px 0;
              opacity: 0.95;
            }

            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 20px;
            }

            .card {
              border: 1px solid #dbeafe;
              border-radius: 12px;
              padding: 14px;
              background: #f8fbff;
            }

            .card h2 {
              margin: 0 0 10px 0;
              font-size: 15px;
              color: #0F4C81;
            }

            .row {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              margin-bottom: 6px;
            }

            .label {
              color: #6b7280;
            }

            .value {
              font-weight: 600;
              text-align: right;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }

            th, td {
              border: 1px solid #e5e7eb;
              padding: 8px;
              vertical-align: top;
            }

            th {
              background: #eff6ff;
              color: #0F4C81;
              text-align: left;
            }

            .totals {
              margin-top: 20px;
              margin-left: auto;
              width: 320px;
            }

            .totals .row {
              border-bottom: 1px solid #e5e7eb;
              padding: 6px 0;
            }

            .totals .total {
              font-size: 16px;
              font-weight: 700;
              color: #111827;
            }

            .notes {
              margin-top: 20px;
              border: 1px solid #dbeafe;
              background: #f8fbff;
              border-radius: 12px;
              padding: 14px;
            }

            .notes h2 {
              margin: 0 0 8px 0;
              font-size: 15px;
              color: #0F4C81;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <h1>Presupuesto médico</h1>
              <p>N° presupuesto: ${this.escapeHtml(safeData.quotationNumber ?? 'Borrador')}</p>
              <p>División: ${this.escapeHtml(safeData.divisionName)}</p>
              <p>Tipo: ${safeData.careType === 'AMBULATORY' ? 'Ambulatorio' : 'Quirúrgico'}</p>
              <p>Fecha de generación: ${this.escapeHtml(generatedAt)}</p>
            </div>

            <div class="grid">
              <div class="card">
                <h2>Paciente</h2>
                <div class="row"><span class="label">RUT</span><span class="value">${this.escapeHtml(patient.rut)}</span></div>
                <div class="row"><span class="label">Nombre</span><span class="value">${this.escapeHtml(patient.fullName)}</span></div>
                <div class="row"><span class="label">Correo</span><span class="value">${this.escapeHtml(patient.email)}</span></div>
                <div class="row"><span class="label">Teléfono</span><span class="value">${this.escapeHtml(patient.phone)}</span></div>
              </div>

              <div class="card">
                <h2>Cobertura</h2>
                <div class="row"><span class="label">Convenio</span><span class="value">${this.escapeHtml(coverageName)}</span></div>
                <div class="row"><span class="label">Detalle</span><span class="value">${this.escapeHtml(coverageDetail)}</span></div>
              </div>
            </div>

            <div class="card">
              <h2>Detalle del presupuesto</h2>
              <table>
                <thead>
                  <tr>
                    <th>Sección</th>
                    <th>Código</th>
                    <th>Ítem</th>
                    <th>Cant.</th>
                    <th>Factor</th>
                    <th>Unitario</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows || `
                    <tr>
                      <td colspan="7" style="text-align:center;">Sin ítems</td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>

            <div class="totals">
              <div class="row">
                <span class="label">Subtotal</span>
                <span class="value">${this.formatCurrency(safeData.subtotal)}</span>
              </div>
              <div class="row">
                <span class="label">Descuento</span>
                <span class="value">${this.formatCurrency(safeData.discountTotal)}</span>
              </div>
              <div class="row total">
                <span>Total</span>
                <span>${this.formatCurrency(safeData.total)}</span>
              </div>
            </div>

            <div class="notes">
              <h2>Observaciones</h2>
              <div>${this.escapeHtml(safeData.notes)}</div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private formatCurrency(value: unknown): string {
    const amount = Number(value);

    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);
  }

  private formatFactor(value: unknown): string {
    const factor = Number(value);

    if (!Number.isFinite(factor)) {
      return '-';
    }

    return `${Math.round(factor * 100)}%`;
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '-')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}