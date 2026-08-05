# 홈에서 제거·이동할 콘텐츠와 Admin 연동 원칙

> **위치** `docs/99-archive/home-ver2/10-제거콘텐츠와-admin연동.md` · **원본** `docs/KPOPSOFT_Home_Landing_ver2.md` L563–639
> **읽는 순서** ← 이전 [SECTION 08 Footer](09-footer.md) · [00-START-HERE](00-START-HERE.md) · 다음 [반응형 요구사항과 디자인 방향](11-반응형과-디자인방향.md) →
>
> **함께 보기** 현행 기준은 [../../02-home/00-START-HERE.md](../../02-home/00-START-HERE.md)

---

## 6. 홈에서 제거하거나 이동할 콘텐츠

다음 콘텐츠는 `/education`으로 이동합니다.

- 교육 프로그램 전체 목록
- 강사진 전체
- 기업 맞춤형 교육 상세
- 교육 프로세스
- 교육 사례
- 교육 후기
- 교육 FAQ
- 교육 상담 상세 폼

다음 콘텐츠는 초기 홈에서 제외합니다.

- 별도 AI Prototype Lab 섹션
- 별도 How We Work 섹션
- 별도 Numbers 섹션
- 별도 고객 후기 섹션
- Insights

후기와 Insights는 실제 콘텐츠가 충분히 쌓인 뒤 추가합니다.

---

## 7. Admin 연동 원칙

홈 전체를 자유 편집하는 방식보다 콘텐츠 단위로 관리합니다.

### Home 설정

- Hero 문구
- Hero 이미지
- CTA 문구 및 링크
- About 문구
- Numbers
- 섹션 공개 여부
- 섹션 노출 순서

### Work 관리

- 프로젝트명
- 산업군
- 카테고리
- 한 줄 설명
- 대표 이미지
- 갤러리
- 핵심 성과
- 제작 범위
- 공개 여부
- 홈 노출 여부
- 대표 프로젝트 여부
- 노출 순서
- 홈 레이아웃 유형

```ts
isPublished
isFeatured
showOnHome
displayOrder
layoutType // featured | grid | horizontal
```

같은 프로젝트를 홈과 Work 상세에 중복 등록하지 않습니다.

### Education Banner 관리

- 제목
- 설명
- 대표 이미지
- 캐릭터 이미지
- CTA 문구
- CTA 링크
- 공개 여부

---

---

← 이전 [SECTION 08 Footer](09-footer.md) · [00-START-HERE](00-START-HERE.md) · 다음 [반응형 요구사항과 디자인 방향](11-반응형과-디자인방향.md) →
