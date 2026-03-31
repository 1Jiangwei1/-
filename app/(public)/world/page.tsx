import Link from "next/link";

import FavoriteToggleButton from "@/components/user/favorite-toggle-button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getLoreCategoryLabel } from "@/lib/lore/category-label";
import { prisma } from "@/lib/prisma";

type RawSearchParams = Promise<{
  q?: string | string[];
  category?: string | string[];
}>;

function pickFirst(value?: string | string[]) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

async function resolveSearchParams(searchParams?: RawSearchParams) {
  const resolved = await searchParams;

  return {
    q: pickFirst(resolved?.q).trim(),
    category: pickFirst(resolved?.category).trim(),
  };
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

function cleanDisplayText(text: string) {
  return text
    .replace(/^\s*(详情|概述|说明|摘要|特性|效果|用途|归属|道统|意象|所属势力|驻地|核心人物|立场|分类)\s*[：:]\s*/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstSentence(text: string) {
  const normalized = cleanDisplayText(text);
  if (!normalized) {
    return "";
  }

  const match = normalized.match(/^(.{1,32}?[。！？.!?；;])/);
  if (match?.[1]) {
    return match[1].trim();
  }

  return truncateText(normalized, 30);
}

function metaSummary(
  metas: Array<{
    key: string;
    value: string;
  }>,
) {
  const preferredKeys = [
    "所属势力",
    "修为",
    "道统",
    "特性",
    "神通",
    "法宝",
    "异象",
    "效果",
    "来源",
  ];

  for (const key of preferredKeys) {
    const matched = metas.find((meta) => meta.key === key && meta.value.trim());
    if (matched) {
      return `${matched.key}：${truncateText(matched.value.trim(), 18)}`;
    }
  }

  const fallback = metas.find((meta) => meta.key !== "分类" && meta.value.trim());
  if (fallback) {
    return `${fallback.key}：${truncateText(fallback.value.trim(), 18)}`;
  }

  return "";
}

function categoryMetaSummary(
  category: string | null,
  metas: Array<{
    key: string;
    value: string;
  }>,
) {
  const phraseMap: Record<string, (value: string) => string> = {
    所属势力: (value) => `所属势力 ${value}`,
    境界: (value) => `${value}`,
    修为: (value) => `修为 ${value}`,
    定位: (value) => value,
    道统: (value) => `道统 ${value}`,
    意象: (value) => `意象 ${value}`,
    特性: (value) => value,
    效果: (value) => value,
    神通: (value) => value,
    驻地: (value) => `驻地 ${value}`,
    核心人物: (value) => `核心人物 ${value}`,
    立场: (value) => value,
    首领: (value) => `首领 ${value}`,
    地域: (value) => `地域 ${value}`,
    用途: (value) => value,
    归属: (value) => `归属 ${value}`,
    法宝: (value) => value,
  };

  const strategyMap: Record<string, string[]> = {
    person: ["所属势力", "境界", "修为", "定位"],
    jinshi: ["道统", "意象", "特性"],
    shentong: ["特性", "效果", "神通"],
    org: ["驻地", "核心人物", "立场", "首领", "地域"],
    fabao: ["用途", "归属", "特性", "法宝"],
    gongfa: ["道统", "特性", "效果"],
  };

  const keys = strategyMap[category ?? ""] ?? [];
  for (const key of keys) {
    const matched = metas.find((meta) => meta.key === key && meta.value.trim());
    if (matched) {
      const normalizedValue = truncateText(cleanDisplayText(matched.value), 22);
      return phraseMap[key]?.(normalizedValue) ?? normalizedValue;
    }
  }

  return metaSummary(metas);
}

function fallbackSummary(category?: string | null) {
  switch (category) {
    case "person":
      return "人物设定待补全";
    case "shentong":
      return "神通说明待补全";
    case "jinshi":
      return "金性信息待补全";
    case "org":
      return "势力资料待补全";
    case "fabao":
      return "法宝说明待补全";
    case "gongfa":
      return "功法资料待补全";
    case "lingwu":
      return "灵物信息待补全";
    case "lingzhen":
      return "灵阵说明待补全";
    case "lingfen":
      return "灵氛信息待补全";
    default:
      return "词条信息待补全";
  }
}

function resolveCardSummary(entry: {
  title: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  metas: Array<{
    key: string;
    value: string;
  }>;
}) {
  const summary = entry.summary?.trim();
  if (summary) {
    return truncateText(cleanDisplayText(summary), 30);
  }

  const content = entry.content?.trim();
  if (content) {
    const lines = content
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.startsWith("词条："));

    const preferredLine =
      lines.find((line) => line.startsWith("概述：")) ??
      lines.find((line) => line.startsWith("说明：")) ??
      lines[0] ??
      content;

    const sentence = firstSentence(preferredLine.replace(/^[^：:]+[:：]/, ""));
    if (sentence) {
      return sentence;
    }
  }

  const metaText = categoryMetaSummary(entry.category, entry.metas);
  if (metaText) {
    return metaText;
  }

  return fallbackSummary(entry.category);
}

function getMetaValue(
  metas: Array<{
    key: string;
    value: string;
  }>,
  keys: string[],
) {
  for (const key of keys) {
    const matched = metas.find((meta) => meta.key === key && meta.value.trim());
    if (matched) {
      return matched.value.trim();
    }
  }

  return "";
}

function categoryPriority(category?: string | null) {
  switch (category) {
    case "jinshi":
      return 0;
    case "person":
      return 1;
    case "org":
      return 2;
    case "fabao":
      return 3;
    case "gongfa":
      return 4;
    case "shentong":
      return 5;
    default:
      return 9;
  }
}

function isChildEntry(entry: {
  category: string | null;
  metas: Array<{
    key: string;
    value: string;
  }>;
}) {
  if (entry.category === "shentong") {
    const parentName = getMetaValue(entry.metas, ["上级词条"]);
    if (parentName) {
      return true;
    }
  }

  return false;
}

function matchLevel(
  entry: {
    title: string;
    summary: string | null;
    content: string | null;
    metas: Array<{
      key: string;
      value: string;
    }>;
  },
  keyword: string,
) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const normalizedTitle = entry.title.trim().toLowerCase();

  if (normalizedTitle === normalizedKeyword) {
    return 0;
  }

  if (normalizedTitle.startsWith(normalizedKeyword)) {
    return 1;
  }

  if (normalizedTitle.includes(normalizedKeyword)) {
    return 2;
  }

  const aliasOrParent = entry.metas.some(
    (meta) =>
      ["别名", "上级词条"].includes(meta.key) &&
      meta.value.toLowerCase().includes(normalizedKeyword),
  );
  if (aliasOrParent) {
    return 3;
  }

  const summaryOrContent = [entry.summary ?? "", entry.content ?? ""].some((field) =>
    field.toLowerCase().includes(normalizedKeyword),
  );
  if (summaryOrContent) {
    return 4;
  }

  return 5;
}

export default async function WorldPage({ searchParams }: { searchParams?: RawSearchParams }) {
  const { q, category } = await resolveSearchParams(searchParams);
  const currentUser = await getCurrentUser();

  const where = {
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { summary: { contains: q, mode: "insensitive" as const } },
            { content: { contains: q, mode: "insensitive" as const } },
            {
              metas: {
                some: {
                  OR: [
                    {
                      key: {
                        in: ["别名", "上级词条"],
                      },
                      value: {
                        contains: q,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const [allEntries, entries, favorites] = await Promise.all([
    prisma.loreEntry.findMany({ select: { category: true }, orderBy: { category: "asc" } }),
    prisma.loreEntry.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        content: true,
        category: true,
        metas: {
          select: {
            key: true,
            value: true,
          },
        },
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    currentUser ? prisma.favorite.findMany({ where: { userId: currentUser.id, loreEntryId: { not: null } }, select: { loreEntryId: true } }) : Promise.resolve([]),
  ]);

  const categories = Array.from(new Set(allEntries.map((entry) => entry.category).filter(Boolean)));
  const favoriteIds = new Set(favorites.map((entry) => entry.loreEntryId).filter(Boolean));
  const sortedEntries = q
    ? [...entries].sort((left, right) => {
        const matchDelta = matchLevel(left, q) - matchLevel(right, q);
        if (matchDelta !== 0) {
          return matchDelta;
        }

        const childDelta = Number(isChildEntry(left)) - Number(isChildEntry(right));
        if (childDelta !== 0) {
          return childDelta;
        }

        const categoryDelta = categoryPriority(left.category) - categoryPriority(right.category);
        if (categoryDelta !== 0) {
          return categoryDelta;
        }

        return right.updatedAt.getTime() - left.updatedAt.getTime();
      })
    : entries;

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="surface-panel rounded-[24px] px-5 py-5 sm:px-6 sm:py-5.5">
        <div className="space-y-2.5">
          <p className="text-xs section-kicker">Lore Archive</p>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-100 sm:text-3xl">世界观资料库</h1>
            <p className="max-w-2xl text-sm leading-6 text-[#c0c7bc]">按关键词和分类快速查找词条，首屏先看到结果，再进入详情页继续阅读。</p>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[22px] p-4 sm:p-4.5">
        <form className="grid gap-4 md:grid-cols-[minmax(0,1fr),220px,auto]">
          <div className="space-y-2">
            <label htmlFor="world-search" className="text-sm font-medium text-[#e1dfd3]">关键词搜索</label>
            <input id="world-search" name="q" type="search" defaultValue={q} placeholder="搜索标题、摘要或正文" className="w-full" />
          </div>
          <div className="space-y-2">
            <label htmlFor="world-category" className="text-sm font-medium text-[#e1dfd3]">分类筛选</label>
            <select id="world-category" name="category" defaultValue={category} className="w-full">
              <option value="">全部分类</option>
              {categories.map((item) => <option key={item} value={item}>{getLoreCategoryLabel(item)}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-3">
            <button type="submit" className="inline-flex items-center rounded-full bg-[rgba(177,145,87,0.92)] px-4 py-2.5 text-sm font-medium text-[#171208] transition hover:bg-[#dbc189]">开始筛选</button>
            <Link href="/world" className="inline-flex items-center rounded-full border border-[rgba(126,165,154,0.22)] bg-[rgba(126,165,154,0.08)] px-4 py-2.5 text-sm font-medium text-[#d3dbd7] transition hover:border-[rgba(177,145,87,0.22)] hover:text-white">清空</Link>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-stone-100">词条列表</h2>
          <p className="text-sm text-[#a6afa5]">共找到 {entries.length} 条结果</p>
        </div>

        {entries.length === 0 ? (
          <div className="surface-card rounded-[22px] px-6 py-14 text-center text-sm text-[#adb4aa]">没有找到符合当前搜索或筛选条件的词条，请尝试更换关键词或分类。</div>
        ) : (
          <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {sortedEntries.map((entry) => {
              const summary = resolveCardSummary(entry);

              return (
                <div key={entry.id} className="surface-card flex h-full flex-col rounded-[22px] p-4 transition hover:border-[rgba(177,145,87,0.16)] hover:bg-[rgba(26,32,31,0.98)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <div className="inline-flex rounded-full border border-[rgba(177,145,87,0.18)] bg-[rgba(177,145,87,0.07)] px-2.5 py-1 text-[11px] text-[#dbc189]">{getLoreCategoryLabel(entry.category)}</div>
                      <h3 className="line-clamp-1 text-[17px] font-semibold text-stone-100">{entry.title}</h3>
                    </div>
                    <FavoriteToggleButton type="lore" targetId={entry.id} initialFavorited={favoriteIds.has(entry.id)} compact />
                  </div>

                  <Link href={`/world/${entry.slug}`} className="group mt-3 flex flex-1 flex-col">
                    <div className="flex h-full flex-col">
                      <p className="line-clamp-1 min-h-[1.5rem] text-sm leading-6 text-[#bcc3b9]">
                        {summary}
                      </p>
                      <p className="mt-auto pt-4 text-sm font-medium text-[#aeb7aa] transition group-hover:text-[#d7c490]">查看详情</p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
