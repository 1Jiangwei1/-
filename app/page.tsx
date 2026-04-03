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
    <div className="space-y-8 sm:space-y-10">
      <section className="surface-panel rounded-[32px] px-5 py-8 sm:px-7 sm:py-10">
        <div className="space-y-4">
          <p className="text-xs section-kicker">Xuanjian Archive</p>
          <div className="space-y-3">
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-stone-100 sm:text-4xl">
              玄鉴仙族社区
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-[#c0c7bc]">
              聚合世界观资料、讨论互动与人物战力排行，围绕玄鉴仙族的设定与剧情持续沉淀内容。
            </p>
          </div>
          <HomeBriefingCard
            title={briefing.title}
            content={briefing.content}
            updatedAtLabel={updatedAtLabel}
            canEdit={canEdit}
            canManageEditors={user?.role === UserRole.OWNER}
          />
        </div>
      </section>
    </div>
  );
}
