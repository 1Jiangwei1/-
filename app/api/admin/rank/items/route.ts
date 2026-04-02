import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      boardId?: string;
      title?: string;
      description?: string;
    };

    const boardId = body.boardId?.trim() ?? "";
    const title = body.title?.trim() ?? "";
    const description = body.description?.trim() ?? "";

    if (!boardId) {
      return NextResponse.json(
        {
          success: false,
          message: "榜单不能为空。",
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: "榜项名称不能为空。",
        },
        { status: 400 }
      );
    }

    const board = await prisma.rankBoard.findUnique({
      where: { id: boardId },
      select: { id: true },
    });

    if (!board) {
      return NextResponse.json(
        {
          success: false,
          message: "榜单不存在。",
        },
        { status: 404 }
      );
    }

    await prisma.rankItem.create({
      data: {
        boardId,
        loreEntryId: null,
        title,
        description: description || null,
        score: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "已成功加入榜单。",
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