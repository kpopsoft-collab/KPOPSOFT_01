#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS 실행 스크립트 */
/**
 * 포트폴리오(work_items) 실제 사례 콘텐츠 반영 스크립트.
 *
 * ────────────────────────────────────────────────────────────────────
 *  ⚠️  이 스크립트는 **운영 DB를 직접 고칩니다.**
 *
 *  로컬 개발과 www.kpopsoft.com 이 Supabase 프로젝트 하나를 공유하므로,
 *  여기서 쓴 내용은 즉시 라이브 사이트에 반영됩니다. 반면 이미지 파일은
 *  코드(`public/work/`)에 있어 배포되어야만 서버에 올라갑니다.
 *
 *  → 순서를 지키지 않으면 이미지가 404로 깨집니다.
 *     1. 이미지가 포함된 브랜치를 먼저 배포한다
 *     2. 배포 완료를 확인한다 (아래 --check 로 확인 가능)
 *     3. 그다음 이 스크립트를 --apply 로 실행한다
 * ────────────────────────────────────────────────────────────────────
 *
 * 사용법
 *   node scripts/apply-work-content.cjs            # 계획만 출력 (기본, 안전)
 *   node scripts/apply-work-content.cjs --check    # 배포 서버에 이미지가 있는지 확인
 *   node scripts/apply-work-content.cjs --apply    # 실제 반영 (백업 후 실행)
 *   node scripts/apply-work-content.cjs --rollback # 직전 백업으로 되돌리기
 *
 * 백업은 `scripts/.work-content-backup.json` 에 남습니다(gitignore 대상).
 */

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const BACKUP = path.join(__dirname, ".work-content-backup.json");
const SITE = "https://www.kpopsoft.com";

/** 반영할 실제 사례. id는 기존 행을 덮어쓰기 위한 것. */
const ROWS = [
  {
    id: "208132e7-0a14-47df-a727-d8c277ed82f8",
    client: "신도H렌탈",
    title: "신도H렌탈 렌탈 서비스 랜딩페이지",
    category: "Web",
    accent: "blue",
    summary:
      "사무용 복합기 렌탈 전문 기업 신도H렌탈의 랜딩페이지를 기획부터 개발까지 제작했습니다.",
    challenge:
      "전문 컨설팅, 합리적인 렌탈료, 신속한 설치·AS라는 강점을 방문자에게 명확하게 전달하고, 업종에 맞는 렌탈 상품을 바로 찾을 수 있는 랜딩페이지가 필요했습니다.",
    solution:
      "업종별 추천 솔루션을 구성해 방문자가 자신에게 맞는 렌탈 상품을 바로 확인할 수 있도록 설계하고, 데스크톱과 모바일 모두에서 매끄럽게 동작하는 반응형 랜딩페이지로 구현했습니다.",
    results: [], // 확인된 성과 수치 없음 — 지어내지 않는다.
    image_url: "/work/sindohr-mockup.png",
    image_urls: ["/work/sindohr-mockup.png", "/work/sindohr-desktop.jpg"],
  },
  {
    id: "f5479b2d-5897-4bdb-bbed-802dbba1646e",
    client: "KPOPSOFT",
    title: "카카오톡 오픈채팅 AI 비서 '헤르메스'",
    category: "AI Solutions",
    accent: "red",
    summary:
      "오픈채팅방에서 명령어 한 줄이면 그날의 AI 소식을 정리해 주는 커뮤니티 AI 비서입니다.",
    challenge:
      "AI 소식은 매일 쏟아지지만 출처가 흩어져 있어, 무엇이 중요한지는 각자 따로 찾아봐야 했습니다. 커뮤니티 안에서도 정보가 그때그때 흘러가 버렸습니다.",
    solution:
      "오픈채팅방에 상주하는 AI 비서를 붙였습니다. 명령어를 입력하면 그날의 주요 소식만 골라 요약해 답하고, 더 궁금한 내용은 1:1 대화로 이어서 물어볼 수 있도록 구성했습니다.",
    results: [],
    image_url: "/work/ai-chatbot-hermes.jpg",
    image_urls: ["/work/ai-chatbot-hermes.jpg"],
  },
  {
    id: "a128293d-abfd-4ac0-abc8-feaa01572ecc",
    client: "커머스 기업",
    title: "커머스 운영 관리자 대시보드",
    category: "Web · Internal Tools",
    accent: "yellow",
    summary:
      "매출·주문·회원 지표를 한 화면에서 확인하고 바로 처리까지 이어지는 관리자 시스템입니다.",
    challenge:
      "주문, 회원, 매출 데이터가 각각 다른 화면에 흩어져 있어 상황을 파악하려면 여러 곳을 오가야 했습니다. 모바일에서는 확인 자체가 어려웠습니다.",
    solution:
      "대시보드 한 화면에 핵심 지표와 최근 주문, 인기 상품을 모으고, 주문·상품·회원 관리로 바로 이어지도록 설계했습니다. 데스크톱과 모바일 모두에서 같은 흐름으로 쓸 수 있게 반응형으로 구현했습니다.",
    results: [],
    image_url: "/work/dashboard-01.png",
    image_urls: ["/work/dashboard-01.png", "/work/dashboard-02.png"],
  },
];

/** 더미라 지울 행. 교육 기관 대상 플랫폼 제작 건으로, 실제 사례가 아니다. */
const DELETE_IDS = ["23c19223-3c19-4737-a237-2a0fc375a6ab"];

/** 위 행들이 참조하는 이미지 전부 — 배포 서버 존재 확인용. */
function allImages() {
  const set = new Set();
  for (const r of ROWS) {
    if (r.image_url) set.add(r.image_url);
    for (const u of r.image_urls ?? []) set.add(u);
  }
  return [...set];
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("환경변수가 없습니다: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  return createClient(url, key);
}

/** 배포 서버에 이미지가 실제로 올라가 있는지 확인한다. */
async function checkImages() {
  console.log(`\n배포 서버 이미지 확인 (${SITE})\n`);
  let missing = 0;
  for (const src of allImages()) {
    const res = await fetch(SITE + src, { method: "HEAD" }).catch(() => null);
    const ok = res && res.ok;
    if (!ok) missing++;
    console.log(`  ${ok ? "OK  " : "404 "} ${src}`);
  }
  console.log(
    missing === 0
      ? "\n모든 이미지가 배포되어 있습니다. --apply 해도 안전합니다.\n"
      : `\n⚠️  ${missing}개가 배포에 없습니다. 지금 --apply 하면 이미지가 깨집니다.\n   브랜치를 먼저 배포하세요.\n`,
  );
  return missing === 0;
}

async function plan() {
  const client = db();
  const { data, error } = await client
    .from("work_items")
    .select("id,title,image_url")
    .order("sort_order");
  if (error) throw new Error(error.message);

  console.log("\n현재 DB 상태");
  console.table(data);

  console.log("반영하면 이렇게 바뀝니다");
  console.table([
    ...ROWS.map((r) => ({
      동작: "수정",
      title: r.title,
      image_url: r.image_url,
    })),
    ...DELETE_IDS.map((id) => ({
      동작: "삭제",
      title: data.find((d) => d.id === id)?.title ?? "(없음)",
      image_url: "",
    })),
  ]);

  console.log("실제로 반영하려면 --apply, 이미지 배포 확인은 --check\n");
}

async function apply() {
  const client = db();

  const { data: before, error: readErr } = await client
    .from("work_items")
    .select("*");
  if (readErr) throw new Error(readErr.message);
  fs.writeFileSync(BACKUP, JSON.stringify(before, null, 2));
  console.log(`백업 저장: ${BACKUP} (${before.length}건)`);

  for (const row of ROWS) {
    const { id, ...values } = row;
    const { error } = await client.from("work_items").update(values).eq("id", id);
    if (error) throw new Error(`${row.title}: ${error.message}`);
    console.log(`  수정 ${row.title}`);
  }

  for (const id of DELETE_IDS) {
    const { error } = await client.from("work_items").delete().eq("id", id);
    if (error) throw new Error(`delete ${id}: ${error.message}`);
    console.log(`  삭제 ${id}`);
  }

  const { data: after } = await client
    .from("work_items")
    .select("sort_order,title,image_url")
    .order("sort_order");
  console.log("\n반영 후");
  console.table(after);
  console.log("되돌리려면: node scripts/apply-work-content.cjs --rollback\n");
}

async function rollback() {
  if (!fs.existsSync(BACKUP)) {
    console.error(`백업 파일이 없습니다: ${BACKUP}`);
    process.exit(1);
  }
  const client = db();
  const rows = JSON.parse(fs.readFileSync(BACKUP, "utf8"));

  // 삭제됐던 행까지 되살려야 하므로 upsert로 통째로 복원한다.
  const { error } = await client.from("work_items").upsert(rows);
  if (error) throw new Error(error.message);

  const { data: after } = await client
    .from("work_items")
    .select("sort_order,title,image_url")
    .order("sort_order");
  console.log("\n복원 완료");
  console.table(after);
}

(async () => {
  const arg = process.argv[2] ?? "--plan";
  try {
    if (arg === "--check") await checkImages();
    else if (arg === "--apply") {
      const ok = await checkImages();
      if (!ok) {
        console.error("이미지가 배포되지 않아 중단합니다. 강제로 진행하려면 --apply-force");
        process.exit(1);
      }
      await apply();
    } else if (arg === "--apply-force") await apply();
    else if (arg === "--rollback") await rollback();
    else await plan();
  } catch (e) {
    console.error("실패:", e.message);
    process.exit(1);
  }
})();
