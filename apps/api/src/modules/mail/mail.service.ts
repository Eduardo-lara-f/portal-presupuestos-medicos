import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';

type SendQuotePdfEmailParams = {
  to: string;
  patientName?: string | null;
  quoteId: number;
  pdfBuffer: Buffer;
  filename?: string;
};

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY no está configurado.');
    }

    if (!fromEmail) {
      throw new Error('RESEND_FROM_EMAIL no está configurado.');
    }

    this.resend = new Resend(apiKey);
    this.fromEmail = fromEmail;
  }

  async sendQuotePdfEmail({
    to,
    patientName,
    quoteId,
    pdfBuffer,
    filename = `presupuesto-${quoteId}.pdf`,
  }: SendQuotePdfEmailParams) {
    try {
      const displayPatientName = patientName || 'paciente';

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `Presupuesto médico #${quoteId}`,
        html: `
          <p>Hola ${this.escapeHtml(displayPatientName)},</p>
          <p>Adjuntamos tu presupuesto médico en formato PDF.</p>
          <p>Saludos,<br/>Equipo Portal Presupuestos Médicos</p>
        `,
        attachments: [
          {
            filename,
            content: pdfBuffer.toString('base64'),
          },
        ],
      });

      if (result.error) {
        console.error('Resend respondió con error:', result.error);
        throw new InternalServerErrorException(
          result.error.message || 'Resend no pudo enviar el correo.',
        );
      }

      return result.data;
    } catch (error) {
      console.error('Error enviando correo con Resend:', error);
      throw new InternalServerErrorException(
        'No se pudo enviar el correo con el PDF.',
      );
    }
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}