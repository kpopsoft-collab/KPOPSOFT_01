# 01. 정보구조(IA) — 시작점

ver3 전면 개편의 **정보구조 요약**이다. 홈과 교육 기획서 두 권을 한 장으로 훑기
위한 문서이므로, 세부가 충돌하면 각 ver3 원본이 이긴다.

원본: `docs/IA_ver3_요약.md` · 출처 이미지: [KPOPSOFT-HOMEPAGE-IA.png](KPOPSOFT-HOMEPAGE-IA.png)

## 읽는 순서

| # | 문서 | 한 줄 |
|---|------|-------|
| 1 | [01-관통원칙과-홈-IA.md](01-관통원칙과-홈-IA.md) | 교육 3분류 체계 + 홈 7섹션 구조와 섹션별 요지 |
| 2 | [02-교육-IA.md](02-교육-IA.md) | 교육 9섹션 구조, 정규 클래스 4과정, 바이브데이즈 모달 카피 |
| 3 | [03-2차범위-admin-확정사항.md](03-2차범위-admin-확정사항.md) | 2차 범위, Admin 변경, **확정된 결정**과 미결 항목 |
| 4 | [04-홈-contact-DB-마이그레이션.md](04-홈-contact-DB-마이그레이션.md) | 문의 유형이 왜 코드가 아니라 DB에 있는지, 무엇이 반영됐는지 |

## 이 폴더가 지배하는 것

**교육 3분류 체계**가 이 프로젝트의 유일한 명명 규칙이다.

```text
01. 조직·기업 맞춤 교육          #program-org
02. 정규 클래스 (하위 4과정)      #program-regular
03. 지식 공유 커뮤니티 클럽/바이브데이즈  #program-club
```

이 이름은 아래 **모든 곳에 동일하게** 나타난다. 한 곳만 바꾸면 링크가 끊긴다.

| 나타나는 곳 | 파일 |
|------------|------|
| 홈 핵심 비즈니스 교육 카드 | `src/components/sections/business-overview.tsx` |
| 홈 포트폴리오 필터 | `src/lib/work-category.ts` |
| 홈 Contact 교육 세부 유형 | **Supabase `inquiry_subtypes`** (코드 아님 — 4번 문서 참조) |
| `/education` 프로그램 정보 | `src/components/sections/education/edu-programs.tsx` |

## IA 원본 이미지와 코드의 차이

[KPOPSOFT-HOMEPAGE-IA.png](KPOPSOFT-HOMEPAGE-IA.png)는 **개정 전** 버전이다.
2026-07-31 개정에서 두 가지가 달라졌고, **코드는 개정안을 따르고 있다.**

1. 통계바가 핵심 비즈니스 **위로** 이동
2. **우리의 프로세스** 섹션 신설 (포트폴리오 ↔ CONTACT 사이)

새 PNG를 받으면 교체해야 한다. 상세는 [01-관통원칙과-홈-IA.md](01-관통원칙과-홈-IA.md) 상단 주석.

## 함께 보기

| 더 자세한 기준 | 위치 |
|---------------|------|
| 홈 확정 카피와 섹션 상세 | [../02-home/00-START-HERE.md](../02-home/00-START-HERE.md) |
| 교육 확정 카피와 섹션 상세 | [../03-education/00-START-HERE.md](../03-education/00-START-HERE.md) |
| Admin 변경의 실제 설계 | [../06-admin/00-START-HERE.md](../06-admin/00-START-HERE.md) |
| 미결 항목의 현재 상태 | [../07-dev/05-남은결정과-작업.md](../07-dev/05-남은결정과-작업.md) |

← [문서 전체 시작점](../00-START-HERE.md)
