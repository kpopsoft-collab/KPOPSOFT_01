import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next와 같은 우선순위로 env를 읽는다(.env.local이 .env보다 우선).
config({ path: ".env.local" });
config({ path: ".env" });

/**
 * Prisma CLI 설정 (Prisma 7 — 스키마에 url을 두지 않는다).
 *
 * 마이그레이션은 풀러(PgBouncer)를 거치지 않는 직결 주소로 돌린다 —
 * `DATABASE_URL_UNPOOLED`는 Vercel Neon 연동이 자동으로 넣어 준다.
 * 앱 런타임은 풀링 주소(`DATABASE_URL`)를 쓴다(src/lib/db.ts).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
});
