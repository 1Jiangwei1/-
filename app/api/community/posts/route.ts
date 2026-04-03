import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  encodeCommunityPostContent,
  normalizeCommunityCategory,
} from "@/lib/community/post-content";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "请先登录后再发布帖子。",
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      title?: string;
      category?: string;
      content?: string;
    };

    const title = body.title?.trim() ?? "";
    const content = body.content?.trim() ?? "";
    const category = normalizeCommunityCategory(body.category?.trim() ?? "");

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: "标题不能为空。",
        },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          message: "正文不能为空。",
        },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        title,
        content: encodeCommunityPostContent(category, content),
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "发帖成功。",
      postId: post.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error && error.message
            ? error.message
            : "发帖失败，请稍后重试。",
      },
      { status: 500 }
    );
  }
}
