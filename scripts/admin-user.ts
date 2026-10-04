/**
 * 관리자 계정 관리 (admin_users — scrypt 해시).
 *
 *   bunx tsx scripts/admin-user.ts seed              # .env의 ADMIN_USERNAME/ADMIN_PASSWORD로 첫 계정 (이미 있으면 건너뜀)
 *   bunx tsx scripts/admin-user.ts set <아이디>       # 생성 또는 비밀번호 재설정 (비밀번호는 프롬프트로 입력)
 *   bunx tsx scripts/admin-user.ts list
 *   bunx tsx scripts/admin-user.ts delete <아이디>
 *
 * 비밀번호를 명령줄 인자로 받지 않는다 — 셸 기록에 남는다.
 * 해시 형식은 src/lib/admin/password.ts와 같다(`scrypt$N$r$p$salt$hash`).
 * 그 파일은 `server-only`라 여기서 import할 수 없어 같은 로직을 둔다.
 */
import { config } from "dotenv";
import { randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline";
import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;
/** 설정 화면 비밀번호 변경(settings/actions.ts)과 같은 기준. */
const MIN_PASSWORD = 8;

function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err
        ? reject(err)
        : resolve(["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$")),
    );
  });
}

function normalizeUsername(raw: string | undefined): string {
  const u = (raw ?? "").trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,64}$/.test(u)) {
    throw new Error("아이디는 3~64자 영문 소문자·숫자·._- 만 쓸 수 있다");
  }
  return u;
}

function checkPassword(pw: string): string {
  if (pw.length < MIN_PASSWORD) throw new Error(`비밀번호는 ${MIN_PASSWORD}자 이상이어야 한다`);
  return pw;
}

/** 입력을 화면에 찍지 않는 프롬프트. */
function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const out = rl as unknown as { _writeToOutput: (s: string) => void };
    process.stdout.write(question);
    out._writeToOutput = () => {};
    rl.question("", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  const [cmd, arg] = process.argv.slice(2);
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });

  try {
    switch (cmd) {
      case "seed": {
        const username = normalizeUsername(process.env.ADMIN_USERNAME);
        const password = checkPassword(process.env.ADMIN_PASSWORD ?? "");
        const existing = await db.adminUser.findUnique({ where: { username } });
        if (existing) {
          console.log(`이미 있음: ${username} (변경 없음 — 비밀번호를 바꾸려면 set)`);
          return;
        }
        await db.adminUser.create({ data: { username, passwordHash: await hashPassword(password) } });
        console.log(`생성: ${username}`);
        return;
      }
      case "set": {
        const username = normalizeUsername(arg);
        const pw = checkPassword(await promptHidden("새 비밀번호: "));
        if ((await promptHidden("다시 입력: ")) !== pw) throw new Error("두 입력이 다르다");
        const passwordHash = await hashPassword(pw);
        const row = await db.adminUser.upsert({
          where: { username },
          create: { username, passwordHash },
          update: { passwordHash },
        });
        console.log(`${row.createdAt.getTime() === row.updatedAt.getTime() ? "생성" : "재설정"}: ${username}`);
        return;
      }
      case "list": {
        const rows = await db.adminUser.findMany({ orderBy: { createdAt: "asc" } });
        if (!rows.length) console.log("(관리자 없음)");
        for (const r of rows) console.log(`${r.username}\t생성 ${r.createdAt.toISOString()}`);
        return;
      }
      case "delete": {
        const username = normalizeUsername(arg);
        const count = await db.adminUser.count();
        if (count <= 1) throw new Error("마지막 관리자는 지울 수 없다");
        await db.adminUser.delete({ where: { username } });
        console.log(`삭제: ${username}`);
        return;
      }
      default:
        console.log("사용법: admin-user.ts seed | set <아이디> | list | delete <아이디>");
        process.exitCode = 1;
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
