import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

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
        { success: false, message: "请先登录后再点赞评论。" },
        { status: 401 }
      );
    }

    const commentId = await resolveId(params);

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, message: "评论不存在。" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`
          SELECT "id"
          FROM "CommentLike"
          WHERE "userId" = ${user.id} AND "commentId" = ${commentId}
          LIMIT 1
        `,
      );

      if (existing[0]?.id) {
        await tx.$executeRaw(
          Prisma.sql`
            DELETE FROM "CommentLike"
            WHERE "id" = ${existing[0].id}
          `,
        );
      } else {
        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO "CommentLike" ("id", "userId", "commentId", "createdAt")
            VALUES (${crypto.randomUUID()}, ${user.id}, ${commentId}, NOW())
          `,
        );
      }

      const counts = await tx.$queryRaw<Array<{ count: bigint }>>(
        Prisma.sql`
          SELECT COUNT(*)::bigint AS "count"
          FROM "CommentLike"
          WHERE "commentId" = ${commentId}
        `,
      );

      return {
        liked: !existing[0]?.id,
        likeCount: Number(counts[0]?.count ?? 0n),
      };
    });

    return NextResponse.json({
      success: true,
      message: result.liked ? "已点赞评论。" : "已取消点赞。",
      liked: result.liked,
      likeCount: result.likeCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error && error.message
            ? error.message
            : "评论点赞失败，请稍后重试。",
      },
      { status: 500 }
    );
  }
}
