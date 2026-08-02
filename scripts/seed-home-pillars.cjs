#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS 실행 스크립트 */
/**
 * 핵심 비즈니스(What We Do) 콘텐츠 시딩 — 카드 3장 + 사례 슬라이드 8건.
 *
 * ⚠️ 운영 DB를 직접 고칩니다. 이미지가 포함된 브랜치를 먼저 배포한 뒤 실행하세요.
 *
 *   node scripts/seed-home-pillars.cjs           # 계획만 출력 (기본, 안전)
 *   node scripts/seed-home-pillars.cjs --apply   # 실제 반영
 *
 * 사례 슬라이드는 `src/lib/pillar-examples.ts`를 그대로 읽는다(두 벌로 갈라지지
 * 않게). 카드 3장은 `what-we-do.tsx`에 JSX와 섞여 있어 파싱 대신 여기에 값을
 * 적어 뒀다 — 시딩 후에는 DB가 원본이고, 코드 쪽은 폴백으로만 남는다.
 */

require("dotenv").config({ path: ".env.local", quiet: true });
const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");
const { createClient } = require("@supabase/supabase-js");

const APPLY = process.argv.includes("--apply");

function loadModule(relPath) {
  const file = path.join(__dirname, "..", relPath);
  const { outputText } = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = new Module(file);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  mod._compile(outputText, file);
  return mod.exports;
}

const { softwareExamples, aiExamples } = loadModule("src/lib/pillar-examples.ts");

const pillars = [
  {
    key: "software",
    title: "Software",
    description: "웹·앱 서비스와 업무 시스템을 기획하고 개발합니다.",
    tags: ["웹 서비스", "모바일 앱", "관리자 시스템", "내부 운영 도구"],
    image_url: "/work/software-overview-v2.png",
    image_alt:
      "소프트웨어 제작 범위 — 웹, 모바일 앱, 관리자 시스템, 내부 운영 도구 화면 모음",
    accent: "blue",
    sort_order: 0,
  },
  {
    key: "ai",
    title: "AI Solutions",
    description: "반복 업무를 줄이고 의사결정을 돕는 맞춤형 AI 솔루션을 구축합니다.",
    tags: ["AI 챗봇", "AI 에이전트", "업무 자동화", "사내 AI Tool"],
    image_url: "/work/ai-solutions-overview.png",
    image_alt: "AI 솔루션 화면 — 매출 리포트를 요약하는 어시스턴트와 자동화된 작업 목록",
    accent: "red",
    sort_order: 1,
  },
  {
    key: "education",
    title: "Education",
    description: "AI를 실제 업무에 활용할 수 있도록 실습 중심의 교육을 제공합니다.",
    tags: ["조직·기업 맞춤 교육", "정규 클래스", "지식 공유 커뮤니티 클럽"],
    image_url: "/education/education-lecture-01.jpg",
    image_alt:
      "교육 현장 — 강사가 화면을 가리키며 설명하고 수강생들이 각자 노트북으로 따라 하는 강의실",
    accent: "mint",
    sort_order: 2,
  },
];

const examples = [
  ...softwareExamples.map((e, i) => ({ ...e, pillar_key: "software", sort_order: i })),
  ...aiExamples.map((e, i) => ({ ...e, pillar_key: "ai", sort_order: i })),
].map((e) => ({
  pillar_key: e.pillar_key,
  key: e.id,
  name: e.name,
  client: e.client ?? "",
  headline: e.headline,
  description: e.description,
  highlights: e.highlights,
  image_url: e.image.src,
  image_alt: e.image.alt,
  accent: e.accent,
  sort_order: e.sort_order,
}));

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
    process.exit(1);
  }

  if (!APPLY) {
    console.log("계획 (--apply 를 붙여야 실제 반영됩니다)\n");
    console.log(`  home_pillars           ${pillars.length}행`);
    console.log(`  home_pillar_examples   ${examples.length}행`);
    return;
  }

  const db = createClient(url, key);
  for (const [table, rows] of [
    ["home_pillars", pillars],
    ["home_pillar_examples", examples],
  ]) {
    const { error } = await db.from(table).upsert(rows, { onConflict: "key" });
    console.log(`${error ? "✗" : "✓"} ${table} ${rows.length}행${error ? " — " + error.message : ""}`);
    if (error) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
