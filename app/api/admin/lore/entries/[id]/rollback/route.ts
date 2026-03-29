import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canManageLore } from "@/lib/lore/permission";
import { rollbackSchema } from "@/lib/lore/validators";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  const entry = await prisma.loreEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await canManageLore(user?.id ?? null, "ADMIN", entry.category, entry.id);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = rollbackSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const version = await prisma.loreEntryVersion.findUnique({ where: { id: parsed.data.versionId } });
  if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });

  const snap = version.snapshot as Record<string, unknown>;
  const updated = await prisma.loreEntry.update({
    where: { id: entry.id },
    data: {
      title: String(snap.title ?? entry.title),
      summary: snap.summary ? String(snap.summary) : null,
      content: snap.content ? String(snap.content) : null,
      category: String(snap.category ?? entry.category),
    },
  });
  return NextResponse.json({ entry: updated });
}
