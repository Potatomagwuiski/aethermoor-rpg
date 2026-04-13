import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

export let prisma: PrismaClient;
try {
  prisma = global.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
} catch (e) {
  console.error("FATAL: PrismaClient failed to initialize. Details:");
  console.error(e);
  process.exit(1);
}
