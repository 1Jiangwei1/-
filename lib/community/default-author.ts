import { prisma } from "@/lib/prisma";

export async function ensureDiscussionAuthor() {
  const existingUser = await prisma.user.findFirst({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return existingUser;
  }

  return prisma.user.create({
    data: {
      email: "discussion-demo@local.test",
      username: "测试用户",
      passwordHash: "discussion-demo-user",
    },
    select: {
      id: true,
    },
  });
}
