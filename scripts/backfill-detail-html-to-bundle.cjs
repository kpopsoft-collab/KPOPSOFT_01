#!/usr/bin/env node
/**
 * `detail_html`(인라인 렌더용 정제본)로 남아 있는 과정 상세 자료를
 * Storage 번들(`education/<uuid>/index.html`)로 옮긴다. **1회성 백필.**
 *
 * ────────────────────────────────────────────────────────────────────
 *  ⚠️  이 스크립트는 **운영 DB와 Storage를 직접 고칩니다.**
 *      로컬 개발과 www.kpopsoft.com 이 Supabase 프로젝트 하나를 공유합니다.
 *
 *  ⚠️  **화면 코드를 먼저 배포한 뒤에 실행합니다.**
 *      공개 상세 페이지가 `bundleUrl`만 보도록 바뀌어 있어야 합니다.
 *      순서를 뒤집으면 `detail_html`이 비는 순간부터 배포 전까지
 *      상세 본문이 통째로 사라진 화면이 나갑니다.
 * ────────────────────────────────────────────────────────────────────
 *
 * 왜 옮기나 — backlogs/06-course-detail-page-redesign/03-화면구조-결정.md D1·D2·D7.
 * 정제기가 `<script>`·`@keyframes`를 지우므로 완성된 문서 한 장을 페이지 안에
 * 인라인으로 그리면 빈 화면이 된다(실측 29,435px 중 대부분이 빈 기둥이었다).
 * Storage에 올리면 격리된 origin에서 원본 그대로 새 탭에 열린다.
 *
 * **정제본이 아니라 동반 테이블의 원본을 올린다.** 정제본을 올리면 새 탭에서도
 * 스크립트가 없어 똑같이 빈 화면이 된다 — 옮기는 의미가 사라진다.
 * 원본이 없는 행은 **건너뛴다**(지어내지 않는다).
 *
 * 되돌리기 — 원본은 동반 테이블에 그대로 남으므로 `--rollback`으로 컬럼을
 * 되돌릴 수 있다. 백업은 `scripts/.detail-html-backfill-backup.json`.
 *
 * 사용법
 *   node scripts/backfill-detail-html-to-bundle.cjs            # 계획만 출력 (기본, 안전)
 *   node scripts/backfill-detail-html-to-bundle.cjs --apply    # 실제 반영
 *   node scripts/backfill-detail-html-to-bundle.cjs --rollback # 직전 백업으로 되돌리기
 */

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const BACKUP = path.join(__dirname, ".detail-html-backfill-backup.json");
const BUCKET = "education"; // src/lib/admin/course-bundle.ts BUNDLE_BUCKET과 같아야 한다
const TABLE = "education_regular_classes";
const SOURCES = "education_regular_class_html_sources";

const APPLY = process.argv.includes("--apply");
const ROLLBACK = process.argv.includes("--rollback");

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
    process.exit(1);
  }
  const db = createClient(url, key);

  if (ROLLBACK) return rollback(db);

  // 대상 — 정제본이 있고 번들은 아직 없는 행.
  const { data: rows, error } = await db
    .from(TABLE)
    .select("id,slug,name,detail_html,detail_bundle_path,detail_bundle_name")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("조회 실패:", error.message);
    process.exit(1);
  }

  const targets = rows.filter(
    (r) => (r.detail_html || "").length > 0 && !(r.detail_bundle_path || ""),
  );

  console.log(`전체 ${rows.length}행 · 백필 대상 ${targets.length}행\n`);
  if (targets.length === 0) {
    console.log("옮길 것이 없습니다.");
    return;
  }

  // 원본을 미리 다 읽는다 — 없는 행을 apply 전에 알려 주기 위해서다.
  const plans = [];
  for (const r of targets) {
    const { data: src } = await db
      .from(SOURCES)
      .select("raw,file_name")
      .eq("class_id", r.id)
      .maybeSingle();

    const raw = src && src.raw ? src.raw : "";
    plans.push({
      id: r.id,
      slug: r.slug,
      name: r.name,
      sanitizedBytes: Buffer.byteLength(r.detail_html, "utf8"),
      rawBytes: Buffer.byteLength(raw, "utf8"),
      raw,
      fileName: (src && src.file_name) || "index.html",
      // 폴더 키는 클래스 id가 아니라 업로드마다 새 UUID다
      // (docs/06-admin/07 §3-4). 백필도 같은 규칙을 따른다.
      bundlePath: `${crypto.randomUUID()}/`,
      skip: raw.length === 0,
    });
  }

  for (const p of plans) {
    if (p.skip) {
      console.log(`  ✗ ${p.slug} (${p.name}) — 동반 테이블에 원본이 없습니다. 건너뜁니다.`);
      console.log(`      정제본만 올리면 새 탭에서도 똑같이 빈 화면이 됩니다.`);
      console.log(`      어드민에서 원본 파일을 다시 올려 주세요.`);
      continue;
    }
    console.log(`  → ${p.slug} (${p.name})`);
    console.log(`      원본 ${p.rawBytes.toLocaleString()}B → ${BUCKET}/${p.bundlePath}index.html`);
    console.log(`      detail_html ${p.sanitizedBytes.toLocaleString()}B → 비움`);
  }

  const doable = plans.filter((p) => !p.skip);
  if (!APPLY) {
    console.log(`\n계획만 출력했습니다. 실제로 반영하려면 --apply 를 붙이세요.`);
    return;
  }
  if (doable.length === 0) {
    console.log("\n반영할 행이 없습니다.");
    return;
  }

  // 백업 먼저 — 되돌릴 값(정제본)을 파일로 남긴다.
  fs.writeFileSync(
    BACKUP,
    JSON.stringify(
      doable.map((p) => ({
        id: p.id,
        slug: p.slug,
        detail_html: targets.find((t) => t.id === p.id).detail_html,
        detail_bundle_path: "",
        detail_bundle_name: "",
        newBundlePath: p.bundlePath,
      })),
      null,
      2,
    ),
    "utf8",
  );
  console.log(`\n백업: ${BACKUP}`);

  for (const p of doable) {
    process.stdout.write(`\n${p.slug} … `);

    const { error: upErr } = await db.storage
      .from(BUCKET)
      .upload(`${p.bundlePath}index.html`, Buffer.from(p.raw, "utf8"), {
        contentType: "text/html",
        upsert: false,
        cacheControl: "31536000",
      });
    if (upErr) {
      console.log(`업로드 실패: ${upErr.message}`);
      continue;
    }
    process.stdout.write("업로드 OK … ");

    const { error: dbErr } = await db
      .from(TABLE)
      .update({
        detail_bundle_path: p.bundlePath,
        detail_bundle_name: p.fileName,
        detail_html: "",
      })
      .eq("id", p.id);

    if (dbErr) {
      // 삭제 순서 규칙(docs/06-admin/07 §3-4)의 백필판 — DB가 실패했으면
      // 방금 올린 폴더를 지운다. 남겨 두면 아무도 가리키지 않는 고아가 된다.
      console.log(`DB 실패: ${dbErr.message} — 올린 파일을 정리합니다`);
      await db.storage.from(BUCKET).remove([`${p.bundlePath}index.html`]);
      continue;
    }
    console.log("DB OK");
  }

  console.log("\n완료. 상세 페이지를 새로고침해 상세 자료 링크를 확인하세요.");
}

async function rollback(db) {
  if (!fs.existsSync(BACKUP)) {
    console.error("백업 파일이 없습니다:", BACKUP);
    process.exit(1);
  }
  const saved = JSON.parse(fs.readFileSync(BACKUP, "utf8"));
  console.log(`${saved.length}행을 되돌립니다.\n`);
  for (const s of saved) {
    const { error } = await db
      .from(TABLE)
      .update({
        detail_html: s.detail_html,
        detail_bundle_path: s.detail_bundle_path,
        detail_bundle_name: s.detail_bundle_name,
      })
      .eq("id", s.id);
    console.log(`  ${s.slug}: ${error ? `실패 — ${error.message}` : "OK"}`);
    // 올렸던 파일도 지운다 — 되돌린 뒤에는 아무도 가리키지 않는다.
    if (!error && s.newBundlePath) {
      await db.storage.from(BUCKET).remove([`${s.newBundlePath}index.html`]);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
