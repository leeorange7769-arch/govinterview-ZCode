import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client 单例。
 * 开发环境中通过 globalThis 避免 HMR 重复创建实例。
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: [] });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
