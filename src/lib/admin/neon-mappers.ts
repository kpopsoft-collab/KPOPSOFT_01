import type { Accent } from "@/lib/site";

import type {
  Expert,
  Insight,
  Stat,
  Testimonial,
  WorkItem,
} from "./content-types";
import type {
  InquirySubtypeOption,
  InquiryTypeOption,
} from "./inquiry-options";
import type { Inquiry, InquiryStatus } from "./types";

type InquiryDatabaseRow = {
  id: string;
  submissionKey: string;
  type: string;
  subtype: string;
  sender: string;
  contact: string;
  message: string;
  status: string;
  memo: string;
  emailStatus: string;
  emailMessageId: string | null;
  emailSentAt: Date | null;
  emailError: string | null;
  linearStatus: string;
  linearIssueId: string | null;
  linearIssueUrl: string | null;
  linearError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ContentBaseRow = {
  id: string;
  sortOrder: number;
  isPublished: boolean;
};

export function toInquiry(row: InquiryDatabaseRow): Inquiry {
  return {
    id: row.id,
    submissionKey: row.submissionKey,
    type: row.type,
    subtype: row.subtype,
    sender: row.sender,
    contact: row.contact,
    message: row.message,
    status: row.status as InquiryStatus,
    memo: row.memo,
    emailStatus: row.emailStatus as Inquiry["emailStatus"],
    emailMessageId: row.emailMessageId,
    emailSentAt: row.emailSentAt?.toISOString() ?? null,
    emailError: row.emailError,
    linearStatus: row.linearStatus as Inquiry["linearStatus"],
    linearIssueId: row.linearIssueId,
    linearIssueUrl: row.linearIssueUrl,
    linearError: row.linearError,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toWorkItem(
  row: ContentBaseRow & {
    client: string;
    title: string;
    category: string;
    accent: string;
    summary: string;
    challenge: string;
    solution: string;
    results: string[];
    imageUrl: string | null;
  },
): WorkItem {
  return {
    id: row.id,
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
    client: row.client,
    title: row.title,
    category: row.category,
    accent: row.accent as Accent,
    summary: row.summary,
    challenge: row.challenge,
    solution: row.solution,
    results: row.results,
    ...(row.imageUrl ? { imageUrl: row.imageUrl } : {}),
  };
}

export function toInsight(
  row: ContentBaseRow & {
    tag: string;
    title: string;
    date: string;
    accent: string;
    excerpt: string;
    body: string[];
    slug: string;
    imageUrl: string | null;
    inquiryType: string | null;
    inquirySubtype: string | null;
  },
): Insight {
  return {
    id: row.id,
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
    tag: row.tag,
    title: row.title,
    date: row.date,
    accent: row.accent as Accent,
    excerpt: row.excerpt,
    body: row.body,
    slug: row.slug,
    ...(row.imageUrl ? { imageUrl: row.imageUrl } : {}),
    ...(row.inquiryType ? { inquiryType: row.inquiryType } : {}),
    ...(row.inquirySubtype ? { inquirySubtype: row.inquirySubtype } : {}),
  };
}

export function toTestimonial(
  row: ContentBaseRow & {
    quote: string;
    author: string;
    program: string;
    result: string;
  },
): Testimonial {
  return {
    id: row.id,
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
    quote: row.quote,
    author: row.author,
    program: row.program,
    result: row.result,
  };
}

export function toExpert(
  row: ContentBaseRow & {
    name: string;
    role: string;
    quote: string;
    tags: string[];
    accent: string;
    imageUrl: string | null;
  },
): Expert {
  return {
    id: row.id,
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
    name: row.name,
    role: row.role,
    quote: row.quote,
    tags: row.tags,
    accent: row.accent as Accent,
    ...(row.imageUrl ? { imageUrl: row.imageUrl } : {}),
  };
}

export function toStat(
  row: ContentBaseRow & {
    value: number;
    suffix: string;
    label: string;
  },
): Stat {
  return {
    id: row.id,
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
    value: row.value,
    suffix: row.suffix,
    label: row.label,
  };
}

type InquiryTypeRow = {
  id: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

type InquirySubtypeRow = {
  id: string;
  typeId: string;
  label: string;
  placeholder: string;
  sortOrder: number;
  isActive: boolean;
};

export function toInquirySubtypeOption(
  row: InquirySubtypeRow,
): InquirySubtypeOption {
  return {
    id: row.id,
    label: row.label,
    placeholder: row.placeholder,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

export function toInquiryTypeOption(
  row: InquiryTypeRow,
  subtypeRows: InquirySubtypeRow[],
): InquiryTypeOption {
  return {
    id: row.id,
    label: row.label,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    subtypes: subtypeRows
      .filter((subtype) => subtype.typeId === row.id)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map(toInquirySubtypeOption),
  };
}
