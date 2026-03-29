import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await prisma.loreEntry.findUnique({
    where: { slug },
    include: {
      relationsFrom: { include: { toEntry: true } },
      relationsTo: { include: { fromEntry: true } },
    },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    outbound: entry.relationsFrom.map((r) => ({ type: r.type, entry: r.toEntry })),
    inbound: entry.relationsTo.map((r) => ({ type: r.type, entry: r.fromEntry })),
  });
}
