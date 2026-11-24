import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

const shared = globalThis as typeof globalThis & {
  shrinkPrisma?: PrismaClient;
};

export function db() {
  if (!shared.shrinkPrisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString || !/^postgres(?:ql)?:\/\//.test(connectionString)) {
      throw new Error("DATABASE_URL ausente ou inválida");
    }
    const pool = new Pool({
      connectionString,
      max: process.env.VERCEL ? 5 : 16,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 5000,
    });
    if (process.env.VERCEL) attachDatabasePool(pool);
    shared.shrinkPrisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  }
  return shared.shrinkPrisma;
}
