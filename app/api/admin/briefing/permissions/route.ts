import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

async function requireOwner() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  if (user.role !== UserRole.OWNER) {
    return false;
  }

  return user;
}

export async function POST(request: Request) {
  const user = await requireOwner();

  if (user === null) {
    return NextResponse.json(
      { success: false, message: "请先登录。" },
      { status: 401 }
    );
  }

  if (user === false) {
    return NextResponse.json(
      { success: false, message: "只有超级管理员可以分配快报编辑权限。" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as {
      userId?: string;
    };
    const userId = body.userId?.trim() ?? "";

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "请选择要授权的用户。" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "目标用户不存在。" },
        { status: 404 }
      );
    }

    if (targetUser.role === UserRole.OWNER) {
      return NextResponse.json(
        { success: false, message: "超级管理员默认拥有编辑权限，无需重复授权。" },
        { status: 400 }
      );
    }

    await prisma.homeBriefingEditorPermission.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    return NextResponse.json({
      success: true,
      message: "已授予快报编辑权限。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error && error.message
            ? error.message
            : "授权失败，请稍后重试。",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const user = await requireOwner();

  if (user === null) {
    return NextResponse.json(
      { success: false, message: "请先登录。" },
      { status: 401 }
    );
  }

  if (user === false) {
    return NextResponse.json(
      { success: false, message: "只有超级管理员可以撤销快报编辑权限。" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as {
      userId?: string;
    };
    const userId = body.userId?.trim() ?? "";

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "缺少要撤销权限的用户。" },
        { status: 400 }
      );
    }

    await prisma.homeBriefingEditorPermission.deleteMany({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      message: "已撤销快报编辑权限。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error && error.message
            ? error.message
            : "撤销失败，请稍后重试。",
      },
      { status: 500 }
    );
  }
}
