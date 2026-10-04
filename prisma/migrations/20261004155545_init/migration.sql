-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL,
    "subtype" TEXT NOT NULL,
    "sender" TEXT NOT NULL DEFAULT '',
    "contact" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "memo" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_subtypes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "placeholder" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_subtypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "client" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "accent" TEXT NOT NULL DEFAULT 'blue',
    "summary" TEXT NOT NULL DEFAULT '',
    "challenge" TEXT NOT NULL DEFAULT '',
    "solution" TEXT NOT NULL DEFAULT '',
    "results" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "image_url" TEXT,
    "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scope" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "user_flow" TEXT NOT NULL DEFAULT '',
    "external_url" TEXT NOT NULL DEFAULT '',
    "show_on_home" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "layout_type" TEXT NOT NULL DEFAULT 'grid',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "tag" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL DEFAULT '',
    "accent" TEXT NOT NULL DEFAULT 'blue',
    "excerpt" TEXT NOT NULL DEFAULT '',
    "body" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "slug" TEXT NOT NULL,
    "image_url" TEXT,
    "inquiry_type" TEXT,
    "inquiry_subtype" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "quote" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT '',
    "program" TEXT NOT NULL DEFAULT '',
    "result" TEXT NOT NULL DEFAULT '',
    "company" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT '',
    "image_url" TEXT,
    "show_on_education" BOOLEAN NOT NULL DEFAULT false,
    "program_id" UUID,
    "case_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT '',
    "quote" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accent" TEXT NOT NULL DEFAULT 'blue',
    "image_url" TEXT,
    "bio" TEXT NOT NULL DEFAULT '',
    "career" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "value" INTEGER NOT NULL DEFAULT 0,
    "suffix" TEXT NOT NULL DEFAULT '',
    "label" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_pillars" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "image_url" TEXT,
    "image_alt" TEXT NOT NULL DEFAULT '',
    "accent" TEXT NOT NULL DEFAULT 'blue',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "home_pillars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_pillar_examples" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pillar_key" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "client" TEXT NOT NULL DEFAULT '',
    "headline" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "image_url" TEXT,
    "image_alt" TEXT NOT NULL DEFAULT '',
    "accent" TEXT NOT NULL DEFAULT 'blue',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "home_pillar_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_org_training" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "singleton" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "min_participants" TEXT NOT NULL DEFAULT '',
    "image_url" TEXT,
    "image_alt" TEXT NOT NULL DEFAULT '',
    "image_caption" TEXT NOT NULL DEFAULT '',
    "cta_label" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_org_training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_regular_classes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "index_label" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "subtitle" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "duration" TEXT NOT NULL DEFAULT '',
    "level" TEXT NOT NULL DEFAULT '',
    "tracks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accent" TEXT NOT NULL DEFAULT 'blue',
    "image_url" TEXT,
    "image_alt" TEXT NOT NULL DEFAULT '',
    "image_caption" TEXT NOT NULL DEFAULT '',
    "curriculum" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "detail_href" TEXT NOT NULL DEFAULT '',
    "seo_title" TEXT NOT NULL DEFAULT '',
    "seo_description" TEXT NOT NULL DEFAULT '',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "schedule_type" TEXT NOT NULL DEFAULT 'multi',
    "start_date" DATE,
    "end_date" DATE,
    "detail_html" TEXT NOT NULL DEFAULT '',
    "detail_bundle_path" TEXT NOT NULL DEFAULT '',
    "detail_bundle_name" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_regular_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_regular_class_html_sources" (
    "class_id" UUID NOT NULL,
    "raw" TEXT NOT NULL DEFAULT '',
    "file_name" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_regular_class_html_sources_pkey" PRIMARY KEY ("class_id")
);

-- CreateTable
CREATE TABLE "education_club_cohorts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "label" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "recruit_period" TEXT NOT NULL DEFAULT '',
    "run_period" TEXT NOT NULL DEFAULT '',
    "price" TEXT NOT NULL DEFAULT '',
    "list_price" TEXT NOT NULL DEFAULT '',
    "capacity" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "cta_disabled" BOOLEAN NOT NULL DEFAULT false,
    "show_price" BOOLEAN NOT NULL DEFAULT true,
    "show_capacity" BOOLEAN NOT NULL DEFAULT false,
    "show_schedule" BOOLEAN NOT NULL DEFAULT true,
    "show_cta" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_club_cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_club_tiers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT '',
    "points" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accent" TEXT NOT NULL DEFAULT 'blue',
    "character_src" TEXT NOT NULL DEFAULT '',
    "character_width" INTEGER NOT NULL DEFAULT 0,
    "character_height" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_club_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_past_programs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'regular',
    "period" TEXT NOT NULL DEFAULT '',
    "audience" TEXT NOT NULL DEFAULT '',
    "duration" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "outcome" TEXT NOT NULL DEFAULT '',
    "accent" TEXT NOT NULL DEFAULT 'blue',
    "cover_image_url" TEXT,
    "cover_image_alt" TEXT NOT NULL DEFAULT '',
    "cover_image_caption" TEXT NOT NULL DEFAULT '',
    "cover_unoptimized" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_past_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_past_program_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "program_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL DEFAULT '',
    "alt" TEXT NOT NULL DEFAULT '',
    "caption" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_past_program_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "body" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT '',
    "program" TEXT NOT NULL DEFAULT '',
    "date_label" TEXT NOT NULL DEFAULT '',
    "accent" TEXT NOT NULL DEFAULT 'blue',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_faqs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "question" TEXT NOT NULL DEFAULT '',
    "answer" TEXT NOT NULL DEFAULT '',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_stats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "label" TEXT NOT NULL DEFAULT '',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- CreateIndex
CREATE INDEX "inquiries_status_idx" ON "inquiries"("status");

-- CreateIndex
CREATE INDEX "inquiries_created_at_idx" ON "inquiries"("created_at" DESC);

-- CreateIndex
CREATE INDEX "inquiry_subtypes_type_id_idx" ON "inquiry_subtypes"("type_id");

-- CreateIndex
CREATE UNIQUE INDEX "insights_slug_key" ON "insights"("slug");

-- CreateIndex
CREATE INDEX "testimonials_program_idx" ON "testimonials"("program_id");

-- CreateIndex
CREATE INDEX "testimonials_case_idx" ON "testimonials"("case_id");

-- CreateIndex
CREATE UNIQUE INDEX "home_pillars_key_key" ON "home_pillars"("key");

-- CreateIndex
CREATE UNIQUE INDEX "home_pillar_examples_key_key" ON "home_pillar_examples"("key");

-- CreateIndex
CREATE INDEX "home_pillar_examples_pillar_order_idx" ON "home_pillar_examples"("pillar_key", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "education_org_training_singleton_key" ON "education_org_training"("singleton");

-- CreateIndex
CREATE UNIQUE INDEX "education_regular_classes_slug_key" ON "education_regular_classes"("slug");

-- CreateIndex
CREATE INDEX "education_regular_classes_published_order_idx" ON "education_regular_classes"("is_published", "sort_order");

-- CreateIndex
CREATE INDEX "education_club_cohorts_order_idx" ON "education_club_cohorts"("sort_order");

-- CreateIndex
CREATE INDEX "education_club_tiers_published_order_idx" ON "education_club_tiers"("is_published", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "education_past_programs_slug_key" ON "education_past_programs"("slug");

-- CreateIndex
CREATE INDEX "education_past_programs_published_order_idx" ON "education_past_programs"("is_published", "sort_order");

-- CreateIndex
CREATE INDEX "education_past_program_images_program_idx" ON "education_past_program_images"("program_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "education_reviews_key_key" ON "education_reviews"("key");

-- CreateIndex
CREATE INDEX "education_reviews_published_order_idx" ON "education_reviews"("is_published", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "education_faqs_key_key" ON "education_faqs"("key");

-- CreateIndex
CREATE INDEX "education_faqs_published_order_idx" ON "education_faqs"("is_published", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "education_stats_key_key" ON "education_stats"("key");

-- CreateIndex
CREATE INDEX "education_stats_published_order_idx" ON "education_stats"("is_published", "sort_order");

-- AddForeignKey
ALTER TABLE "inquiry_subtypes" ADD CONSTRAINT "inquiry_subtypes_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "inquiry_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "education_regular_classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "education_past_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_regular_class_html_sources" ADD CONSTRAINT "education_regular_class_html_sources_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "education_regular_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_past_program_images" ADD CONSTRAINT "education_past_program_images_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "education_past_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── CHECK 제약 (Prisma 스키마로 표현 불가 — 수동 추가) ────────────────
-- 원본: supabase/migrations/*.sql 의 domain / check. 값 집합을 그대로 옮겼다.
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_status_ck"
  CHECK ("status" IN ('new', 'in_progress', 'done'));

ALTER TABLE "work_items" ADD CONSTRAINT "work_items_accent_ck"
  CHECK ("accent" IN ('blue','red','yellow','coral','mint','sky','navy'));
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_layout_type_ck"
  CHECK ("layout_type" IN ('featured', 'grid', 'horizontal'));
ALTER TABLE "insights" ADD CONSTRAINT "insights_accent_ck"
  CHECK ("accent" IN ('blue','red','yellow','coral','mint','sky','navy'));
ALTER TABLE "experts" ADD CONSTRAINT "experts_accent_ck"
  CHECK ("accent" IN ('blue','red','yellow','coral','mint','sky','navy'));
ALTER TABLE "home_pillars" ADD CONSTRAINT "home_pillars_accent_ck"
  CHECK ("accent" IN ('blue','red','yellow','coral','mint','sky','navy'));
ALTER TABLE "home_pillars" ADD CONSTRAINT "home_pillars_key_ck"
  CHECK ("key" IN ('software', 'ai', 'education'));
ALTER TABLE "home_pillar_examples" ADD CONSTRAINT "home_pillar_examples_accent_ck"
  CHECK ("accent" IN ('blue','red','yellow','coral','mint','sky','navy'));
ALTER TABLE "home_pillar_examples" ADD CONSTRAINT "home_pillar_examples_pillar_key_ck"
  CHECK ("pillar_key" IN ('software', 'ai', 'education'));

ALTER TABLE "education_org_training" ADD CONSTRAINT "education_org_training_singleton_ck"
  CHECK ("singleton");

ALTER TABLE "education_regular_classes" ADD CONSTRAINT "education_regular_classes_accent_ck"
  CHECK ("accent" IN ('blue','red','yellow','coral','mint','sky','navy'));
ALTER TABLE "education_regular_classes" ADD CONSTRAINT "education_regular_classes_tracks_ck"
  CHECK ("tracks" <@ ARRAY['beginner', 'practical']::text[]);
ALTER TABLE "education_regular_classes" ADD CONSTRAINT "education_regular_classes_schedule_type_ck"
  CHECK ("schedule_type" IN ('oneday', 'multi'));
-- 날짜는 없어도 되지만, 있으면 앞뒤가 맞아야 한다. 시작 없는 종료일도 막는다.
ALTER TABLE "education_regular_classes" ADD CONSTRAINT "education_regular_classes_schedule_ck"
  CHECK (
    ("schedule_type" = 'oneday' AND "end_date" IS NULL)
    OR ("schedule_type" = 'multi' AND (
          "end_date" IS NULL
          OR ("start_date" IS NOT NULL AND "end_date" >= "start_date")
    ))
  );
-- 번들 경로는 UUID 한 세그먼트. 삭제 루틴이 이 값을 prefix로 쓰므로 반드시 막는다.
ALTER TABLE "education_regular_classes" ADD CONSTRAINT "education_regular_classes_bundle_path_ck"
  CHECK (
    "detail_bundle_path" = ''
    OR "detail_bundle_path" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/$'
  );

ALTER TABLE "education_regular_class_html_sources" ADD CONSTRAINT "education_regular_class_html_raw_size_ck"
  CHECK (octet_length("raw") <= 5242880);

ALTER TABLE "education_club_cohorts" ADD CONSTRAINT "education_club_cohorts_status_ck"
  CHECK ("status" IN ('upcoming', 'open', 'closed', 'ended'));
ALTER TABLE "education_club_tiers" ADD CONSTRAINT "education_club_tiers_accent_ck"
  CHECK ("accent" IN ('blue','red','yellow','coral','mint','sky','navy'));
ALTER TABLE "education_past_programs" ADD CONSTRAINT "education_past_programs_accent_ck"
  CHECK ("accent" IN ('blue','red','yellow','coral','mint','sky','navy'));
ALTER TABLE "education_past_programs" ADD CONSTRAINT "education_past_programs_category_ck"
  CHECK ("category" IN ('org', 'regular', 'club'));
ALTER TABLE "education_reviews" ADD CONSTRAINT "education_reviews_accent_ck"
  CHECK ("accent" IN ('blue','red','yellow','coral','mint','sky','navy'));
ALTER TABLE "education_reviews" ADD CONSTRAINT "education_reviews_rating_ck"
  CHECK ("rating" BETWEEN 1 AND 5);
