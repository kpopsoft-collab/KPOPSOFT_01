#!/usr/bin/env node
/**
 * Education ver3 콘텐츠 시딩 — 정적 데이터를 DB로 옮긴다.
 *
 * ────────────────────────────────────────────────────────────────────
 *  ⚠️  이 스크립트는 **운영 DB를 직접 고칩니다.**
 *
 *  로컬 개발과 배포 사이트가 Supabase 프로젝트 하나를 공유합니다. 이미지는
 *  코드(`public/education/`)에 있어 배포되어야 서버에 올라가므로, 이미지가
 *  포함된 브랜치를 먼저 배포한 뒤 실행하는 편이 안전합니다.
 * ────────────────────────────────────────────────────────────────────
 *
 * 사용법
 *   node scripts/seed-education-ver3.cjs            # 계획만 출력 (기본, 안전)
 *   node scripts/seed-education-ver3.cjs --apply    # 실제 반영
 *   node scripts/seed-education-ver3.cjs --clear    # 시딩한 행 전부 삭제
 *
 * 원본은 `src/lib/education-content.ts` 하나뿐이다. 여기에 데이터를 복사해
 * 두지 않고 그 파일을 그대로 읽어 쓴다 — 두 벌로 갈라지면 어느 쪽이 진짜인지
 * 알 수 없게 된다. (타입만 쓰는 파일이라 트랜스파일 후 그대로 실행된다.)
 *
 * 자연 키(slug / key / label)로 upsert 하므로 여러 번 실행해도 같은 결과다.
 */

/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS 실행 스크립트 */
require("dotenv").config({ path: ".env.local", quiet: true });
const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");
const { createClient } = require("@supabase/supabase-js");

const APPLY = process.argv.includes("--apply");
const CLEAR = process.argv.includes("--clear");

/** `education-content.ts`를 런타임에 읽어 온다. 값 import가 없어 그대로 돈다. */
function loadContent() {
  const file = path.join(__dirname, "..", "src", "lib", "education-content.ts");
  const source = fs.readFileSync(file, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = new Module(file);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  mod._compile(outputText, file);
  return mod.exports;
}

const C = loadContent();

/** 이미지 객체 → 컬럼 3개. 없으면 빈 값으로 둔다(널 대신 빈 문자열이 기본값). */
const img = (image, prefix) => ({
  [`${prefix}_url`]: image?.src ?? null,
  [`${prefix}_alt`]: image?.alt ?? "",
  [`${prefix}_caption`]: image?.caption ?? "",
});

const rows = {
  education_org_training: [
    {
      singleton: true,
      title: C.orgTraining.title,
      description: C.orgTraining.description,
      min_participants: C.orgTraining.minParticipants,
      ...img(C.orgTraining.image, "image"),
      cta_label: C.orgTraining.cta.label,
    },
  ],

  education_regular_classes: C.regularClasses.map((c, i) => ({
    slug: c.slug,
    index_label: c.index,
    name: c.name,
    subtitle: c.subtitle,
    description: c.description,
    duration: c.duration,
    level: c.level,
    tracks: c.tracks,
    accent: c.accent,
    ...img(c.image, "image"),
    curriculum: c.curriculum,
    detail_href: c.detailHref,
    seo_title: c.seo.title,
    seo_description: c.seo.description,
    sort_order: i,
  })),

  education_club_cohorts: C.clubCohorts.map((c, i) => ({
    label: c.label,
    status: c.status,
    recruit_period: c.recruitPeriod,
    run_period: c.runPeriod,
    price: c.price ?? "",
    list_price: c.listPrice ?? "",
    capacity: c.capacity ?? "",
    note: c.note ?? "",
    cta_disabled: c.ctaDisabled ?? false,
    show_price: c.show.price,
    show_capacity: c.show.capacity,
    show_schedule: c.show.schedule,
    show_cta: c.show.cta,
    sort_order: i,
  })),

  education_club_tiers: C.clubTiers.map((t, i) => ({
    name: t.name,
    role: t.role,
    points: t.points,
    accent: t.accent,
    character_src: t.character.src,
    character_width: t.character.width,
    character_height: t.character.height,
    sort_order: i,
  })),

  education_past_programs: C.pastPrograms.map((p, i) => ({
    slug: p.slug,
    title: p.title,
    category: p.category,
    period: p.period,
    audience: p.audience,
    duration: p.duration,
    summary: p.summary,
    outcome: p.outcome,
    accent: p.accent,
    ...img(p.coverImage, "cover_image"),
    cover_unoptimized: p.coverImage?.unoptimized ?? false,
    sort_order: i,
  })),

  education_reviews: C.eduReviews.map((r, i) => ({
    key: r.id,
    rating: r.rating,
    body: r.body,
    author: r.author,
    program: r.program,
    date_label: r.date,
    accent: r.accent,
    sort_order: i,
  })),

  education_faqs: C.eduFaqs.map((f, i) => ({
    key: f.id,
    question: f.question,
    answer: f.answer,
    sort_order: i,
  })),

  education_stats: C.eduStats.map((s, i) => ({
    key: `stat-${i + 1}`,
    value: s.value,
    label: s.label,
    sort_order: i,
  })),
};

/** 갤러리는 부모 행의 id가 필요해 따로 처리한다. */
const galleryBySlug = Object.fromEntries(
  C.pastPrograms
    .filter((p) => p.galleryImages?.length)
    .map((p) => [
      p.slug,
      p.galleryImages.map((image, i) => ({
        image_url: image.src,
        alt: image.alt,
        caption: image.caption ?? "",
        sort_order: i,
      })),
    ]),
);

const CONFLICT_KEY = {
  education_org_training: "singleton",
  education_regular_classes: "slug",
  education_club_cohorts: null, // 자연 키 없음 — clear 후 insert
  education_club_tiers: null,
  education_past_programs: "slug",
  education_reviews: "key",
  education_faqs: "key",
  education_stats: "key",
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
    process.exit(1);
  }
  const db = createClient(url, key);

  if (CLEAR) {
    // 갤러리는 부모 삭제 시 cascade 되지만 순서를 명시해 의도를 드러낸다.
    for (const table of [
      "education_past_program_images",
      "education_past_programs",
      "education_regular_classes",
      "education_club_cohorts",
      "education_club_tiers",
      "education_org_training",
      "education_reviews",
      "education_faqs",
      "education_stats",
    ]) {
      const { error } = await db.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      console.log(`${error ? "✗" : "✓"} clear ${table}${error ? " — " + error.message : ""}`);
    }
    return;
  }

  if (!APPLY) {
    console.log("계획 (--apply 를 붙여야 실제 반영됩니다)\n");
    for (const [table, list] of Object.entries(rows)) {
      console.log(`  ${table.padEnd(32)} ${list.length}행`);
    }
    const galleryCount = Object.values(galleryBySlug).flat().length;
    console.log(`  ${"education_past_program_images".padEnd(32)} ${galleryCount}행`);
    return;
  }

  for (const [table, list] of Object.entries(rows)) {
    const onConflict = CONFLICT_KEY[table];
    if (!onConflict) {
      await db.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }
    const { error } = onConflict
      ? await db.from(table).upsert(list, { onConflict })
      : await db.from(table).insert(list);
    console.log(`${error ? "✗" : "✓"} ${table} ${list.length}행${error ? " — " + error.message : ""}`);
    if (error) process.exitCode = 1;
  }

  // 갤러리 — 부모를 다시 조회해 id를 붙인다.
  const { data: parents, error: parentError } = await db
    .from("education_past_programs")
    .select("id, slug");
  if (parentError) {
    console.log("✗ education_past_program_images — " + parentError.message);
    process.exitCode = 1;
    return;
  }

  await db
    .from("education_past_program_images")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  const images = parents.flatMap((parent) =>
    (galleryBySlug[parent.slug] ?? []).map((image) => ({ ...image, program_id: parent.id })),
  );
  if (images.length > 0) {
    const { error } = await db.from("education_past_program_images").insert(images);
    console.log(`${error ? "✗" : "✓"} education_past_program_images ${images.length}행${error ? " — " + error.message : ""}`);
    if (error) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
