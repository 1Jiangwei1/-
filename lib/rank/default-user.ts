import { prisma } from "@/lib/prisma";

export async function ensureRankDefaultUser() {
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
      email: "rank-demo@local.test",
      username: "测试用户",
      passwordHash: "rank-demo-user",
    },
    select: {
      id: true,
    },
  });
}
