import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminEntryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.loreEntry.findUnique({ where: { id }, include: { metas: true } });
  if (!entry) notFound();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">编辑词条：{entry.title}</h1>
      <form action={`/api/admin/lore/entries/${entry.id}`} method="post" className="space-y-3">
        <input name="title" defaultValue={entry.title} className="w-full" />
        <input name="summary" defaultValue={entry.summary ?? ""} className="w-full" />
        <textarea name="content" defaultValue={entry.content ?? ""} className="min-h-40 w-full" />
        <input name="category" defaultValue={entry.category} className="w-full" />
        <p className="text-xs text-muted">当前版本 API 通过 PATCH 调用；此表单用于展示编辑字段结构。</p>
      </form>
    </section>
  );
}
