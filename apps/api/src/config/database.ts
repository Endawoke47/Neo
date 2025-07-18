/**
 * Minimal Database Configuration
 * Zero-error Prisma setup
 */

import { PrismaClient } from '@prisma/client';
import { env } from './environment';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

export default prisma;
