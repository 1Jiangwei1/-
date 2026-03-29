import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/auth/validators";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { email, username, password } = parsed.data;
  const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (exists) return NextResponse.json({ error: "Email or username exists" }, { status: 409 });
  const user = await prisma.user.create({
    data: { email, username, passwordHash: await hashPassword(password) },
    select: { id: true, email: true, username: true, role: true },
  });
  return NextResponse.json({ user }, { status: 201 });
}
