import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasAnyLoreCapability } from "@/lib/lore/permission";
import { prisma } from "@/lib/prisma";
import { getRankItemDisplayTitle } from "@/lib/rank/item-title";

type RouteParams = Promise<{
  id: string;
}>;

async function resolveId(params: RouteParams) {
  const resolved = await params;
  return resolved.id;
}

export async function DELETE(
  _request: Request,
  { params }: { params: RouteParams }
) {
  try {
    const user = await getCurrentUser();
    const hasLoreAdmin = await hasAnyLoreCapability(user?.id ?? null, "ADMIN");

    if (
      !user ||
      (!hasLoreAdmin && user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "\u4f60\u6ca1\u6709\u4fee\u6539\u6218\u529b\u699c\u7684\u6743\u9650\u3002",
        },
        { status: 403 }
      );
    }

    const id = await resolveId(params);
    const item = await prisma.rankItem.findUnique({
      where: { id },
      include: {
        board: {
          select: {
            title: true,
          },
        },
        loreEntry: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          message: "\u699c\u9879\u4e0d\u5b58\u5728\u3002",
        },
        { status: 404 }
      );
    }

    const notificationBodyPrefix = `${item.board.title}\u4e2d\u7684\u201c${getRankItemDisplayTitle(item)}\u201d`;

    await prisma.$transaction([
      prisma.notification.deleteMany({
        where: {
          title: "\u4f60\u53c2\u4e0e\u6295\u7968\u7684\u699c\u5355\u5bf9\u8c61\u6709\u65b0\u53d8\u5316",
          body: {
            contains: notificationBodyPrefix,
          },
        },
      }),
      prisma.favorite.deleteMany({
        where: {
          rankItemId: id,
        },
      }),
      prisma.rankVote.deleteMany({
        where: {
          rankItemId: id,
        },
      }),
      prisma.rankComment.deleteMany({
        where: {
          rankItemId: id,
        },
      }),
      prisma.rankItem.delete({
        where: {
          id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "\u699c\u9879\u5df2\u5220\u9664\u3002",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error && error.message
            ? error.message
            : "\u5220\u9664\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: RouteParams }
) {
  try {
    const user = await getCurrentUser();
    const hasLoreAdmin = await hasAnyLoreCapability(user?.id ?? null, "ADMIN");

    if (
      !user ||
      (!hasLoreAdmin && user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "\u4f60\u6ca1\u6709\u4fee\u6539\u6218\u529b\u699c\u7684\u6743\u9650\u3002",
        },
        { status: 403 }
      );
    }

    const id = await resolveId(params);
    const body = (await request.json()) as {
      description?: string;
    };
    const description = body.description?.trim() ?? "";

    const item = await prisma.rankItem.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          message: "\u699c\u9879\u4e0d\u5b58\u5728\u3002",
        },
        { status: 404 }
      );
    }

    await prisma.rankItem.update({
      where: { id },
      data: {
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "\u699c\u9879\u8bf4\u660e\u5df2\u66f4\u65b0\u3002",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error && error.message
            ? error.message
            : "\u66f4\u65b0\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002",
      },
      { status: 500 }
    );
  }
}