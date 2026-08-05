import { CtaButton } from "@/components/ui/cta-button";
import { educationSectionId, route } from "@/lib/site";

/**
 * 공개된 정규 클래스가 0개일 때(요구사항 §2.3).
 *
 * 트랙 필터는 거를 대상 자체가 없으므로 함께 렌더하지 않는다 — 눌러도 항상
 * 빈 화면인 필터는 없느니만 못하다(`WorkGrid`의 필터 노출 원칙과 같은 이유).
 * 헤더·푸터는 페이지가 그대로 유지하고, 이 블록은 카드 영역 자리만 대신한다.
 */
export function ProgramEmptyState() {
  return (
    <div className="mt-14 flex flex-col items-start gap-4 rounded-2xl border border-ink/10 bg-white px-6 py-10 lg:mt-20">
      <p className="text-body-lg text-ink/70">
        정규 클래스 과정을 준비 중입니다. 곧 다시 찾아와 주세요.
      </p>
      <CtaButton
        href={`${route.education}#${educationSectionId.inquiry}`}
        variant="secondary"
      >
        교육 문의하기
      </CtaButton>
    </div>
  );
}
