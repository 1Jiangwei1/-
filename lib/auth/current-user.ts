import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

export type CurrentUser = {
  id: string;
  email: string;
  username: string;
  role: string;
};

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
    },
  });
}
