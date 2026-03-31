import Link from "next/link";
import { notFound } from "next/navigation";

import LoreEntryEditor from "@/components/admin/lore-entry-editor";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getLoreAccess } from "@/lib/lore/permission";
import { prisma } from "@/lib/prisma";

type PageParams =
  | Promise<{
      id: string;
    }>
  | {
      id: string;
    };

function normalizeId(rawId: string) {
  return /^\d+$/.test(rawId) ? Number(rawId) : rawId;
}

async function resolveId(params: PageParams) {
  const resolved =
    params && typeof (params as Promise<unknown>).then === "function"
      ? await params
      : params;

  return normalizeId(resolved.id);
}

function normalizeMetas(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    const meta = item as Record<string, unknown>;

    return {
      id: String(meta.id ?? `meta-${index}`),
      key: String(meta.key ?? ""),
      value: String(meta.value ?? ""),
    };
  });
}

export default async function AdminLoreEntryPage({
  params,
}: {
  params: PageParams;
}) {
  const id = await resolveId(params);

  const entry = await prisma.loreEntry.findUnique({
    where: { id } as never,
    select: {
      id: true,
      title: true,
      summary: true,
      content: true,
      category: true,
      metas: true,
      updatedAt: true,
    },
  });

  if (!entry) {
    notFound();
  }

  const user = await getCurrentUser();
  const access = await getLoreAccess(user?.id ?? null, entry.category, entry.id);

  if (!access.canEdit && !access.canSuggest) {
    return (
      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h1 className="text-2xl font-semibold text-zinc-100">没有编辑权限</h1>
        <p className="text-sm text-zinc-400">
          你目前只有查看权限，不能直接编辑，也不能提交修改建议。
        </p>
        <Link
          href="/admin/lore"
          className="inline-flex items-center rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
        >
          返回词条管理
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/admin/lore"
              className="inline-flex items-center text-zinc-400 transition hover:text-zinc-100"
            >
              返回词条管理
            </Link>
            {access.canReview ? (
              <Link
                href="/admin/lore/review"
                className="inline-flex items-center text-zinc-400 transition hover:text-zinc-100"
              >
                前往审核列表
              </Link>
            ) : null}
            {access.canAdmin ? (
              <Link
                href="/admin/lore/permissions"
                className="inline-flex items-center text-zinc-400 transition hover:text-zinc-100"
              >
                权限分配
              </Link>
            ) : null}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
            编辑词条
          </h1>
          <p className="text-sm text-zinc-400">
            {access.canEdit
              ? "你当前有直接编辑权限，保存后会立即写入词条。"
              : "你当前只有建议权限，本页提交后会进入审核流程。"}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/admin/lore/entries/${entry.id}/history`}
            className="inline-flex items-center rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
          >
            查看版本记录
          </Link>
        </div>
      </div>

      <LoreEntryEditor
        entry={{
          id: entry.id as string | number,
          title: entry.title,
          summary: entry.summary ?? "",
          content: entry.content ?? "",
          metas: normalizeMetas(entry.metas),
          updatedAt: entry.updatedAt.toISOString(),
        }}
        submitMode={access.canEdit ? "edit" : "request"}
      />
    </div>
  );
}
