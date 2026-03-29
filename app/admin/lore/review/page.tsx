import { prisma } from "@/lib/prisma";
import { ChangeRequestsList } from "@/components/admin/change-requests-list";

export default async function AdminReviewPage() {
  const items = await prisma.loreChangeRequest.findMany({
    where: { status: "PENDING" },
    include: { requester: { select: { username: true } }, entry: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">修改审核</h1>
      <ChangeRequestsList items={items} />
    </section>
  );
}
