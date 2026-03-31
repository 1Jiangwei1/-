import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

type RouteParams = Promise<{
  id: string;
}>;

async function resolveId(params: RouteParams) {
  const resolved = await params;
  return resolved.id;
}

export async function POST(
  _request: Request,
  { params }: { params: RouteParams }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "请先登录后再处理通知。",
        },
        { status: 401 }
      );
    }

    const id = await resolveId(params);

    await prisma.notification.updateMany({
      where: {
        id,
        userId: user.id,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "已标记为已读",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error && error.message
            ? error.message
            : "通知处理失败，请稍后重试。",
      },
      { status: 500 }
    );
  }
}
