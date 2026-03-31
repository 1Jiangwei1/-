import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

type FavoriteType = "lore" | "post" | "rank";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "请先登录后再收藏。",
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      type?: FavoriteType;
      targetId?: string;
    };

    const type = body.type;
    const targetId = body.targetId?.trim() ?? "";

    if (!type || !targetId) {
      return NextResponse.json(
        {
          success: false,
          message: "收藏信息不完整。",
        },
        { status: 400 }
      );
    }

    if (type === "lore") {
      const entry = await prisma.loreEntry.findUnique({
        where: { id: targetId },
        select: { id: true },
      });

      if (!entry) {
        return NextResponse.json(
          {
            success: false,
            message: "要收藏的词条不存在。",
          },
          { status: 404 }
        );
      }

      const existing = await prisma.favorite.findFirst({
        where: {
          userId: user.id,
          loreEntryId: targetId,
        },
        select: { id: true },
      });

      if (existing) {
        await prisma.favorite.delete({
          where: { id: existing.id },
        });

        return NextResponse.json({
          success: true,
          favorited: false,
          message: "已取消收藏词条。",
        });
      }

      await prisma.favorite.create({
        data: {
          userId: user.id,
          loreEntryId: targetId,
        },
      });

      return NextResponse.json({
        success: true,
        favorited: true,
        message: "已收藏词条。",
      });
    }

    if (type === "post") {
      const post = await prisma.post.findUnique({
        where: { id: targetId },
        select: { id: true },
      });

      if (!post) {
        return NextResponse.json(
          {
            success: false,
            message: "要收藏的帖子不存在。",
          },
          { status: 404 }
        );
      }

      const existing = await prisma.favorite.findFirst({
        where: {
          userId: user.id,
          postId: targetId,
        },
        select: { id: true },
      });

      if (existing) {
        await prisma.favorite.delete({
          where: { id: existing.id },
        });

        return NextResponse.json({
          success: true,
          favorited: false,
          message: "已取消收藏帖子。",
        });
      }

      await prisma.favorite.create({
        data: {
          userId: user.id,
          postId: targetId,
        },
      });

      return NextResponse.json({
        success: true,
        favorited: true,
        message: "已收藏帖子。",
      });
    }

    if (type === "rank") {
      const rankItem = await prisma.rankItem.findUnique({
        where: { id: targetId },
        select: { id: true },
      });

      if (!rankItem) {
        return NextResponse.json(
          {
            success: false,
            message: "要收藏的排行对象不存在。",
          },
          { status: 404 }
        );
      }

      const existing = await prisma.favorite.findFirst({
        where: {
          userId: user.id,
          rankItemId: targetId,
        },
        select: { id: true },
      });

      if (existing) {
        await prisma.favorite.delete({
          where: { id: existing.id },
        });

        return NextResponse.json({
          success: true,
          favorited: false,
          message: "已取消收藏排行对象。",
        });
      }

      await prisma.favorite.create({
        data: {
          userId: user.id,
          rankItemId: targetId,
        },
      });

      return NextResponse.json({
        success: true,
        favorited: true,
        message: "已收藏排行对象。",
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "不支持的收藏类型。",
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error && error.message
            ? error.message
            : "收藏操作失败，请稍后重试。",
      },
      { status: 500 }
    );
  }
}
