import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasAnyLoreCapability } from "@/lib/lore/permission";
import { prisma } from "@/lib/prisma";
import { matchesRankBoardCategory } from "@/lib/rank/boards";

export async function POST(request: Request) {
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
          message: "你没有修改战力榜的权限。",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      boardId?: string;
      loreEntryId?: string;
    };

    const boardId = body.boardId?.trim() ?? "";
    const loreEntryId = body.loreEntryId?.trim() ?? "";

    if (!boardId || !loreEntryId) {
      return NextResponse.json(
        {
          success: false,
          message: "榜单和词条不能为空。",
        },
        { status: 400 }
      );
    }

    const [board, entry, existingItem] = await Promise.all([
      prisma.rankBoard.findUnique({
        where: { id: boardId },
        select: { id: true, title: true },
      }),
      prisma.loreEntry.findUnique({
        where: { id: loreEntryId },
        select: { id: true, title: true, category: true },
      }),
      prisma.rankItem.findFirst({
        where: { boardId, loreEntryId },
        select: { id: true },
      }),
    ]);

    if (!board) {
      return NextResponse.json(
        {
          success: false,
          message: "榜单不存在。",
        },
        { status: 404 }
      );
    }

    if (!entry) {
      return NextResponse.json(
        {
          success: false,
          message: "词条不存在。",
        },
        { status: 404 }
      );
    }

    if (!matchesRankBoardCategory(board.title, entry.category)) {
      return NextResponse.json(
        {
          success: false,
          message: "当前只允许把人物词条加入人物榜。",
        },
        { status: 400 }
      );
    }

    if (existingItem) {
      return NextResponse.json(
        {
          success: false,
          message: "该词条已经在人物榜里了。",
        },
        { status: 400 }
      );
    }

    await prisma.rankItem.create({
      data: {
        boardId,
        loreEntryId,
        score: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "已成功加入人物榜。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error && error.message
            ? error.message
            : "添加失败，请稍后重试。",
      },
      { status: 500 }
    );
  }
}
