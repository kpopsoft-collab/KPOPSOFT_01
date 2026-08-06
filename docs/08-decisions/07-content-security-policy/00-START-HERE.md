# 07. CSP 도입 (release gate G6)

> **상태: 완료 (2026-08-05) — Report-Only로 적용됨. 강제 전환은 남았다.**
> **지금 무엇이 어떻게 동작하는가의 기준은
> [docs/07-dev/14-CSP-정책과-적용.md](../../07-dev/14-CSP-정책과-적용.md)로 승격돼 있다.**
> 이 폴더는 이제 "왜 그렇게 정했나"의 조사·결정 기록이다.
> **선행** 결정기록 06이 인라인 HTML 렌더링을 폐지하면서 이 작업이 가능해졌다 —
> [06-course-detail-page-redesign](../06-course-detail-page-redesign/00-START-HERE.md)

`docs/03-education/13`의 release gate 6개 중 **마지막으로 남은 G6**을 닫는다.
사이트에 `Content-Security-Policy`를 건다.

## 읽는 순서

1. [01-조사결과.md](01-조사결과.md) — 코드에서 확인한 사실 (모든 판단의 근거)
2. [02-정책초안.md](02-정책초안.md) — **이 작업의 기준 문서.** 정책 전문과 단계별 적용
3. [03-구현결과.md](03-구현결과.md) — **실제로 만들어진 것과 계획과 다른 점**

## 지금 상태

| | |
|---|---|
| 사이트 전역 CSP | **없다** (`next.config.ts`·`proxy.ts` 어디에도) |
| CSP가 있는 유일한 곳 | `/course-assets/[...path]/route.ts`의 `sandbox` — 업로드 자료 격리용, 전역과 별개 |

## 결론 — **조건부로 걸 수 있다**

| 지시문 | 지금 엄격하게 걸 수 있나 |
|---|---|
| `script-src` | ✅ **가능.** 인라인 script는 Next의 RSC 페이로드뿐이고 nonce로 덮인다 |
| `style-src` | ❌ **`'unsafe-inline'`을 남겨야 한다** |
| 나머지 | ✅ 가능. 외부 출처는 Supabase와 jsDelivr 둘뿐 |

## ⚠️ 앞선 판단 정정

결정기록 06과 `docs/07-dev/13`은 *"인라인 렌더링이 사라져 인라인 `<style>`을
허용할 이유도 같이 사라졌다"* 고 적었다. **절반만 맞다.**

`course-html.tsx`(업로드 HTML) 때문에 필요하던 이유는 실제로 사라졌다. 그런데
**그것과 무관하게 코드베이스에 인라인 스타일이 원래부터 있었다.**

| 출처 | 개수 |
|---|---|
| `style={{...}}` JSX prop | **11곳 / 7파일** |
| `next/image`의 `fill` prop이 만드는 `style="position:absolute;…"` | 프레임워크가 직접 주입 |

**CSP nonce는 `<style>` 요소에만 붙고 `style="…"` 속성에는 적용되지 않는다.**
그래서 `style-src 'unsafe-inline'`은 이번에 못 뺀다.

> 이건 실패가 아니다. CSP의 XSS 방어력은 대부분 `script-src`에서 나온다.
> `script-src`를 nonce로 완전히 닫는 것만으로 G6의 실질 목표는 달성된다.
> 자세한 판단은 [02](02-정책초안.md) §4.

## 반드시 지킬 것 하나

**`/course-assets/:path*`를 전역 CSP에서 제외한다.**

그 라우트는 업로드된 강의 자료를 opaque origin에 격리해 내보내고, 자료 안의
스크립트는 당연히 우리 nonce를 갖고 있지 않다. 전역 `script-src`가 같이 걸리면
**자료가 통째로 안 뜬다.** 결정기록 06이 방금 고친 것이 다시 깨진다.

## 닿는 파일

| 파일 | 무엇 |
|---|---|
| `src/proxy.ts` | **matcher를 넓히고 nonce 생성 추가** (지금은 `/admin/:path*`만) |
| `src/app/layout.tsx` | nonce를 읽어야 할 경우 (검증 필요) |
| `src/app/api/csp-report/route.ts` | 신설 — 위반 보고 수집 (Report-Only 단계) |

`next.config.ts`의 `headers()`는 **쓰지 않는다** — nonce는 요청마다 달라야 하는데
그 설정은 정적이다([01](01-조사결과.md) §4).

---

다음 [01-조사결과.md](01-조사결과.md) →
