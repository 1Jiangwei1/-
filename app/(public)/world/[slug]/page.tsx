import Link from "next/link";
import { notFound } from "next/navigation";

import { getLoreCategoryLabel } from "@/lib/lore/category-label";
import { prisma } from "@/lib/prisma";

type PageParams = Promise<{
  slug: string;
}>;

async function resolveSlug(params: PageParams) {
  const resolved = await params;
  return resolved.slug;
}

function relationLabel(type: string) {
  switch (type) {
    case "CHILD":
      return "下级关联";
    case "RELATED":
      return "相关词条";
    case "REFERENCES":
      return "引用词条";
    default:
      return "其他关联";
  }
}

function normalizeMetas(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const meta = item as Record<string, unknown>;
      return {
        id: String(meta.id ?? ""),
        key: String(meta.key ?? ""),
        value: String(meta.value ?? ""),
      };
    })
    .filter((item) => item.key.trim());
}

export default async function WorldDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const slug = await resolveSlug(params);

  const entry = await prisma.loreEntry.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      content: true,
      category: true,
      metas: true,
      relationsFrom: {
        select: {
          id: true,
          type: true,
          toEntry: {
            select: {
              slug: true,
              title: true,
              category: true,
            },
          },
        },
      },
      relationsTo: {
        select: {
          id: true,
          type: true,
          fromEntry: {
            select: {
              slug: true,
              title: true,
              category: true,
            },
          },
        },
      },
    },
  });

  if (!entry) {
    notFound();
  }

  const metas = normalizeMetas(entry.metas);
  const relatedEntries = [
    ...entry.relationsFrom.map((relation) => ({
      id: relation.id,
      type: relation.type,
      target: relation.toEntry,
    })),
    ...entry.relationsTo.map((relation) => ({
      id: relation.id,
      type: relation.type,
      target: relation.fromEntry,
    })),
  ].filter((relation) => relation.target?.slug);

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="surface-panel rounded-[30px] px-5 py-7 sm:px-7 sm:py-8">
        <div className="space-y-4">
          <Link
            href="/world"
            className="inline-flex items-center rounded-full border border-[rgba(126,165,154,0.22)] bg-[rgba(126,165,154,0.08)] px-4 py-2 text-sm text-[#d7ddd9] transition hover:border-[rgba(177,145,87,0.22)] hover:text-white"
          >
            返回资料库
          </Link>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full accent-chip px-3 py-1 text-xs">
                {getLoreCategoryLabel(entry.category)}
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-stone-100 sm:text-4xl">
                {entry.title}
              </h1>
            </div>
            <p className="max-w-3xl text-sm leading-7 text-[#c2c9be]">
              {entry.summary?.trim() || "这条词条的正文与扩展信息正在持续整理，可继续往下查看。"}
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[28px] p-6 sm:p-7">
        <div className="space-y-3">
          <p className="text-xs section-kicker">正文内容</p>
          <h2 className="text-xl font-semibold text-stone-100">词条正文</h2>
        </div>
        <div className="mt-5 whitespace-pre-wrap text-sm leading-8 text-[#dde2d7]">
          {entry.content?.trim() || "暂时还没有整理出更完整的正文内容。"}
        </div>
      </section>

      <section className="surface-card rounded-[28px] p-6 sm:p-7">
        <div className="space-y-3">
          <p className="text-xs section-kicker">Additional Notes</p>
          <h2 className="text-xl font-semibold text-stone-100">扩展信息</h2>
        </div>
        {metas.length === 0 ? (
          <p className="mt-5 text-sm text-[#a7ada5]">这条词条暂时还没有补充信息。</p>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {metas.map((meta) => (
              <div
                key={meta.id || `${meta.key}-${meta.value}`}
                className="rounded-[22px] border border-[rgba(118,137,129,0.14)] bg-[rgba(27,33,32,0.74)] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-[#8ea79f]">
                  {meta.key}
                </p>
                <p className="mt-2 text-sm leading-7 text-[#eef0e8]">
                  {meta.value || "未填写"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="surface-card rounded-[28px] p-6 sm:p-7">
        <div className="space-y-3">
          <p className="text-xs section-kicker">Connections</p>
          <h2 className="text-xl font-semibold text-stone-100">关联词条</h2>
        </div>
        {relatedEntries.length === 0 ? (
          <p className="mt-5 text-sm text-[#a7ada5]">暂时没有可跳转的关联词条。</p>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {relatedEntries.map((relation) => (
              <Link
                key={`${relation.id}-${relation.target.slug}`}
                href={`/world/${relation.target.slug}`}
                className="rounded-[22px] border border-[rgba(118,137,129,0.14)] bg-[rgba(27,33,32,0.74)] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.08)] transition hover:border-[rgba(177,145,87,0.22)]"
              >
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8ea79f]">
                    {relationLabel(relation.type)}
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-stone-100">
                      {relation.target.title}
                    </p>
                    <span className="inline-flex rounded-full soft-chip px-2.5 py-1 text-xs">
                      {getLoreCategoryLabel(relation.target.category)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
