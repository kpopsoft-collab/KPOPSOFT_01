import { getContentData } from "@/lib/admin/content-data";
import { EditLink } from "@/components/admin/content/row-actions";

export default async function PillarsListPage() {
  const items = await getContentData().pillars.list();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">핵심 비즈니스</h1>
        <p className="mt-2 text-sm text-ink/55">
          홈 카드 세 장의 문구·태그·이미지를 수정합니다. 카드 수와 클릭 동작은
          화면 구조라 여기서 바꾸지 않습니다.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-sm text-ink/50">
          등록된 카드가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-0.5 truncate text-sm text-ink/55">{item.description}</p>
                <p className="mt-1 truncate text-xs text-ink/40">{item.tags.join(" · ")}</p>
              </div>
              <EditLink href={`/admin/content/pillars/${item.id}`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
