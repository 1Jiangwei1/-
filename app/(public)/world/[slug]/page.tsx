import Link from "next/link";
import { notFound } from "next/navigation";

import WorldSuggestionForm from "@/components/world/world-suggestion-form";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getLoreCategoryLabel } from "@/lib/lore/category-label";
import { getLoreAccess } from "@/lib/lore/permission";
import { prisma } from "@/lib/prisma";

type PageParams = Promise<{
  slug: string;
}>;

async function resolveSlug(params: PageParams) {
  const resolved = await params;
  return resolved.slug;
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
  const currentUser = await getCurrentUser();

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
    },
  });

  if (!entry) {
    notFound();
  }

  const metas = normalizeMetas(entry.metas);
  const access = await getLoreAccess(currentUser?.id ?? null, entry.category, entry.id);

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="surface-panel rounded-[30px] px-5 py-6 sm:px-7 sm:py-6">
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
              <h1 className="text-xl font-semibold tracking-tight text-stone-100 sm:text-[1.75rem]">
                {entry.title}
              </h1>
            </div>
            {entry.summary?.trim() ? (
              <p className="max-w-3xl text-sm leading-7 text-[#c2c9be]">{entry.summary}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[28px] p-6 sm:p-7">
        <p className="text-xs section-kicker">正文内容</p>
        <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#dde2d7]">
          {entry.content?.trim() || "暂时还没有整理出更完整的正文内容。"}
        </div>
      </section>

      {access.canEdit ? (
        <section className="surface-card rounded-[28px] p-6 sm:p-7">
          <div className="space-y-2">
            <p className="text-xs section-kicker">Additional Notes</p>
            <h2 className="text-xl font-semibold text-stone-100">扩展信息</h2>
          </div>
          {metas.length === 0 ? (
            <p className="mt-4 text-sm text-[#a7ada5]">这条词条暂时还没有补充信息。</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {metas.map((meta) => (
                <div
                  key={meta.id || `${meta.key}-${meta.value}`}
                  className="rounded-[22px] border border-[rgba(118,137,129,0.14)] bg-[rgba(27,33,32,0.74)] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8ea79f]">{meta.key}</p>
                  <p className="mt-2 text-sm leading-7 text-[#eef0e8]">{meta.value || "未填写"}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <WorldSuggestionForm
        entryId={entry.id}
        title={entry.title}
        summary={entry.summary ?? ""}
        content={entry.content ?? ""}
        metas={metas.map((meta) => ({ key: meta.key, value: meta.value }))}
        canSuggest={access.canSuggest}
        isLoggedIn={Boolean(currentUser)}
      />
    </div>
  );
}
