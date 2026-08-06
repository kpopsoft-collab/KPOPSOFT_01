import { sanitizeCourseHtml } from "@/lib/admin/sanitize-html";

/**
 * 어드민이 올린 과정 상세 HTML을 렌더한다 (결정기록 02 release gate G2~G4).
 *
 * `html`은 DB `detail_html` 컬럼 값이다. 정상 경로(어드민 폼 → actions.ts)를
 * 거쳤다면 이미 `sanitizeCourseHtml()`을 한 번 통과해 `.course-html-shell` >
 * `.course-html` 두 겹으로 감싸여 있다. **하지만 그 값을 믿지 않는다** —
 * 관리자는 RLS상 `education_regular_classes` 테이블을 직접 고칠 수 있어서,
 * 서버 액션을 우회해 정제되지 않은 값이 그대로 들어와 있을 수 있다(G2).
 * 그래서 렌더 직전인 여기서 한 번 더 `sanitizeCourseHtml()`을 부른다.
 *
 * 이미 정제된 값을 다시 넣어도 안전하고 결과가 깨지지 않는다 —
 * `sanitizeCourseHtml()`은 입력이 무엇이든 결과를 다시 두 겹 셸로 감싸고,
 * 안에 남아 있던 `<style>`도 다시 모아 `.course-html ` 접두를 한 번 더 붙인다.
 * 이 두 번째 접두는 실제로도 유효하다 — 렌더되는 DOM에 `.course-html` div가
 * 실제로 두 겹(바깥 겹 + 이번에 새로 감싼 겹) 존재하게 되므로 선택자와 구조가
 * 여전히 맞아떨어진다. 값이 없거나(빈 문자열) 정제 후 아무것도 안 남으면
 * `sanitizeCourseHtml()`이 빈 문자열을 돌려주고, 이때는 아무것도 렌더하지
 * 않는다.
 */
export function CourseHtml({ html }: { html: string }) {
  const safeHtml = sanitizeCourseHtml(html);
  if (!safeHtml) return null;

  return (
    // G3: 바로 위 sanitizeCourseHtml()을 통과한 값만 여기 들어온다 — 다른
    // 경로로 만든 문자열을 이 컴포넌트에 절대 넘기지 않는다.
    // G4: sanitizeCourseHtml()이 돌려준 `.course-html-shell` > `.course-html`
    // 껍데기를 벗기거나 다른 요소로 바꾸지 않고 그대로 심는다 — 실제 보안
    // 경계는 globals.css의 `.course-html-shell { contain: paint; }`다.
    <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
  );
}
