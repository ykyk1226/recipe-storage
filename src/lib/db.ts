import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

const connectionString = process.env.DATABASE_URL;

if (process.env.NODE_ENV === 'production' || !globalForPrisma.prisma) {
  if (!connectionString) {
    // Fallback when DATABASE_URL is not set (e.g. during build time)
    prismaInstance = new PrismaClient();
  } else {
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prismaInstance = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
} else {
  prismaInstance = globalForPrisma.prisma;
}

export const prisma = prismaInstance;
export default prisma;
