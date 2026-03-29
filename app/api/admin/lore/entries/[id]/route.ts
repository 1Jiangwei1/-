import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canManageLore } from "@/lib/lore/permission";
import { entryPatchSchema } from "@/lib/lore/validators";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  const entry = await prisma.loreEntry.findUnique({ where: { id }, include: { metas: true } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await canManageLore(user?.id ?? null, "EDIT", entry.category, entry.id);
  if (!ok || !user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = entryPatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.loreEntryVersion.create({
    data: {
      entryId: entry.id,
      snapshot: {
        title: entry.title,
        summary: entry.summary,
        content: entry.content,
        category: entry.category,
        metas: entry.metas,
      },
      note: parsed.data.note ?? "before patch",
      createdById: user.id,
    },
  });

  const updated = await prisma.loreEntry.update({
    where: { id: entry.id },
    data: {
      title: parsed.data.title,
      summary: parsed.data.summary,
      content: parsed.data.content,
      category: parsed.data.category,
    },
  });

  if (parsed.data.meta) {
    await prisma.loreMeta.deleteMany({ where: { entryId: entry.id } });
    await prisma.loreMeta.createMany({ data: parsed.data.meta.map((m) => ({ ...m, entryId: entry.id })) });
  }

  return NextResponse.json({ entry: updated });
}
