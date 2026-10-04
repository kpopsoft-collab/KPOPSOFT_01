import "server-only";

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma 클라이언트 싱글턴 (Neon serverless 드라이버 어댑터).
 *
 * dev 서버의 HMR이 모듈을 다시 읽을 때마다 새 클라이언트(=새 커넥션 풀)가
 * 생기지 않도록 globalThis에 붙여 재사용한다.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}

export function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createClient();
  return globalForPrisma.prisma;
}

/** DB가 설정돼 있는지 — 없으면 각 데이터 계층이 목/정적 폴백으로 돈다. */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
