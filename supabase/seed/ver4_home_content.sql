-- ────────────────────────────────────────────────────────────────────────
-- ver4 홈 콘텐츠 시드 — KPOPSOFT_homepage_revision_request.md 반영본
--
-- 이 파일은 "이 버전의 홈이 보여줘야 할 콘텐츠"를 그대로 적어 둔 것이다.
-- DB를 새로 만들거나 콘텐츠가 흐트러졌을 때 이 파일 하나만 다시 실행하면
-- 홈이 요청서 상태로 되돌아온다. **몇 번 실행해도 결과가 같다(idempotent).**
--
-- 건드리는 것은 홈 콘텐츠 테이블(work_items, stats)뿐이다. 관리자 계정,
-- 접수된 문의, Education 데이터는 손대지 않는다.
--
-- 실행 전 `supabase/migrations/20260802000000_work_items_scope_features.sql`
-- 이 적용돼 있어야 한다(scope/features/user_flow/external_url 컬럼).
-- ────────────────────────────────────────────────────────────────────────

-- ── 주요 성과 수치 (요청서 §5) ──────────────────────────────────────────
-- 값은 그대로 두고 항목명만 요청서 문구로 맞춘다. 순서로 매칭한다.
update public.stats set label = '프로젝트 완료' where sort_order = 0;
update public.stats set label = '파트너 기업'   where sort_order = 1;
update public.stats set label = '교육 수료생'   where sort_order = 2;
update public.stats set label = '교육 만족도'   where sort_order = 3;

-- ── 주요 프로젝트 (요청서 §9~§12) ───────────────────────────────────────
-- 카테고리·프로젝트명·요약은 요청서가 확정한 문구다. 축약하거나 다른 표현으로
-- 바꾸지 않는다(§18).
--
-- `scope`(담당 범위)는 세 건 모두 비워 둔다 — 요청서 §8이 확인되지 않은 역할의
-- 임의 추가를 금지했고, 아직 확인된 범위를 받지 못했다. 값이 채워지면 카드에
-- 자동으로 한 줄이 생긴다.

-- 01. 신도렌탈 — 채용 사이트나 랜딩페이지가 아니라 렌탈 서비스 웹사이트다(§9).
update public.work_items set
  sort_order   = 0,
  is_published = true,
  client       = '신도렌탈',
  title        = '신도렌탈 복합기 렌탈 서비스',
  category     = 'RENTAL · PRODUCT PLATFORM',
  accent       = 'blue',
  summary      = '업종별 복합기 추천부터 상품 탐색과 상담 신청까지 연결한 렌탈 서비스 웹사이트입니다.',
  challenge    = '복합기 렌탈은 사무실·학교·병원·관공서처럼 사용 환경에 따라 필요한 사양과 비용이 크게 달라집니다. 방문자가 자신의 환경에 맞는 상품을 스스로 찾고, 정보를 확인한 뒤 상담까지 이어갈 수 있는 흐름이 필요했습니다.',
  solution     = '업종별 렌탈 솔루션 추천을 입구로 두고, 추천 상품 목록에서 제품 이미지·주요 사양·월 렌탈료를 확인한 뒤 상세정보와 상담 신청으로 이어지도록 설계했습니다. 상담 진행 절차와 추가 비즈니스 상담까지 한 흐름 안에 배치했습니다.',
  results      = '{}',
  scope        = '{}',
  features     = array[
    '사무실, 학교, 병원, 관공서 등 업종별 렌탈 솔루션 추천',
    '추천 렌탈 상품 목록',
    '제품 이미지, 주요 사양, 월 렌탈료 제공',
    '상품 상세정보 확인',
    '복합기 렌탈 상담 신청',
    '상담 진행 절차 안내',
    '추가 비즈니스 상담 연계'
  ],
  user_flow    = '사용자 환경 선택 → 적합한 상품 탐색 → 정보 확인 → 렌탈 상담 신청',
  external_url = 'https://www.sindohr.com/',
  image_url    = '/work/sindohr-mockup.png',
  image_urls   = array['/work/sindohr-mockup.png', '/work/sindohr-desktop.jpg']
where id = '208132e7-0a14-47df-a727-d8c277ed82f8';

-- 02. BLUE EGG — 새 사례. `관리자용 어드민 대시보드`라는 표현은 쓰지 않는다.
--     운영자가 아니라 고객이 직접 쓰는 셀프 마케팅 플랫폼이기 때문이다(§10).
--     대표 이미지가 아직 없어 image_url을 비워 둔다 — 카드는 도형 폴백으로
--     렌더된다. 잘못된 화면을 붙이는 것보다 낫다.
insert into public.work_items (
  sort_order, is_published, client, title, category, accent,
  summary, challenge, solution, results, scope, features, user_flow
)
select
  1, true, 'BLUE EGG', '셀프 마케팅 캠페인 운영 플랫폼', 'MARKETING · WEB PLATFORM', 'red',
  '캠페인 운영부터 채널별 검색 순위 추적과 성과 확인까지 한 화면에서 관리할 수 있도록 구축한 웹 플랫폼입니다.',
  '마케팅 캠페인을 직접 운영하는 고객은 집행 현황과 채널별 성과를 각각 다른 곳에서 확인해야 했습니다. 무엇이 얼마나 효과가 있었는지 판단할 근거가 한자리에 모이지 않았습니다.',
  '고객이 직접 캠페인을 등록·운영하고, 네이버 플레이스·쇼핑 등 채널별 검색 순위와 키워드별 순위 변화를 한 화면에서 추적하도록 구성했습니다. 포인트와 캠페인 현황, 성과 사례, 고객 지원까지 하나의 셀프 운영 플랫폼으로 묶었습니다.',
  '{}', '{}',
  array[
    '사용자별 포인트 및 캠페인 현황 확인',
    '마케팅 캠페인 등록 및 운영',
    '진행 중·완료된 캠페인 관리',
    '네이버 플레이스·쇼핑 등 채널별 검색 순위 추적',
    '키워드별 순위 변화 시각화',
    '캠페인 성과 및 고객 사례 제공',
    '공지사항 및 고객 지원',
    '광고대행 및 제휴 문의 연결'
  ],
  '캠페인 등록 → 진행 현황 확인 → 채널별 순위 추적 → 마케팅 성과 관리'
where not exists (
  select 1 from public.work_items where title = '셀프 마케팅 캠페인 운영 플랫폼'
);

-- 재실행 대비 — 이미 있으면 위 insert가 건너뛰므로 내용은 여기서 맞춘다.
update public.work_items set
  sort_order   = 1,
  is_published = true,
  client       = 'BLUE EGG',
  category     = 'MARKETING · WEB PLATFORM',
  accent       = 'red'
where title = '셀프 마케팅 캠페인 운영 플랫폼';

-- 03. 카카오톡 AI 정보 응답 챗봇 — 단순 상담 챗봇이 아니라 정보 탐색·요약
--     자동화 챗봇이다. 스크린샷에 찍힌 뉴스 제목·날짜는 예시 데이터라
--     어떤 카피에도 넣지 않는다(§11).
update public.work_items set
  sort_order   = 2,
  is_published = true,
  client       = 'KPOPSOFT',
  title        = '카카오톡 기반 AI 정보 응답 챗봇',
  category     = 'AI · CHATBOT AUTOMATION',
  accent       = 'mint',
  summary      = '사용자의 요청을 이해하고 필요한 정보를 수집·요약해 대화형 인터페이스로 제공하는 AI 챗봇입니다.',
  challenge    = '필요한 정보를 찾으려면 매번 여러 출처를 직접 돌아다니며 확인해야 했습니다. 반복적인 정보 탐색에 시간이 들고, 정작 핵심만 추려 보기는 어려웠습니다.',
  solution     = '자연어 명령을 인식해 요청 주제에 맞는 정보를 검색하고, 핵심 내용만 요약해 카카오톡 채널에서 바로 응답하도록 구성했습니다. 별도 서비스에 접속하지 않고 쓰던 메신저에서 결과를 확인합니다.',
  results      = '{}',
  scope        = '{}',
  features     = array[
    '자연어 명령 및 질문 인식',
    '요청 주제에 맞는 정보 검색',
    '주요 뉴스와 정보 자동 수집',
    '핵심 내용 요약 및 정리',
    '카카오톡 채널 기반 대화형 응답',
    '반복적인 정보 탐색 업무 자동화',
    '별도 서비스 접속 없이 메신저에서 결과 확인'
  ],
  user_flow    = '사용자 질문 입력 → AI 정보 탐색 → 핵심 내용 요약 → 카카오톡 결과 제공',
  image_url    = '/work/ai-chatbot-hermes.jpg',
  image_urls   = array['/work/ai-chatbot-hermes.jpg']
where id = 'f5479b2d-5897-4bdb-bbed-802dbba1646e';

-- 요청서가 명시한 3건만 노출한다. 나머지(커머스 운영 관리자 대시보드 등)는
-- 지우지 않고 비공개로 내린다 — 어드민에서 언제든 다시 켤 수 있다.
update public.work_items
   set is_published = false
 where title not in (
   '신도렌탈 복합기 렌탈 서비스',
   '셀프 마케팅 캠페인 운영 플랫폼',
   '카카오톡 기반 AI 정보 응답 챗봇'
 );

-- ── 문의 분야 (요청서 §15) ──────────────────────────────────────────────
-- 요청서가 지정한 네 가지: 소프트웨어 개발 / AI 솔루션 / 교육 문의 / 기타 문의.
-- 라벨만 바꾼다 — 세부 유형(inquiry_subtypes)은 유형 id에 매달려 있어 그대로
-- 따라온다. 접수된 문의는 라벨 스냅샷을 갖고 있어 과거 기록도 안 깨진다.
update public.inquiry_types set label = '소프트웨어 개발' where label = '프로젝트 문의';
update public.inquiry_types set label = 'AI 솔루션'      where label = 'AI 솔루션 문의';

-- 기타 문의 — 위 셋 중 어디에도 맞지 않는 문의(제휴·채용·취재 등)를 받는다.
-- 세부 유형은 두지 않는다. 폼은 세부 유형이 없는 분야면 그 필드를 숨긴다.
insert into public.inquiry_types (label, sort_order, is_active)
select '기타 문의', 3, true
where not exists (select 1 from public.inquiry_types where label = '기타 문의');
