import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://neondb_owner:npg_WNsv7kcf9DYQ@ep-lively-cake-acfulcip-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

    if (!connectionString) {
      throw new Error('DATABASE_URL no está definido');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg({ connectionString });

    super({ adapter });

    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
  }
}