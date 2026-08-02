# 인터랙션 · 접근성 · SEO

> **위치** `docs/99-archive/education-ver2/23-인터랙션-접근성-SEO.md` · **원본** `docs/KPOPSOFT_Education_Page_ver2.md` L1800–1874
> **읽는 순서** ← 이전 [데이터 재사용 원칙과 반응형 요구사항](22-데이터재사용과-반응형.md) · [00-START-HERE](00-START-HERE.md) · 다음 [빈 데이터/오류 상태 · 개발 범위 · 완료 조건](24-개발범위와-완료조건.md) →
>
> **함께 보기** 현행 기준은 [../../03-education/00-START-HERE.md](../../03-education/00-START-HERE.md)

---
과도한 애니메이션은 사용하지 않습니다.

권장 인터랙션:

- 스크롤 진입 시 가벼운 fade-up
- 카드 Hover 시 이미지 1.02~1.04 확대
- 버튼 Hover 및 Active 상태
- 캐릭터의 매우 작은 움직임
- Anchor smooth scroll
- 결과물 이미지 확대 모달
- FAQ Accordion
- 문의 제출 상태 표시

모든 애니메이션은 `prefers-reduced-motion`을 지원합니다.

---

## 31. 접근성

- 올바른 Heading 구조
- Button과 Link 역할 구분
- 모든 이미지 alt 제공
- 키보드만으로 전체 탐색 가능
- 명확한 focus style
- WCAG AA 수준의 텍스트 대비
- 상태를 색상만으로 표현하지 않기
- 폼 오류 메시지를 해당 필드 가까이에 표시
- 모바일 터치 영역 최소 44px 이상
- FAQ에 aria 속성 적용
- 이미지 모달 Escape 닫기 지원
- 모달 focus trap 적용

---

## 32. SEO

### Page Title

```text
KPOPSOFT Education | AI 활용·Vibe Coding·기업 맞춤형 교육
```

### Meta Description

```text
AI 업무 활용, Vibe Coding, AI Prototype Lab과 기업 맞춤형 교육을 제공합니다. 실제 업무와 아이디어를 중심으로 직접 만들고 적용하는 KPOPSOFT의 실무형 교육 프로그램입니다.
```

### 주요 키워드

```text
AI 교육
기업 AI 교육
생성형 AI 교육
Vibe Coding 교육
바이브 코딩 교육
AI 업무 자동화 교육
AI Prototype 교육
기업 맞춤형 교육
실무형 AI 교육
웹 제작 교육
```

추가 요구사항:

- Open Graph metadata
- Canonical URL
- 상세 페이지 확장 시 개별 metadata
- Course 구조화 데이터 검토
- FAQ schema는 실제 화면 데이터와 동일한 경우에만 적용

---

---

← 이전 [데이터 재사용 원칙과 반응형 요구사항](22-데이터재사용과-반응형.md) · [00-START-HERE](00-START-HERE.md) · 다음 [빈 데이터/오류 상태 · 개발 범위 · 완료 조건](24-개발범위와-완료조건.md) →
