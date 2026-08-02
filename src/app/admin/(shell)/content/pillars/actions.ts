"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { HomePillar } from "@/lib/admin/content-types";

type Input = Omit<HomePillar, "id" | "sortOrder">;

const LIST = "/admin/content/pillars";

/**
 * 카드는 세 개로 고정이라 추가·삭제가 없다. 카드 수가 바뀌면 홈 3열 레이아웃과
 * 헤더 앵커도 함께 바뀌어야 해서, 그건 콘텐츠 편집이 아니라 코드 변경이다.
 */
export async function updatePillar(id: string, input: Input) {
  await getContentData().pillars.update(id, input);
  revalidatePath(LIST);
  revalidatePath("/");
  redirect(LIST);
}
