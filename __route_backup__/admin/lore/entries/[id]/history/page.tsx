import Link from "next/link";

import LoreEntryHistory from "@/components/admin/lore-entry-history";

type PageParams =
  | Promise<{
      id: string;
    }>
  | {
      id: string;
    };

async function resolveId(params: PageParams) {
  const resolved =
    params && typeof (params as Promise<unknown>).then === "function"
      ? await params
      : params;

  return resolved.id;
}

export default async function AdminLoreEntryHistoryPage({
  params,
}: {
  params: PageParams;
}) {
  const entryId = await resolveId(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
            词条版本记录
          </h1>
          <p className="text-sm text-zinc-400">
            查看该词条的历史编辑版本，并可回滚到指定版本。
          </p>
        </div>

        <Link
          href={`/admin/lore/entries/${entryId}`}
          className="inline-flex items-center rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
        >
          返回编辑页
        </Link>
      </div>

      <LoreEntryHistory entryId={entryId} />
    </div>
  );
}
