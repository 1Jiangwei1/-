import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { permissionSchema } from "@/lib/lore/validators";

async function assertAdmin() {
  const user = await getCurrentUser();
  return user && ["OWNER", "ADMIN"].includes(user.role);
}

export async function GET() {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await prisma.loreEditorPermission.findMany({ include: { user: { select: { username: true, role: true } } } });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const parsed = permissionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const item = await prisma.loreEditorPermission.create({ data: parsed.data });
  return NextResponse.json({ item }, { status: 201 });
}
