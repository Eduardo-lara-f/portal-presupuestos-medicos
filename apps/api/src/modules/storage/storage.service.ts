import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type UploadPdfParams = {
  key: string;
  buffer: Buffer;
  contentType?: string;
};

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly signedUrlExpiresSeconds: number;

  constructor() {
    const region = process.env.AWS_REGION;
    const bucketName = process.env.AWS_S3_BUCKET;

    if (!region) {
      throw new Error('AWS_REGION no está configurado.');
    }

    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET no está configurado.');
    }

    this.bucketName = bucketName;
    this.signedUrlExpiresSeconds = Number(
      process.env.AWS_S3_SIGNED_URL_EXPIRES_SECONDS ?? 900,
    );

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  async uploadPdf({
    key,
    buffer,
    contentType = 'application/pdf',
  }: UploadPdfParams) {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );

      return {
        bucket: this.bucketName,
        key,
      };
    } catch (error) {
      console.error('Error subiendo PDF a S3:', error);
      throw new InternalServerErrorException(
        'No se pudo subir el PDF a S3.',
      );
    }
  }

  async getSignedUrl(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return getSignedUrl(this.s3Client, command, {
        expiresIn: this.signedUrlExpiresSeconds,
      });
    } catch (error) {
      console.error('Error generando signed URL de S3:', error);
      throw new InternalServerErrorException(
        'No se pudo generar el enlace del PDF.',
      );
    }
  }

  async getObjectBuffer(key: string) {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      if (!response.Body) {
        throw new Error('S3 respondió sin body.');
      }

      const chunks: Uint8Array[] = [];
      const stream = response.Body as NodeJS.ReadableStream;

      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error leyendo archivo desde S3:', error);
      throw new InternalServerErrorException(
        'No se pudo leer el archivo desde S3.',
      );
    }
  }

  async deleteObject(key: string) {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      return {
        deleted: true,
        key,
      };
    } catch (error) {
      console.error('Error eliminando archivo de S3:', error);
      throw new InternalServerErrorException(
        'No se pudo eliminar el archivo de S3.',
      );
    }
  }

  buildQuotePdfKey(params: {
    divisionId: number;
    quoteId: number;
    createdAt?: Date;
  }) {
    const createdAt = params.createdAt ?? new Date();
    const year = createdAt.getFullYear();
    const month = String(createdAt.getMonth() + 1).padStart(2, '0');

    return `quotes/division-${params.divisionId}/${year}/${month}/quote-${params.quoteId}.pdf`;
  }
}