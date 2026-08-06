/**
 * formatClassSchedule() 테스트.
 *
 * `node --test`로 돌린다. 경로 별칭(`@/`)이 안 먹으므로 상대 경로로
 * import한다. 케이스는
 * docs/08-decisions/01-regular-class-schedule-and-html/01-요구사항.md §2.4 표 4종 +
 * 연도 경계 + 윤년 + 시작=종료 + 종료일만 + 잘못된 ISO +
 * oneday인데 endDate 있음.
 *
 * import에 `.ts` 확장자를 그대로 쓴다 — `node --test`가 이 파일을 직접
 * 실행하므로 특정자에 실제 확장자가 있어야 모듈을 찾는다. tsconfig의
 * `allowImportingTsExtensions`가 이를 허용한다(noEmit이라 부작용 없음).
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { formatClassSchedule } from "./education-content.ts";

// ---- §2.4 표 4종 -----------------------------------------------------------

test("oneday — 강의일만 있으면 '(하루 과정)'으로 표기한다", () => {
  const out = formatClassSchedule({
    scheduleType: "oneday",
    startDate: "2026-09-12",
  });
  assert.equal(out, "2026년 9월 12일 (하루 과정)");
});

test("multi — 시작·종료가 같은 해면 종료일에는 연도를 생략한다", () => {
  const out = formatClassSchedule({
    scheduleType: "multi",
    startDate: "2026-09-01",
    endDate: "2026-10-05",
  });
  assert.equal(out, "2026년 9월 1일 – 10월 5일");
});

test("multi — 시작일만 있으면 '시작'으로 표기한다", () => {
  const out = formatClassSchedule({
    scheduleType: "multi",
    startDate: "2026-09-01",
  });
  assert.equal(out, "2026년 9월 1일 시작");
});

test("둘 다 없으면 null이다", () => {
  const out = formatClassSchedule({ scheduleType: "multi" });
  assert.equal(out, null);
});

// ---- 경계 케이스 ------------------------------------------------------------

test("multi — 연도가 다르면 종료일에도 연도를 붙인다", () => {
  const out = formatClassSchedule({
    scheduleType: "multi",
    startDate: "2026-12-20",
    endDate: "2027-01-10",
  });
  assert.equal(out, "2026년 12월 20일 – 2027년 1월 10일");
});

test("윤년의 2월 29일은 유효한 날짜로 표기된다", () => {
  const out = formatClassSchedule({
    scheduleType: "oneday",
    startDate: "2028-02-29",
  });
  assert.equal(out, "2028년 2월 29일 (하루 과정)");
});

test("평년의 2월 29일은 잘못된 날짜라 null이다", () => {
  const out = formatClassSchedule({
    scheduleType: "oneday",
    startDate: "2026-02-29",
  });
  assert.equal(out, null);
});

test("multi — 시작=종료여도 그대로 두 날짜를 표기한다", () => {
  const out = formatClassSchedule({
    scheduleType: "multi",
    startDate: "2026-09-12",
    endDate: "2026-09-12",
  });
  assert.equal(out, "2026년 9월 12일 – 9월 12일");
});

test("multi — 종료일만 있으면 '종료'로 표기한다", () => {
  const out = formatClassSchedule({
    scheduleType: "multi",
    endDate: "2026-10-05",
  });
  assert.equal(out, "2026년 10월 5일 종료");
});

test("잘못된 ISO 문자열(형식 오류)은 null이다", () => {
  assert.equal(
    formatClassSchedule({ scheduleType: "oneday", startDate: "abc" }),
    null,
  );
});

test("잘못된 ISO 문자열(달력에 없는 날짜)은 null이다", () => {
  assert.equal(
    formatClassSchedule({ scheduleType: "multi", startDate: "2026-13-99" }),
    null,
  );
});

test("oneday인데 endDate가 있어도 무시한다(DB CHECK상 있을 수 없지만 방어)", () => {
  const out = formatClassSchedule({
    scheduleType: "oneday",
    startDate: "2026-09-12",
    endDate: "2026-09-20",
  });
  assert.equal(out, "2026년 9월 12일 (하루 과정)");
});
