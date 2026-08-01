"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  type EduCategoryId,
  type EduPurpose,
  eduSectionId,
} from "@/lib/education-content";

/**
 * 교육 목적 선택 ↔ 프로그램 섹션을 잇는 상태 (수정 요청서 §5).
 *
 * 요청서는 목적 카드를 눌렀을 때 "단순히 앵커 이동만 하지 말고, 프로그램
 * 섹션에서 연결된 항목이 활성화되거나 강조되도록" 요구한다. 두 섹션이 형제라
 * props로는 이어지지 않고, URL 쿼리로 두면 뒤로가기 기록이 목적 선택마다
 * 쌓여 브라우저 뒤로가기가 "이전 화면"이 아니라 "이전 필터"로 동작한다.
 * 그래서 페이지 안에서만 사는 컨텍스트로 둔다.
 *
 * 스크롤 이동 자체는 여기서 하지 않고 각 컴포넌트가 한다 — 이 컨텍스트는
 * "무엇이 선택됐는가"만 안다. 활성 표시의 최종 주도권은 프로그램 섹션의
 * 스크롤 위치에 있고(§7 "스크롤에 따라 활성 프로그램 변경"), 목적 선택은
 * 그 스크롤을 촉발하는 입구일 뿐이다.
 */
type ExploreState = {
  /** 선택된 목적. 아무것도 안 골랐으면 null. */
  purpose: EduPurpose | null;
  /** 목적이 가리키는 분류 — 프로그램 섹션이 이 블록을 강조한다. */
  category: EduCategoryId | null;
  selectPurpose: (purpose: EduPurpose) => void;
  clearPurpose: () => void;
};

const ExploreContext = createContext<ExploreState | null>(null);

export function EduExploreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [purpose, setPurpose] = useState<EduPurpose | null>(null);

  const selectPurpose = useCallback((next: EduPurpose) => {
    setPurpose(next);

    // 스크롤은 상태 반영 뒤에 일어나야 한다 — 정규 클래스가 트랙 순서로
    // 재정렬되면서 블록 높이가 바뀔 수 있어, 먼저 스크롤하면 엉뚱한 위치에
    // 멈춘다. `requestAnimationFrame`으로 다음 페인트까지 미룬다.
    requestAnimationFrame(() => {
      const anchor =
        next.category === "org"
          ? eduSectionId.programOrg
          : next.category === "club"
            ? eduSectionId.programClub
            : eduSectionId.programRegular;

      document.getElementById(anchor)?.scrollIntoView({
        // 모션 감소를 선호하면 즉시 점프한다. 페이지 전체를 가로지르는
        // 스크롤 애니메이션은 이 설정이 가장 먼저 끄고 싶어 하는 종류다.
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    });
  }, []);

  const clearPurpose = useCallback(() => setPurpose(null), []);

  const value = useMemo(
    () => ({
      purpose,
      category: purpose?.category ?? null,
      selectPurpose,
      clearPurpose,
    }),
    [purpose, selectPurpose, clearPurpose],
  );

  return (
    <ExploreContext.Provider value={value}>{children}</ExploreContext.Provider>
  );
}

/**
 * Provider 밖에서도 안전하게 동작한다 — 프로그램 섹션은 목적 선택 없이도
 * 단독으로 쓸 수 있어야 하고(홈 Contact의 앵커 링크로 바로 들어오는 경로),
 * 그때는 "아무 목적도 선택되지 않은" 기본 상태로 그린다.
 */
export function useEduExplore(): ExploreState {
  return (
    useContext(ExploreContext) ?? {
      purpose: null,
      category: null,
      selectPurpose: () => {},
      clearPurpose: () => {},
    }
  );
}
