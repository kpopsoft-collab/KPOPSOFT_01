# ver3 ④ CONTACT · Footer · 반응형 · 완료 조건

> **위치** `docs/02-home/11-ver3-contact-footer-완료조건.md` · **원본** `docs/KPOPSOFT_Home_Landing_ver3.md` L309–443
> **읽는 순서** ← 이전 [ver3 ③ 통계바 · 포트폴리오](10-ver3-통계바와-포트폴리오.md) · [00-START-HERE](00-START-HERE.md)

---
ver2의 폼 구조를 유지하고 **문의 유형과 세부 유형만 IA에 맞춰 재편**합니다.

#### Title

```text
기획서가 없어도,
문제부터 이야기할 수 있습니다.
```

#### Description

```text
아이디어를 소프트웨어와 AI 솔루션으로 옮기는
다음 프로젝트를 시작해 보세요.
```

#### CTA

```text
프로젝트 의뢰하기
```

#### 문의 유형 · 세부 유형

핵심 비즈니스 3축과 동일한 3분류를 씁니다.

**소프트웨어**

```text
웹 프로젝트
앱 프로젝트
어드민
기타
```

> IA 원본은 `웹/앱`을 한 항목으로 적었으나, 견적·기간이 크게 달라 문의
> 라우팅 정보가 사라지므로 **웹과 앱을 분리**한다(확정).

**AI 솔루션**

```text
AI 업무 자동화
AI 챗봇
기타
```

**교육**

```text
조직·기업 맞춤 교육
정규 클래스
지식 공유 커뮤니티 클럽 / 바이브데이즈
```

교육 문의 유형은 유지합니다(IA 검토 결과 확정). 별도 강조 뱃지는 붙이지 않습니다.

> ver2에 있던 교육 세부 유형 9개(AI 활용 입문 / AI 업무 활용 / Vibe Coding / Software Development / Web & App Development / AI Automation / AI Prototype Lab / 기업 맞춤형 교육 / 기타)는 위 3개로 대체합니다.

#### 세부 유형 → 앵커 이동

IA 주석: *"교육페이지 프로그램정보 정규클래스 스크롤앵커로 이동"*

교육 세부 유형에는 각각 `/education`의 해당 위치로 가는 링크를 함께 둡니다.

```text
조직·기업 맞춤 교육          → /education#program-org
정규 클래스                  → /education#program-regular
지식 공유 커뮤니티 클럽      → /education#program-club (모달 오픈)
```

폼 선택지로서의 기능과 별개로, "자세히 보기" 성격의 보조 링크입니다. 선택 자체가 페이지를 이탈시키지 않도록 합니다.

#### 폼 필드

ver2 유지.

```text
문의 유형 / 세부 유형 / 이름 / 회사명 / 이메일 / 연락처 /
회사 웹사이트 / 문의 내용 / 개인정보 수집 및 이용 동의
```

---

## SECTION 07. Footer

ver2 유지.

```text
SOFTWARE · AI SOLUTIONS · EDUCATION

아이디어를
작동하는 기술로.
```

링크: Work / Software / AI Solutions / Education / About / Contact / 프로젝트 의뢰

---

### 4. 홈에서 제외하는 콘텐츠

ver2 §6을 유지하고 다음을 추가합니다.

- **AI Prototype Lab** — 프로그램·문의 세부 유형·서비스 목록 전 영역에서 제거 (완전 폐지)
- 별도 About Summary 섹션 (Hero 하단 리드 문구로 압축)
- 별도 Education Banner 섹션 (핵심 비즈니스 교육 카드로 흡수)

Insights와 고객 후기는 ver2와 동일하게 홈에서 제외합니다. `/insights/[slug]` 라우트는 유지합니다.

---

### 5. 반응형 · 디자인 방향

ver2 §8, §9를 그대로 따릅니다. 추가 요구사항만 명시합니다.

- 핵심 비즈니스 3분할: Desktop 3열 / Tablet 2열+1 / Mobile 1열
- 통계바: Desktop 4열 / Mobile 2×2
- 포트폴리오 필터: Mobile에서 가로 스크롤 칩. 단 페이지 자체의 가로 스크롤은 금지
- 필터 버튼 탭 타겟 최소 44px

---

### 6. 구현 완료 조건

- 홈 섹션이 7개로 구성된다.
- 핵심 비즈니스가 소프트웨어·AI 솔루션·교육 3축으로 동일 비중 노출된다.
- 통계바가 독립 섹션으로 분리되어 있다.
- 포트폴리오에 3분류 필터가 동작하고, 사례가 없는 분류는 필터가 숨겨진다.
- 포트폴리오 카드가 모두 실제 사례 이미지를 쓴다.
- Contact 교육 세부 유형이 3개이며 `/education` 앵커로 연결된다.
- `AI Prototype Lab` 문자열이 홈 어디에도 남아 있지 않다.
- Desktop·Tablet·Mobile에서 정상 동작한다.
- 기존 Admin 데이터와 `/education` 페이지가 깨지지 않는다.

---

← 이전 [ver3 ③ 통계바 · 포트폴리오](10-ver3-통계바와-포트폴리오.md) · [00-START-HERE](00-START-HERE.md)
