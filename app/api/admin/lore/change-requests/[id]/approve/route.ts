import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canManageLore } from "@/lib/lore/permission";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const ok = await canManageLore(user?.id ?? null, "REVIEW");
  if (!ok || !user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const reqItem = await prisma.loreChangeRequest.findUnique({ where: { id } });
  if (!reqItem) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.loreEntry.update({
    where: { id: reqItem.entryId },
    data: reqItem.patch as Record<string, unknown>,
  });
  const updated = await prisma.loreChangeRequest.update({
    where: { id },
    data: { status: "APPROVED", reviewerId: user.id, reviewedAt: new Date() },
  });
  return NextResponse.json({ item: updated });
}
