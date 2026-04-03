import { UserRole } from "@prisma/client";

import HomeBriefingCard from "@/components/home/home-briefing-card";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canEditHomeBriefing } from "@/lib/home-briefing/permission";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const DEFAULT_BRIEFING = {
  title: "玄鉴快报",
  content: "这里将用于发布最新剧情走向与阶段快报，等待首次正式更新。",
};

export default async function HomePage() {
  const user = await getCurrentUser();
  const [existingBriefing, canEdit] = await Promise.all([
    prisma.homeBriefing.findUnique({
      where: { slot: "home" },
    }),
    canEditHomeBriefing(user?.id ?? null),
  ]);

  const briefing = existingBriefing ?? DEFAULT_BRIEFING;
  const updatedAtLabel = existingBriefing ? formatDate(existingBriefing.updatedAt) : "尚未发布";

  return (
    <HomeBriefingCard
      title={briefing.title}
      content={briefing.content}
      updatedAtLabel={updatedAtLabel}
      canEdit={canEdit}
      canManageEditors={user?.role === UserRole.OWNER}
    />
  );
}
