import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  needsPasswordRehash,
  verifyPassword,
} from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/auth/validators";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsed.error.issues[0]?.message ?? "登录信息不正确。",
      },
      { status: 400 }
    );
  }

  const { identifier, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });

  const passwordMatched = user
    ? await verifyPassword(password, user.passwordHash)
    : false;

  if (!user || !passwordMatched) {
    return NextResponse.json(
      { success: false, message: "用户名、邮箱或密码错误。" },
      { status: 401 }
    );
  }

  const nextPasswordHash = (await needsPasswordRehash(user.passwordHash))
    ? await hashPassword(password)
    : user.passwordHash;

  let effectiveUser;

  try {
    effectiveUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: nextPasswordHash,
        lastActiveAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });
  } catch {
    effectiveUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: nextPasswordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });
  }

  await setSessionCookie(effectiveUser.id);

  return NextResponse.json({
    success: true,
    message: "登录成功",
    user: effectiveUser,
  });
}
