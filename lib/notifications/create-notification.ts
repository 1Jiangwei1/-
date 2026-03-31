import { prisma } from "@/lib/prisma";

export async function createNotification({
  userId,
  title,
  body,
}: {
  userId: string;
  title: string;
  body?: string;
}) {
  return prisma.notification.create({
    data: {
      userId,
      title,
      body,
    },
  });
}
