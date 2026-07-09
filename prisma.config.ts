
import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

config({ path: 'apps/api/.env' });
config({ path: '.env' });

export default defineConfig({
  schema: 'apps/api/prisma/schema.prisma',
  migrations: {
    path: 'apps/api/prisma/migrations',
    seed: 'tsx apps/api/prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});