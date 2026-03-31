import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getLoreAccess, hasAnyLoreCapability } from "@/lib/lore/permission";
import { prisma } from "@/lib/prisma";

type RawSearchParams =
  | Promise<{ q?: string | string[] }>
  | { q?: string | string[] }
  | undefined;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

async function getQuery(searchParams: RawSearchParams) {
  const resolved =
    searchParams && typeof (searchParams as Promise<unknown>).then === "function"
      ? await searchParams
      : searchParams;

  const rawQ = resolved?.q;
  return Array.isArray(rawQ) ? (rawQ[0] ?? "").trim() : (rawQ ?? "").trim();
}

export default async function AdminLorePage({
  searchParams,
}: {
  searchParams?: RawSearchParams;
}) {
  const user = await getCurrentUser();
  const canOpenLoreAdmin = await hasAnyLoreCapability(user?.id ?? null, "VIEW");
  const canOpenReview = await hasAnyLoreCapability(user?.id ?? null, "REVIEW");
  const canOpenPermissions = await hasAnyLoreCapability(user?.id ?? null, "ADMIN");

  if (!canOpenLoreAdmin) {
    return (
      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h1 className="text-2xl font-semibold text-zinc-100">没有世界观后台权限</h1>
        <p className="text-sm text-zinc-400">
          你当前没有 VIEW 及以上的世界观权限，无法进入词条管理。
        </p>
      </div>
    );
  }

  const q = await getQuery(searchParams);

  const filteredWhere = q
    ? {
        OR: [
          {
            title: {
              contains: q,
              mode: "insensitive" as const,
            },
          },
          {
            category: {
              contains: q,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : undefined;

  const [allEntries, entries] = await Promise.all([
    prisma.loreEntry.findMany({
      select: {
        id: true,
        category: true,
      },
    }),
    prisma.loreEntry.findMany({
      where: filteredWhere,
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  const accessMap = new Map(
    await Promise.all(
      entries.map(async (entry) => {
        const access = await getLoreAccess(user?.id ?? null, entry.category, entry.id);
        return [entry.id, access] as const;
      })
    )
  );

  const totalCount = allEntries.length;
  const filteredCount = entries.length;
  const distinctCategoryCount = new Set(
    allEntries
      .map((entry) => entry.category)
      .filter((category): category is string => Boolean(category))
  ).size;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-3 text-sm">
          {canOpenReview ? (
            <Link href="/admin/lore/review" className="inline-flex items-center text-zinc-400 transition hover:text-zinc-100">
              修改申请审核
            </Link>
          ) : null}
          {canOpenPermissions ? (
            <Link href="/admin/lore/permissions" className="inline-flex items-center text-zinc-400 transition hover:text-zinc-100">
              权限分配
            </Link>
          ) : null}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          词条管理
        </h1>
        <p className="text-sm text-zinc-400">
          统一查看和处理世界观词条，根据你的权限执行查看、建议、编辑或审核。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-sm">
          <p className="text-sm text-zinc-400">词条总数</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-100">
            {totalCount}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-sm">
          <p className="text-sm text-zinc-400">当前结果</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-100">
            {filteredCount}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-sm">
          <p className="text-sm text-zinc-400">分类数量</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-100">
            {distinctCategoryCount}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-zinc-100">词条管理列表</h2>
            <p className="text-sm text-zinc-400">
              支持按标题或分类搜索，并根据权限进入编辑或建议页。
            </p>
          </div>

          <form action="/admin/lore" className="w-full sm:max-w-sm">
            <label className="sr-only" htmlFor="lore-search">
              搜索词条
            </label>
            <input
              id="lore-search"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="搜索标题或分类"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
            />
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          {entries.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-zinc-400">
              未找到匹配词条
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-950/70">
                  <tr className="text-left text-sm text-zinc-400">
                    <th className="px-6 py-4 font-medium">标题</th>
                    <th className="px-6 py-4 font-medium">分类</th>
                    <th className="px-6 py-4 font-medium">更新时间</th>
                    <th className="px-6 py-4 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-sm text-zinc-200">
                  {entries.map((entry) => {
                    const access = accessMap.get(entry.id);
                    const actionLabel = access?.canEdit
                      ? "编辑"
                      : access?.canSuggest
                        ? "提交建议"
                        : "查看";
                    const actionHref =
                      access?.canEdit || access?.canSuggest
                        ? `/admin/lore/entries/${entry.id}`
                        : `/world/${entry.slug}`;

                    return (
                      <tr key={entry.id} className="hover:bg-zinc-800/30">
                        <td className="px-6 py-4 font-medium text-zinc-100">
                          {entry.title}
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {String(entry.category ?? "未分类")}
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {formatDate(entry.updatedAt)}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={actionHref}
                            className="inline-flex items-center rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
                          >
                            {actionLabel}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
