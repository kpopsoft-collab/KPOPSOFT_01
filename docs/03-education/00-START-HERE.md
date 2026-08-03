# 03. 교육(`/education`) — 시작점

교육 페이지의 기준 문서다. 구현은 `src/app/education/`과
`src/components/sections/education/`에 있다.

## ⚠️ 충돌하면 앞 번호가 이긴다

```text
01 ~ 05   교육 페이지 최종 수정 요청서   ← 최신
06 ~ 12   ver3 기획서                    ← 그 앞 단계
```

## 읽는 순서

| # | 문서 | 한 줄 |
|---|------|-------|
| 1 | [01-최종수정요청-목표와-IA.md](01-최종수정요청-목표와-IA.md) | **최신 기준.** 작업 목표, 유지할 요소, 최종 섹션 순서 |
| 2 | [02-최종수정요청-내비와-히어로.md](02-최종수정요청-내비와-히어로.md) | 고정 내비, 히어로 카피, 교육 목적 선택 3카드 |
| 3 | [03-최종수정요청-성과와-프로그램.md](03-최종수정요청-성과와-프로그램.md) | 교육 성과 수치, 프로그램 3분류, 바이브데이즈 모달 |
| 4 | [04-최종수정요청-사례-강사진-후기-FAQ.md](04-최종수정요청-사례-강사진-후기-FAQ.md) | 교육 사례·결과물, 강사진, 후기, FAQ |
| 5 | [05-최종수정요청-문의-푸터-모션-반응형.md](05-최종수정요청-문의-푸터-모션-반응형.md) | 교육 문의 폼(기업 추가 항목), Footer, 모션, 반응형, 접근성 |
| 6 | [06-ver3-변경요약과-구조.md](06-ver3-변경요약과-구조.md) | ver2→ver3 변경 요약, 제거 섹션, 3분류 매핑 |
| 7 | [07-ver3-소개-통계바-강사진.md](07-ver3-소개-통계바-강사진.md) | 교육프로그램 소개, 통계바, 강사진 |
| 8 | [08-ver3-프로그램-정보.md](08-ver3-프로그램-정보.md) | **정규 클래스 4과정 확정 내용** |
| 9 | [09-ver3-바이브데이즈-모달.md](09-ver3-바이브데이즈-모달.md) | 모달 확정 카피, 참여 3단계, 기수·모집 상태 구조 |
| 10 | [10-ver3-지난프로그램-후기-FAQ.md](10-ver3-지난프로그램-후기-FAQ.md) | 지난 프로그램, 별점 후기, FAQ 4문항 |
| 11 | [11-ver3-contact-footer.md](11-ver3-contact-footer.md) | CONTACT, Footer |
| 12 | [12-ver3-상세페이지-ver2유지-admin.md](12-ver3-상세페이지-ver2유지-admin.md) | 2차 범위 상세 페이지, **유지되는 ver2 규정**, Admin |

코드 주석의 `docs/03-education/ §N`은 **두 문서에 같은 번호가 있어 모호하다.**
`§`가 `SECTION NN` 형태면 ver3(06~12번), 그냥 숫자면 최종 수정 요청서(01~05번)로 읽는다.
자주 나오는 것: `§2`(최종 요청 최종 IA) → 01번, `§05.3`(ver3 바이브데이즈 클럽) →
[08-ver3-프로그램-정보.md](08-ver3-프로그램-정보.md) 끝부분,
`§08`(FAQ) → 최종 요청은 04번, ver3는 10번.

## 교육 3분류 — 이 페이지의 축

| 분류 | 앵커 | 성격 |
|------|------|------|
| 조직·기업 맞춤 교육 | `#program-org` | 팀 단위 5명 이상 |
| 정규 클래스 | `#program-regular` | 하위 4과정 (`ai-tools` / `vibe-coding` / `web-app` / `automation`) |
| 지식 공유 커뮤니티 클럽 / 바이브데이즈 | `#program-club` | 섹션이 아니라 **모달 진입 카드** |

홈 Contact의 교육 세부 유형이 이 앵커로 연결된다.
`AI Prototype Lab`은 폐지됐다 — 어디에도 남기지 않는다.

## 섹션 → 문서 → 코드

렌더 순서와 파일은 `src/app/education/page.tsx`가 기준이다.
`sections/education/` 아래에는 ver3에서 **제거했지만 파일만 남긴 것**
(`visit-purpose` · `edu-outputs` · `how-we-learn` · `org-training` · `edu-process` ·
`cta-split` · `edu-cases` · `vibedays-club`)이 섞여 있으므로, import되지 않는 파일을
고치지 않도록 주의한다.

| 교육 섹션 | 기준 문서 | 구현 (`sections/education/`) |
|-----------|----------|------------------------------|
| 히어로 / 소개 | [02](02-최종수정요청-내비와-히어로.md), [07](07-ver3-소개-통계바-강사진.md) | `edu-hero.tsx` |
| 서브 내비 | [02](02-최종수정요청-내비와-히어로.md) | `edu-subnav.tsx` |
| 교육 목적 선택 | [02](02-최종수정요청-내비와-히어로.md) | `purpose-select.tsx` |
| 통계바 | [03](03-최종수정요청-성과와-프로그램.md), [07](07-ver3-소개-통계바-강사진.md) | `edu-stats.tsx` |
| 프로그램 | [03](03-최종수정요청-성과와-프로그램.md), **[08](08-ver3-프로그램-정보.md)** | `edu-programs.tsx` |
| 바이브데이즈 모달 | [09](09-ver3-바이브데이즈-모달.md) | `vibedays-modal.tsx` |
| 지난 프로그램 | [04](04-최종수정요청-사례-강사진-후기-FAQ.md), [10](10-ver3-지난프로그램-후기-FAQ.md) | `past-programs.tsx` |
| 강사진 | [04](04-최종수정요청-사례-강사진-후기-FAQ.md), [07](07-ver3-소개-통계바-강사진.md) | `instructors.tsx` |
| 후기 | [04](04-최종수정요청-사례-강사진-후기-FAQ.md), [10](10-ver3-지난프로그램-후기-FAQ.md) | `reviews.tsx` |
| FAQ | [04](04-최종수정요청-사례-강사진-후기-FAQ.md), [10](10-ver3-지난프로그램-후기-FAQ.md) | `faq.tsx` |
| 교육 문의 | [05](05-최종수정요청-문의-푸터-모션-반응형.md), [11](11-ver3-contact-footer.md) | `inquiry-form.tsx` |

`src/app/education/cases/`와 `src/app/education/programs/`는 **본문이 비어 있는
플레이스홀더 라우트**다(헤더·푸터만, `robots` 차단). 전체보기 CTA가 404가 되지
않게 열어 둔 것이고, 내용은 아직 없다.

> **강사진은 홈과 같은 데이터**를 쓴다(`getPublicExperts()`). 중복 등록 금지.
> 다만 **컴포넌트는 별도**다 — 홈은 `sections/experts.tsx`, 교육은 `instructors.tsx`.
> **교육 문의는 전용 폼**이다 — 홈 Contact의 교육 칩은 라디오가 아니라
> `/education#education-inquiry`로 보내는 **링크**다. 이유는
> [../01-ia/04-홈-contact-DB-마이그레이션.md](../01-ia/04-홈-contact-DB-마이그레이션.md).

## 콘텐츠 위치

교육 콘텐츠는 아직 DB 스키마가 부분적이라 `src/lib/education-content.ts`
정적 데이터를 함께 쓴다. 정규 클래스는 `education_regular_classes` 테이블이 있다
(어드민 등록 가능).

정규 클래스 폼·공개 상세 페이지는 미착수 백로그다 —
[../../backlogs/00-START-HERE.md](../../backlogs/00-START-HERE.md).

## 함께 보기

- 교육 IA 요약 — [../01-ia/02-교육-IA.md](../01-ia/02-교육-IA.md)
- **ver3가 "ver2 유지"로 지정한 항목** (이미지 원칙·반응형·접근성) —
  [12-ver3-상세페이지-ver2유지-admin.md](12-ver3-상세페이지-ver2유지-admin.md)가 가리키는
  [../99-archive/education-ver2/00-START-HERE.md](../99-archive/education-ver2/00-START-HERE.md)
- 교육 이미지 생성 프롬프트 — [../05-assets/03-프롬프트로그-AI솔루션과-교육.md](../05-assets/03-프롬프트로그-AI솔루션과-교육.md)
- 컨펌 대기 중인 콘텐츠 — [../07-dev/05-남은결정과-작업.md](../07-dev/05-남은결정과-작업.md)

← [문서 전체 시작점](../00-START-HERE.md)
