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
  request: Request,
  { params }: { params: RouteParams }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "请先登录后再发表评论。" },
        { status: 401 }
      );
    }

    const postId = await resolveId(params);
    const body = (await request.json()) as {
      content?: string;
    };
    const content = body.content?.trim() ?? "";

    if (!content) {
      return NextResponse.json(
        { success: false, message: "评论内容不能为空。" },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: "帖子不存在。" },
        { status: 404 }
      );
    }

    await prisma.comment.create({
      data: {
        postId,
        userId: user.id,
        content,
      },
    });

    return NextResponse.json({
      success: true,
      message: "评论成功。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error && error.message
            ? error.message
            : "评论失败，请稍后重试。",
      },
      { status: 500 }
    );
  }
}
