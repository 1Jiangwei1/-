import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { canEditHomeBriefing } from "@/lib/home-briefing/permission";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  const canEdit = await canEditHomeBriefing(user?.id ?? null);

  if (!user) {
    return NextResponse.json(
      { success: false, message: "请先登录。" },
      { status: 401 }
    );
  }

  if (!canEdit) {
    return NextResponse.json(
      { success: false, message: "你没有修改玄鉴快报的权限。" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      content?: string;
    };

    const title = body.title?.trim() ?? "";
    const content = body.content?.trim() ?? "";

    if (!title) {
      return NextResponse.json(
        { success: false, message: "快报标题不能为空。" },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { success: false, message: "快报内容不能为空。" },
        { status: 400 }
      );
    }

    await prisma.homeBriefing.upsert({
      where: { slot: "home" },
      update: {
        title,
        content,
        updatedById: user.id,
      },
      create: {
        slot: "home",
        title,
        content,
        updatedById: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "玄鉴快报已更新。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error && error.message
            ? error.message
            : "更新失败，请稍后重试。",
      },
      { status: 500 }
    );
  }
}
