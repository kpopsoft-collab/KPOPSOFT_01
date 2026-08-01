-- 수정 요청서 §8~§12 — 프로젝트 카드/상세가 쓰는 필드 추가.
--
-- 전부 nullable 추가 컬럼이라 기존 로우와 기존 코드에 영향이 없다.
-- (public-content.ts는 값이 없으면 해당 필드를 그냥 빼고 매핑한다.)
--
--  scope        담당 범위. **실제 수행 내용이 확인된 경우에만** 채운다 —
--               요청서가 확인되지 않은 역할의 임의 추가를 금지했다.
--  features     주요 기능. 상세 패널에서만 보여준다.
--  user_flow    핵심 사용자 흐름 한 줄.
--  external_url 공개된 실제 서비스 주소. 있으면 상세에 외부 링크가 붙는다.

alter table public.work_items
  add column if not exists scope        text[] not null default '{}',
  add column if not exists features     text[] not null default '{}',
  add column if not exists user_flow    text   not null default '',
  add column if not exists external_url text   not null default '';
