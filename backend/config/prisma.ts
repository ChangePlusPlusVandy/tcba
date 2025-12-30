import { PrismaClient } from '@prisma/client';

const globalPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalPrisma.prisma = prisma;
}

export default prisma;
