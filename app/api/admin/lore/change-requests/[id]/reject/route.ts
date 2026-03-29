import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canManageLore } from "@/lib/lore/permission";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const ok = await canManageLore(user?.id ?? null, "REVIEW");
  if (!ok || !user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { reviewNote?: string };
  const updated = await prisma.loreChangeRequest.update({
    where: { id },
    data: { status: "REJECTED", reviewerId: user.id, reviewedAt: new Date(), reviewNote: body.reviewNote },
  });
  return NextResponse.json({ item: updated });
}
