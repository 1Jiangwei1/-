import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canManageLore } from "@/lib/lore/permission";
import { rollbackSchema } from "@/lib/lore/validators";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  const entry = await prisma.loreEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "词条不存在。" }, { status: 404 });

  const ok = await canManageLore(user?.id ?? null, "ADMIN", entry.category, entry.id);
  if (!ok) return NextResponse.json({ error: "没有权限执行回滚。" }, { status: 403 });

  const parsed = rollbackSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "提交数据格式不正确。" }, { status: 400 });
  }
  const version = await prisma.loreEntryVersion.findUnique({ where: { id: parsed.data.versionId } });
  if (!version) return NextResponse.json({ error: "版本不存在。" }, { status: 404 });

  const snap = version.snapshot as Record<string, unknown>;
  const snapshotMetas = Array.isArray(snap.metas)
    ? snap.metas
        .map((item) => {
          const meta = item as Record<string, unknown>;
          return {
            key: String(meta.key ?? "").trim(),
            value: String(meta.value ?? ""),
          };
        })
        .filter((meta) => meta.key.length > 0)
    : [];

  const updated = await prisma.$transaction(async (tx) => {
    const restoredEntry = await tx.loreEntry.update({
      where: { id: entry.id },
      data: {
        title: String(snap.title ?? entry.title),
        summary: snap.summary ? String(snap.summary) : null,
        content: snap.content ? String(snap.content) : null,
        category: String(snap.category ?? entry.category),
      },
    });

    await tx.loreMeta.deleteMany({
      where: { entryId: entry.id },
    });

    if (snapshotMetas.length > 0) {
      await tx.loreMeta.createMany({
        data: snapshotMetas.map((meta) => ({
          entryId: entry.id,
          key: meta.key,
          value: meta.value,
        })),
      });
    }

    return restoredEntry;
  });

  return NextResponse.json({ success: true, message: "回滚成功", entry: updated });
}
