# 홈 Contact — 문의 유형 DB 마이그레이션

> **위치** `docs/01-ia/04-홈-contact-DB-마이그레이션.md` · **원본** `docs/IA_ver3_요약.md` L323–362
> **읽는 순서** ← 이전 [2차 범위 · Admin 변경 · 확정/미결 사항](03-2차범위-admin-확정사항.md) · [00-START-HERE](00-START-HERE.md)
>
> **함께 보기** 홈 상세는 [../02-home/](../02-home/00-START-HERE.md), 교육 상세는 [../03-education/](../03-education/00-START-HERE.md)

---

## 홈 Contact — DB 마이그레이션 (2026-07-31 부분 완료)

홈 Contact의 문의 유형·세부 유형은 `src/lib/site.ts`가 아니라 **Supabase의
`inquiry_types` / `inquiry_subtypes` 테이블**에서 읽는다
(`getPublicInquiryOptions()`). site.ts의 값은 DB가 비었을 때만 쓰이는
fallback이다. 그래서 화면을 바꾸려면 코드가 아니라 DB를 고쳐야 한다.

### 반영된 것

```text
유형 순서   프로젝트 문의 → AI 솔루션 문의 → 교육 문의   (sort_order 0/1/2)
교육 세부   조직·기업 맞춤 교육 / 정규 클래스 /
            지식 공유 커뮤니티 클럽 / 바이브데이즈       (ver3 3분류)
```

옛 교육 세부 유형 9개(AI 활용 입문 … AI Prototype Lab, 기업 맞춤형 교육, 기타)는
삭제하지 않고 `is_active=false`로 내렸다 — 공개 폼에서만 빠지고 어드민 목록에는
남는다. 기존 문의 레코드의 `type`/`subtype`은 텍스트 복사본이라 그대로 보존된다.

교육 세부 유형 라벨이 `eduCategories`와 일치하게 되면서, 그동안 매칭 실패로
뜨지 않던 `/education` 앵커 링크 조건도 해소됐다.

### 반영하지 않기로 한 것

| 항목 | 결정 |
|---|---|
| 유형 라벨 `프로젝트 문의` → `소프트웨어 문의` | **변경하지 않음.** 사용자가 `프로젝트 문의`를 유지하기로 결정 |
| 프로젝트·AI 솔루션 세부 유형 | **ver2 그대로 유지** (내부 운영 도구 / AI 에이전트 / 콘텐츠 자동화 / 사내 AI Tool / AI Prototype 등 포함) |

그 결과 **DB와 `site.ts` 시드가 서로 다르다.** site.ts는 ver3 기준
(`소프트웨어 문의` + 세부 4/3/3)이고 DB는 위 상태다. 평소에는 DB가 이기므로
화면에 영향이 없지만, DB가 비거나 조회에 실패해 폴백이 뜨면 라벨이 달라진다.
IA대로 정리하려면 DB 라벨을 바꾸거나 site.ts 시드를 DB에 맞춰야 한다.

### 교육 문의는 홈에서 받지 않는다

홈 Contact의 `교육 문의` 칩은 라디오가 아니라 **링크**다 —
`/education#education-inquiry`로 보낸다. 교육은 대상·인원·희망 일정처럼 홈 폼에
없는 항목을 받아야 해서 전용 폼(`sections/education/inquiry-form.tsx`)을 쓴다.
DB의 교육 세부 유형 3개는 그 전용 폼이 저장할 때 쓰므로 지우면 안 된다.

---

← 이전 [2차 범위 · Admin 변경 · 확정/미결 사항](03-2차범위-admin-확정사항.md) · [00-START-HERE](00-START-HERE.md)
