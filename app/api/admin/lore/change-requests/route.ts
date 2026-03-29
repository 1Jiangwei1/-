import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canManageLore } from "@/lib/lore/permission";
import { changeRequestSchema } from "@/lib/lore/validators";

export async function GET() {
  const user = await getCurrentUser();
  const ok = await canManageLore(user?.id ?? null, "REVIEW");
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await prisma.loreChangeRequest.findMany({
    include: { entry: true, requester: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const ok = await canManageLore(user?.id ?? null, "SUGGEST");
  if (!ok || !user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const parsed = changeRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const item = await prisma.loreChangeRequest.create({
    data: { entryId: parsed.data.entryId, requesterId: user.id, patch: parsed.data.patch },
  });
  return NextResponse.json({ item }, { status: 201 });
}
