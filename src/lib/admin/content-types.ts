/**
 * Admin CMS content types (docs/어드민기획.md §4.2).
 *
 * Shapes mirror the real content in src/lib/site.ts so the mock store seeds
 * losslessly and the future Supabase adapter maps 1:1. Every collection shares
 * `id` / `sortOrder` / `isPublished`. Images are plain string URLs: in mock mode
 * that's a data: URL from the upload widget; on wiring day it becomes a Supabase
 * Storage path — the field name and screens don't change.
 */

import type { Accent } from "@/lib/site";

/** Fields every CMS row carries. */
export type ContentBase = {
  id: string;
  /** Ascending display order on the public site. */
  sortOrder: number;
  /** Hidden from the public site when false. */
  isPublished: boolean;
};

export type WorkItem = ContentBase & {
  client: string;
  title: string;
  category: string;
  accent: Accent;
  summary: string;
  challenge: string;
  solution: string;
  results: string[];
  /** Cover image (docs §4.2 — Work + Insights 커버 이미지). */
  imageUrl?: string;
};

export type Insight = ContentBase & {
  tag: string;
  title: string;
  /** Display date string, e.g. "2026.06". */
  date: string;
  accent: Accent;
  excerpt: string;
  /** Article body as paragraphs. */
  body: string[];
  /** Unique blog-detail slug (docs §4.2 — /insights/[slug]). */
  slug: string;
  imageUrl?: string;
  /** Optional pre-selected inquiry mapping when a reader clicks through. */
  inquiryType?: string;
  inquirySubtype?: string;
};

export type Testimonial = ContentBase & {
  quote: string;
  author: string;
  program: string;
  result: string;
};

export type Expert = ContentBase & {
  name: string;
  role: string;
  quote: string;
  tags: string[];
  accent: Accent;
  /** Profile photo (docs §4.2). Falls back to a monogram when empty. */
  imageUrl?: string;
};

export type Stat = ContentBase & {
  value: number;
  suffix: string;
  label: string;
};

/** The seven brand accents, for accent-picker options. */
export const ACCENTS: readonly Accent[] = [
  "blue",
  "red",
  "yellow",
  "coral",
  "mint",
  "sky",
  "navy",
] as const;
