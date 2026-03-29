import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorldDetail } from "@/components/world/world-detail";

export default async function WorldDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await prisma.loreEntry.findUnique({
    where: { slug },
    include: {
      metas: true,
      relationsFrom: { include: { toEntry: true } },
      relationsTo: { include: { fromEntry: true } },
    },
  });
  if (!entry) notFound();

  const relations = [
    ...entry.relationsFrom.map((r) => ({ slug: r.toEntry.slug, title: r.toEntry.title, type: `OUT-${r.type}` })),
    ...entry.relationsTo.map((r) => ({ slug: r.fromEntry.slug, title: r.fromEntry.title, type: `IN-${r.type}` })),
  ];

  return <WorldDetail entry={entry} relations={relations} />;
}
