import { prisma } from "@/lib/prisma";

export const ONLINE_WINDOW_MINUTES = 5;
export const ONLINE_WINDOW_MS = ONLINE_WINDOW_MINUTES * 60 * 1000;

export async function touchUserActivity(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      lastActiveAt: new Date(),
    },
    select: {
      id: true,
    },
  });
}

export function getOnlineCutoffDate() {
  return new Date(Date.now() - ONLINE_WINDOW_MS);
}
