import Link from "next/link";

import LoreEntryHistory from "@/components/admin/lore-entry-history";

export default async function AdminLoreEntryHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: entryId } = await params;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
            璇嶆潯鐗堟湰璁板綍
          </h1>
          <p className="text-sm text-zinc-400">
            鏌ョ湅璇ヨ瘝鏉＄殑鍘嗗彶缂栬緫鐗堟湰锛屽苟鍙洖婊氬埌鎸囧畾鐗堟湰銆?          </p>
        </div>

        <Link
          href={`/admin/lore/entries/${entryId}`}
          className="inline-flex items-center rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
        >
          杩斿洖缂栬緫椤?        </Link>
      </div>

      <LoreEntryHistory entryId={entryId} />
    </div>
  );
}
