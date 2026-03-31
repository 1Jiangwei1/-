import { prisma } from "@/lib/prisma";

type SyncNotificationParams = {
  userId: string;
};

async function ensureNotification(userId: string, title: string, body: string) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      title,
      body,
    },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  await prisma.notification.create({
    data: {
      userId,
      title,
      body,
    },
  });
}

function readChangeNote(patch: unknown) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return "没有填写变更说明";
  }

  const record = patch as Record<string, unknown>;
  const value = record.changeNote;
  return typeof value === "string" && value.trim() ? value : "没有填写变更说明";
}

export async function syncUserNotifications({ userId }: SyncNotificationParams) {
  const [postComments, rankVotes, requests] = await Promise.all([
    prisma.comment.findMany({
      where: {
        post: { userId },
        NOT: { userId },
      },
      include: {
        user: true,
        post: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.rankVote.findMany({
      where: { userId },
      include: {
        rankItem: {
          include: {
            board: true,
            loreEntry: true,
          },
        },
      },
      take: 20,
    }),
    prisma.loreChangeRequest.findMany({
      where: {
        requesterId: userId,
        status: {
          in: ["APPROVED", "REJECTED"],
        },
      },
      include: {
        entry: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  for (const comment of postComments) {
    const actor = comment.user.username || comment.user.email || "有用户";
    const title = "你的帖子收到了新评论";
    const body = `${actor} 评论了《${comment.post?.title ?? "你的帖子"}》`;
    await ensureNotification(userId, title, body);
  }

  for (const vote of rankVotes) {
    const title = "你参与投票的榜单对象有新变化";
    const body = `${vote.rankItem.board.title}中的“${vote.rankItem.loreEntry?.title || "未命名对象"}”当前分数为 ${vote.rankItem.score}。`;
    await ensureNotification(userId, title, body);
  }

  for (const request of requests) {
    const title = request.status === "APPROVED" ? "你的修改申请已通过" : "你的修改申请未通过";
    const body = `${request.entry.title}：${readChangeNote(request.patch)}`;
    await ensureNotification(userId, title, body);
  }
}
