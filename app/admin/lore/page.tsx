import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export default async function AdminLorePage() {
  const [entryCount, pendingCount, permCount] = await Promise.all([
    prisma.loreEntry.count(),
    prisma.loreChangeRequest.count({ where: { status: "PENDING" } }),
    prisma.loreEditorPermission.count(),
  ]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">世界观管理台</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card><p className="text-sm text-muted">词条总数</p><p className="text-2xl font-bold text-accent">{entryCount}</p></Card>
        <Card><p className="text-sm text-muted">待审核修改</p><p className="text-2xl font-bold text-accent">{pendingCount}</p></Card>
        <Card><p className="text-sm text-muted">授权条目</p><p className="text-2xl font-bold text-accent">{permCount}</p></Card>
      </div>
      <div className="flex gap-3">
        <Link href="/admin/lore/review" className="rounded-md border border-border px-4 py-2">进入审核</Link>
        <Link href="/world" className="rounded-md border border-border px-4 py-2">查看前台资料库</Link>
      </div>
    </section>
  );
}
