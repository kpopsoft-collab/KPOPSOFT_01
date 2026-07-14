import "server-only";

import { asc, eq, max } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  experts,
  insights,
  stats,
  testimonials,
  workItems,
} from "@/lib/db/schema";

import type { ContentData, ContentRepo } from "./content-data";
import type {
  Expert,
  Insight,
  Stat,
  Testimonial,
  WorkItem,
} from "./content-types";
import {
  toExpert,
  toInsight,
  toStat,
  toTestimonial,
  toWorkItem,
} from "./neon-mappers";

class NeonWorkRepo implements ContentRepo<WorkItem> {
  async list(): Promise<WorkItem[]> {
    const rows = await getDb()
      .select()
      .from(workItems)
      .orderBy(asc(workItems.sortOrder));
    return rows.map(toWorkItem);
  }

  async get(id: string): Promise<WorkItem | null> {
    const [row] = await getDb()
      .select()
      .from(workItems)
      .where(eq(workItems.id, id))
      .limit(1);
    return row ? toWorkItem(row) : null;
  }

  async create(input: Omit<WorkItem, "id" | "sortOrder">): Promise<WorkItem> {
    const [top] = await getDb()
      .select({ value: max(workItems.sortOrder) })
      .from(workItems);
    const [row] = await getDb()
      .insert(workItems)
      .values({ ...input, sortOrder: (top.value ?? -1) + 1 })
      .returning();
    return toWorkItem(row);
  }

  async update(
    id: string,
    patch: Partial<Omit<WorkItem, "id">>,
  ): Promise<WorkItem> {
    const [row] = await getDb()
      .update(workItems)
      .set(patch)
      .where(eq(workItems.id, id))
      .returning();
    if (!row) throw new Error(`work item not found: ${id}`);
    return toWorkItem(row);
  }

  async remove(id: string): Promise<void> {
    await getDb().delete(workItems).where(eq(workItems.id, id));
  }
}

class NeonInsightRepo implements ContentRepo<Insight> {
  async list(): Promise<Insight[]> {
    const rows = await getDb()
      .select()
      .from(insights)
      .orderBy(asc(insights.sortOrder));
    return rows.map(toInsight);
  }

  async get(id: string): Promise<Insight | null> {
    const [row] = await getDb()
      .select()
      .from(insights)
      .where(eq(insights.id, id))
      .limit(1);
    return row ? toInsight(row) : null;
  }

  async create(input: Omit<Insight, "id" | "sortOrder">): Promise<Insight> {
    const [top] = await getDb()
      .select({ value: max(insights.sortOrder) })
      .from(insights);
    const [row] = await getDb()
      .insert(insights)
      .values({ ...input, sortOrder: (top.value ?? -1) + 1 })
      .returning();
    return toInsight(row);
  }

  async update(
    id: string,
    patch: Partial<Omit<Insight, "id">>,
  ): Promise<Insight> {
    const [row] = await getDb()
      .update(insights)
      .set(patch)
      .where(eq(insights.id, id))
      .returning();
    if (!row) throw new Error(`insight not found: ${id}`);
    return toInsight(row);
  }

  async remove(id: string): Promise<void> {
    await getDb().delete(insights).where(eq(insights.id, id));
  }
}

class NeonTestimonialRepo implements ContentRepo<Testimonial> {
  async list(): Promise<Testimonial[]> {
    const rows = await getDb()
      .select()
      .from(testimonials)
      .orderBy(asc(testimonials.sortOrder));
    return rows.map(toTestimonial);
  }

  async get(id: string): Promise<Testimonial | null> {
    const [row] = await getDb()
      .select()
      .from(testimonials)
      .where(eq(testimonials.id, id))
      .limit(1);
    return row ? toTestimonial(row) : null;
  }

  async create(
    input: Omit<Testimonial, "id" | "sortOrder">,
  ): Promise<Testimonial> {
    const [top] = await getDb()
      .select({ value: max(testimonials.sortOrder) })
      .from(testimonials);
    const [row] = await getDb()
      .insert(testimonials)
      .values({ ...input, sortOrder: (top.value ?? -1) + 1 })
      .returning();
    return toTestimonial(row);
  }

  async update(
    id: string,
    patch: Partial<Omit<Testimonial, "id">>,
  ): Promise<Testimonial> {
    const [row] = await getDb()
      .update(testimonials)
      .set(patch)
      .where(eq(testimonials.id, id))
      .returning();
    if (!row) throw new Error(`testimonial not found: ${id}`);
    return toTestimonial(row);
  }

  async remove(id: string): Promise<void> {
    await getDb().delete(testimonials).where(eq(testimonials.id, id));
  }
}

class NeonExpertRepo implements ContentRepo<Expert> {
  async list(): Promise<Expert[]> {
    const rows = await getDb()
      .select()
      .from(experts)
      .orderBy(asc(experts.sortOrder));
    return rows.map(toExpert);
  }

  async get(id: string): Promise<Expert | null> {
    const [row] = await getDb()
      .select()
      .from(experts)
      .where(eq(experts.id, id))
      .limit(1);
    return row ? toExpert(row) : null;
  }

  async create(input: Omit<Expert, "id" | "sortOrder">): Promise<Expert> {
    const [top] = await getDb()
      .select({ value: max(experts.sortOrder) })
      .from(experts);
    const [row] = await getDb()
      .insert(experts)
      .values({ ...input, sortOrder: (top.value ?? -1) + 1 })
      .returning();
    return toExpert(row);
  }

  async update(
    id: string,
    patch: Partial<Omit<Expert, "id">>,
  ): Promise<Expert> {
    const [row] = await getDb()
      .update(experts)
      .set(patch)
      .where(eq(experts.id, id))
      .returning();
    if (!row) throw new Error(`expert not found: ${id}`);
    return toExpert(row);
  }

  async remove(id: string): Promise<void> {
    await getDb().delete(experts).where(eq(experts.id, id));
  }
}

class NeonStatRepo implements ContentRepo<Stat> {
  async list(): Promise<Stat[]> {
    const rows = await getDb()
      .select()
      .from(stats)
      .orderBy(asc(stats.sortOrder));
    return rows.map(toStat);
  }

  async get(id: string): Promise<Stat | null> {
    const [row] = await getDb()
      .select()
      .from(stats)
      .where(eq(stats.id, id))
      .limit(1);
    return row ? toStat(row) : null;
  }

  async create(input: Omit<Stat, "id" | "sortOrder">): Promise<Stat> {
    const [top] = await getDb()
      .select({ value: max(stats.sortOrder) })
      .from(stats);
    const [row] = await getDb()
      .insert(stats)
      .values({ ...input, sortOrder: (top.value ?? -1) + 1 })
      .returning();
    return toStat(row);
  }

  async update(
    id: string,
    patch: Partial<Omit<Stat, "id">>,
  ): Promise<Stat> {
    const [row] = await getDb()
      .update(stats)
      .set(patch)
      .where(eq(stats.id, id))
      .returning();
    if (!row) throw new Error(`stat not found: ${id}`);
    return toStat(row);
  }

  async remove(id: string): Promise<void> {
    await getDb().delete(stats).where(eq(stats.id, id));
  }
}

export const neonContentData: ContentData = {
  work: new NeonWorkRepo(),
  insights: new NeonInsightRepo(),
  testimonials: new NeonTestimonialRepo(),
  experts: new NeonExpertRepo(),
  stats: new NeonStatRepo(),
};
