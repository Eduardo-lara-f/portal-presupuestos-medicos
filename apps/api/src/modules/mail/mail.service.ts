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
      const safePatientName = this.escapeHtml(displayPatientName);
      const safeFilename = this.escapeHtml(filename);

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `Tu presupuesto médico #${quoteId} está listo`,
        html: `
          <div style="margin:0; padding:0; background:#f4f7fb; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
            <div style="max-width:640px; margin:0 auto; padding:32px 16px;">
              <div style="background:#ffffff; border:1px solid #d8e3f0; border-radius:24px; overflow:hidden; box-shadow:0 18px 45px rgba(15,76,129,0.12);">
                <div style="background:linear-gradient(135deg,#0F4C81,#2C8ED6); padding:28px 32px; color:#ffffff;">
                  <div style="font-size:12px; font-weight:700; letter-spacing:1.8px; text-transform:uppercase; opacity:0.9;">
                    Portal de Presupuestos Médicos
                  </div>
                  <h1 style="margin:12px 0 0; font-size:26px; line-height:1.25; font-weight:800;">
                    Tu presupuesto médico está listo
                  </h1>
                  <p style="margin:10px 0 0; font-size:15px; line-height:1.6; opacity:0.95;">
                    Adjuntamos el documento PDF con el detalle de tu presupuesto.
                  </p>
                </div>

                <div style="padding:32px;">
                  <p style="margin:0 0 18px; font-size:16px; line-height:1.7;">
                    Hola <strong>${safePatientName}</strong>,
                  </p>

                  <p style="margin:0 0 22px; font-size:15px; line-height:1.7; color:#334155;">
                    Te enviamos adjunto tu presupuesto médico en formato PDF. En el documento encontrarás el detalle de las prestaciones, insumos y valores considerados para tu atención.
                  </p>

                  <div style="border:1px solid #d8e3f0; border-radius:18px; background:#f8fbff; padding:20px; margin:24px 0;">
                    <div style="font-size:12px; font-weight:800; color:#0F4C81; letter-spacing:1.4px; text-transform:uppercase; margin-bottom:14px;">
                      Resumen del envío
                    </div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      <tr>
                        <td style="padding:8px 0; font-size:14px; color:#64748b;">N° de presupuesto</td>
                        <td style="padding:8px 0; font-size:14px; color:#0f172a; font-weight:700; text-align:right;">#${quoteId}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0; font-size:14px; color:#64748b;">Archivo adjunto</td>
                        <td style="padding:8px 0; font-size:14px; color:#0f172a; font-weight:700; text-align:right;">${safeFilename}</td>
                      </tr>
                    </table>
                  </div>

                  <p style="margin:0 0 18px; font-size:14px; line-height:1.7; color:#334155;">
                    Este presupuesto es referencial y puede estar sujeto a validaciones administrativas o de cobertura según corresponda.
                  </p>

                  <p style="margin:0; font-size:14px; line-height:1.7; color:#334155;">
                    Ante cualquier duda, puedes responder este correo o contactar directamente a la clínica.
                  </p>
                </div>

                <div style="border-top:1px solid #e2e8f0; padding:20px 32px; background:#f8fafc;">
                  <p style="margin:0; font-size:13px; line-height:1.6; color:#64748b;">
                    Saludos,<br />
                    <strong style="color:#0F4C81;">Equipo Portal Presupuestos Médicos</strong>
                  </p>
                </div>
              </div>

              <p style="margin:18px 0 0; text-align:center; font-size:12px; line-height:1.6; color:#94a3b8;">
                Este correo fue generado automáticamente desde el Portal de Presupuestos Médicos.
              </p>
            </div>
          </div>
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