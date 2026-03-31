import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

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
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  }

  const id = await resolveId(params);
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!post) {
    return NextResponse.json({ error: "\u5e16\u5b50\u4e0d\u5b58\u5728\u3002" }, { status: 404 });
  }

  const isSiteAdmin =
    user.role === UserRole.OWNER || user.role === UserRole.ADMIN;
  const isAuthor = post.userId === user.id;

  if (!isSiteAdmin && !isAuthor) {
    return NextResponse.json(
      { error: "\u4f60\u6ca1\u6709\u5220\u9664\u8fd9\u7bc7\u5e16\u5b50\u7684\u6743\u9650\u3002" },
      { status: 403 }
    );
  }

  await prisma.$transaction([
    prisma.comment.deleteMany({
      where: {
        postId: id,
      },
    }),
    prisma.favorite.deleteMany({
      where: {
        postId: id,
      },
    }),
    prisma.post.delete({
      where: {
        id,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: "\u5e16\u5b50\u5df2\u5220\u9664\u3002",
  });
}
