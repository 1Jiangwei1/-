import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { registerSchema } from "@/lib/auth/validators";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());

  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsed.error.issues[0]?.message ?? "注册信息不正确。",
      },
      { status: 400 }
    );
  }

  const { email, username, password } = parsed.data;
  const normalizedEmail = email || `${username}@local.user`;

  const exists = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { username }],
    },
  });

  if (exists) {
    return NextResponse.json(
      { success: false, message: "用户名或邮箱已存在。" },
      { status: 409 }
    );
  }

  const now = new Date();
  const passwordHash = await hashPassword(password);
  let user;

  try {
    user = await prisma.$transaction(async (tx) => {
      const userCount = await tx.user.count();

      return tx.user.create({
        data: {
          email: normalizedEmail,
          username,
          passwordHash,
          role: userCount === 0 ? UserRole.OWNER : UserRole.USER,
          lastActiveAt: now,
        },
        select: { id: true, email: true, username: true, role: true },
      });
    });
  } catch {
    user = await prisma.$transaction(async (tx) => {
      const userCount = await tx.user.count();

      return tx.user.create({
        data: {
          email: normalizedEmail,
          username,
          passwordHash,
          role: userCount === 0 ? UserRole.OWNER : UserRole.USER,
        },
        select: { id: true, email: true, username: true, role: true },
      });
    });
  }

  await setSessionCookie(user.id);

  return NextResponse.json(
    { success: true, message: "注册成功", user },
    { status: 201 }
  );
}
